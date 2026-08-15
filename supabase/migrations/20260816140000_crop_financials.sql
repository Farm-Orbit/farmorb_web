-- FarmOrb: costs and revenue for the crop module.
--
-- CR-3 from docs/CROP_BUILD_PLAN.md. The question a grower actually asks is
-- "what did a kilo cost me, and did this block pay". Answering it needs costs
-- attributable to a block and revenue traceable back to a harvest.
--
-- Most expenses are never typed. Labour and inputs come from the activities
-- recorded in CR-2, because a ledger someone fills in by hand is the thing
-- farm software exists to remove.

-- ---------------------------------------------------------------------------
-- Currency and labour rate
--
-- One currency per farm, deliberately. Multi-currency needs rate tables and a
-- reporting currency, and nothing here yet justifies that.
-- ---------------------------------------------------------------------------
ALTER TABLE public.farms
    ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD',
    -- Used to turn logged labour hours into a cost. Without it, hours are
    -- recorded but never priced.
    ADD COLUMN IF NOT EXISTS labour_rate_per_hour NUMERIC(12, 2)
        CHECK (labour_rate_per_hour IS NULL OR labour_rate_per_hour >= 0);

-- ---------------------------------------------------------------------------
-- Expense categories (global reference)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expense_categories (
    code TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 100
);

INSERT INTO public.expense_categories (code, label, sort_order) VALUES
    ('inputs',      'Inputs',              10),
    ('labour',      'Labour',              20),
    ('machinery',   'Machinery & fuel',    30),
    ('irrigation',  'Water & irrigation',  40),
    ('land',        'Land & rent',         50),
    ('services',    'Services & contracts',60),
    ('certification','Certification',      70),
    ('transport',   'Transport',           80),
    ('other',       'Other',               99)
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Expenses
--
-- Allocation is as specific as the cost genuinely is: a spray belongs to a
-- cycle, a land rent to the farm. Anything left NULL simply means "not that
-- specific", so the rollups can attribute what is attributable and no more.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    expense_date DATE NOT NULL,
    category TEXT NOT NULL REFERENCES public.expense_categories(code),
    description TEXT,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),

    location_id UUID REFERENCES public.grow_locations(id) ON DELETE SET NULL,
    planting_id UUID REFERENCES public.plantings(id) ON DELETE SET NULL,
    cycle_id UUID REFERENCES public.planting_cycles(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,

    -- Provenance. A derived row points at the event that produced it, so the
    -- ledger can show where a number came from; growers do not trust a margin
    -- they cannot trace.
    crop_activity_id UUID REFERENCES public.crop_activities(id) ON DELETE CASCADE,
    is_derived BOOLEAN NOT NULL DEFAULT false,

    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One derived expense per activity per category; re-deriving updates
    -- rather than accumulating duplicates.
    CONSTRAINT expenses_derived_unique UNIQUE (crop_activity_id, category)
);

CREATE INDEX IF NOT EXISTS idx_expenses_farm_date
    ON public.expenses(farm_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_planting ON public.expenses(planting_id);
CREATE INDEX IF NOT EXISTS idx_expenses_cycle ON public.expenses(cycle_id);

-- ---------------------------------------------------------------------------
-- Sales
--
-- A sale starts from a harvest, so quantity sold can be checked against
-- quantity picked. Customers are a name for now; a customers table arrives
-- with the sales epic in docs/FARM_DOMAIN_MAP.md.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    harvest_id UUID REFERENCES public.harvests(id) ON DELETE SET NULL,
    sale_date DATE NOT NULL,
    channel TEXT NOT NULL DEFAULT 'wholesale' CHECK (channel IN (
        'export', 'wholesale', 'farm_gate', 'processing', 'other'
    )),
    customer_name TEXT,
    quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
    quantity_unit TEXT NOT NULL,
    unit_price NUMERIC(14, 4) NOT NULL CHECK (unit_price >= 0),
    total_amount NUMERIC(16, 2) GENERATED ALWAYS AS (
        ROUND(quantity * unit_price, 2)
    ) STORED,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_farm_date ON public.sales(farm_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_harvest ON public.sales(harvest_id);

-- You cannot sell more than you picked. Without this the margin is fiction.
CREATE OR REPLACE FUNCTION public.enforce_sale_within_harvest()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_harvested NUMERIC;
    v_unit TEXT;
    v_sold NUMERIC;
BEGIN
    IF NEW.harvest_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT quantity, quantity_unit INTO v_harvested, v_unit
    FROM public.harvests WHERE id = NEW.harvest_id;

    -- Comparing quantities across different units would be worse than not
    -- checking, so only enforce when they agree.
    IF v_unit IS DISTINCT FROM NEW.quantity_unit THEN
        RETURN NEW;
    END IF;

    SELECT COALESCE(sum(quantity), 0) INTO v_sold
    FROM public.sales
    WHERE harvest_id = NEW.harvest_id AND id <> COALESCE(NEW.id, gen_random_uuid());

    IF v_sold + NEW.quantity > v_harvested THEN
        RAISE EXCEPTION
            'Sale exceeds the harvest: % % picked, % % already sold, % % attempted',
            v_harvested, v_unit, v_sold, v_unit, NEW.quantity, NEW.quantity_unit
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_sale_within_harvest ON public.sales;
CREATE TRIGGER enforce_sale_within_harvest
    BEFORE INSERT OR UPDATE OF quantity, harvest_id ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_sale_within_harvest();

-- ---------------------------------------------------------------------------
-- Deriving expenses from activities
--
-- Logging the spray is the whole entry. Input cost comes from the product's
-- unit cost, labour from the farm's hourly rate. Both are attributed to
-- whatever the activity targeted.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.derive_expenses_for_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cost_per_unit NUMERIC;
    v_labour_rate NUMERIC;
    v_input_cost NUMERIC;
    v_labour_cost NUMERIC;
BEGIN
    -- Inputs
    IF NEW.inventory_item_id IS NOT NULL AND COALESCE(NEW.quantity, 0) > 0 THEN
        SELECT cost_per_unit INTO v_cost_per_unit
        FROM public.inventory_items WHERE id = NEW.inventory_item_id;

        IF v_cost_per_unit IS NOT NULL THEN
            v_input_cost := ROUND(NEW.quantity * v_cost_per_unit, 2);

            INSERT INTO public.expenses (
                farm_id, expense_date, category, description, amount,
                location_id, planting_id, cycle_id,
                crop_activity_id, is_derived, created_by
            )
            VALUES (
                NEW.farm_id, NEW.activity_date, 'inputs',
                COALESCE(NEW.product_name, 'Input') || ' — ' || NEW.activity_type,
                v_input_cost,
                NEW.location_id, NEW.planting_id, NEW.cycle_id,
                NEW.id, true, NEW.performed_by
            )
            ON CONFLICT (crop_activity_id, category) DO UPDATE
                SET amount = EXCLUDED.amount, updated_at = NOW();
        END IF;
    END IF;

    -- Labour
    IF COALESCE(NEW.labour_hours, 0) > 0 THEN
        SELECT labour_rate_per_hour INTO v_labour_rate
        FROM public.farms WHERE id = NEW.farm_id;

        IF v_labour_rate IS NOT NULL THEN
            v_labour_cost := ROUND(NEW.labour_hours * v_labour_rate, 2);

            INSERT INTO public.expenses (
                farm_id, expense_date, category, description, amount,
                location_id, planting_id, cycle_id,
                crop_activity_id, is_derived, created_by
            )
            VALUES (
                NEW.farm_id, NEW.activity_date, 'labour',
                NEW.labour_hours || ' h — ' || NEW.activity_type,
                v_labour_cost,
                NEW.location_id, NEW.planting_id, NEW.cycle_id,
                NEW.id, true, NEW.performed_by
            )
            ON CONFLICT (crop_activity_id, category) DO UPDATE
                SET amount = EXCLUDED.amount, updated_at = NOW();
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS derive_expenses_for_activity ON public.crop_activities;
CREATE TRIGGER derive_expenses_for_activity
    AFTER INSERT OR UPDATE OF quantity, labour_hours, inventory_item_id, activity_date
    ON public.crop_activities
    FOR EACH ROW
    EXECUTE FUNCTION public.derive_expenses_for_activity();

-- ---------------------------------------------------------------------------
-- Rollups
--
-- security_invoker so the caller's RLS applies; without it a view owned by the
-- definer would happily read every farm.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.planting_financials
WITH (security_invoker = true) AS
SELECT
    p.id                AS planting_id,
    p.farm_id,
    p.location_id,
    ct.name             AS crop_name,
    COALESCE(cost.total, 0)      AS total_cost,
    COALESCE(revenue.total, 0)   AS total_revenue,
    COALESCE(revenue.total, 0) - COALESCE(cost.total, 0) AS margin,
    COALESCE(picked.total_kg, 0) AS harvested_kg,
    CASE
        WHEN COALESCE(picked.total_kg, 0) > 0
        THEN ROUND(COALESCE(cost.total, 0) / picked.total_kg, 4)
    END                 AS cost_per_kg
FROM public.plantings p
LEFT JOIN public.crop_types ct ON ct.id = p.crop_type_id
LEFT JOIN LATERAL (
    SELECT sum(e.amount) AS total
    FROM public.expenses e
    WHERE e.planting_id = p.id
) cost ON true
LEFT JOIN LATERAL (
    SELECT sum(s.total_amount) AS total
    FROM public.sales s
    JOIN public.harvests h ON h.id = s.harvest_id
    WHERE h.planting_id = p.id
) revenue ON true
LEFT JOIN LATERAL (
    -- Harvests may be recorded in crates or tonnes; normalise what we can and
    -- ignore what we cannot, rather than adding incompatible numbers.
    SELECT sum(public.to_base_unit(h.quantity, h.quantity_unit)) AS total_kg
    FROM public.harvests h
    WHERE h.planting_id = p.id
      AND public.to_base_unit(h.quantity, h.quantity_unit) IS NOT NULL
) picked ON true;

CREATE OR REPLACE VIEW public.cycle_financials
WITH (security_invoker = true) AS
SELECT
    c.id                AS cycle_id,
    c.planting_id,
    p.farm_id,
    c.cycle_number,
    c.cycle_type,
    c.season_year,
    COALESCE(cost.total, 0)    AS total_cost,
    COALESCE(revenue.total, 0) AS total_revenue,
    COALESCE(revenue.total, 0) - COALESCE(cost.total, 0) AS margin,
    COALESCE(picked.total_kg, 0) AS harvested_kg
FROM public.planting_cycles c
JOIN public.plantings p ON p.id = c.planting_id
LEFT JOIN LATERAL (
    SELECT sum(e.amount) AS total FROM public.expenses e WHERE e.cycle_id = c.id
) cost ON true
LEFT JOIN LATERAL (
    SELECT sum(s.total_amount) AS total
    FROM public.sales s
    JOIN public.harvests h ON h.id = s.harvest_id
    WHERE h.cycle_id = c.id
) revenue ON true
LEFT JOIN LATERAL (
    SELECT sum(public.to_base_unit(h.quantity, h.quantity_unit)) AS total_kg
    FROM public.harvests h
    WHERE h.cycle_id = c.id
      AND public.to_base_unit(h.quantity, h.quantity_unit) IS NOT NULL
) picked ON true;

-- ---------------------------------------------------------------------------
-- Triggers, RLS, grants
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    v_spec RECORD;
BEGIN
    FOR v_spec IN
        SELECT * FROM (VALUES ('expenses', 'expense'), ('sales', 'sale'))
        AS t(table_name, entity_type)
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
             CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I
             FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
            v_spec.table_name, v_spec.table_name);
        EXECUTE format(
            'DROP TRIGGER IF EXISTS record_audit_log ON public.%I;
             CREATE TRIGGER record_audit_log
             AFTER INSERT OR UPDATE OR DELETE ON public.%I
             FOR EACH ROW EXECUTE FUNCTION public.record_audit_log(%L)',
            v_spec.table_name, v_spec.table_name, v_spec.entity_type);
    END LOOP;
END;
$$;

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    v_table TEXT;
BEGIN
    FOREACH v_table IN ARRAY ARRAY['expenses', 'sales']
    LOOP
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR SELECT USING (public.is_farm_member(farm_id))',
            v_table || '_select', v_table);
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (public.is_farm_member(farm_id))',
            v_table || '_insert', v_table);
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR UPDATE USING (public.is_farm_member(farm_id))
             WITH CHECK (public.is_farm_member(farm_id))',
            v_table || '_update', v_table);
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR DELETE USING (public.is_farm_member(farm_id))',
            v_table || '_delete', v_table);
    END LOOP;
END;
$$;

CREATE POLICY expense_categories_select ON public.expense_categories
    FOR SELECT USING (auth.uid() IS NOT NULL);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT SELECT ON public.expense_categories TO authenticated;
GRANT SELECT ON public.planting_financials TO authenticated;
GRANT SELECT ON public.cycle_financials TO authenticated;
