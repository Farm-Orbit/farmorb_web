-- FarmOrb Supabase schema: livestock
-- Adapted from farmorb_api migrations 007-014 (livestock slice).
--
-- Two deliberate departures from the Go schema:
--   * Actor columns (performed_by, added_by, audit_logs.user_id) reference
--     public.profiles instead of auth.users, so PostgREST can embed the actor's
--     name. profiles.id is auth.users.id, so the identity is the same.
--   * audit_logs rows are written by database triggers rather than API
--     middleware. ip_address / user_agent / request_id are therefore always
--     NULL — the database cannot see the HTTP request.

-- ---------------------------------------------------------------------------
-- Shared: updated_at maintenance
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Animals
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.animals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL,
    rfid TEXT,
    name TEXT,
    species TEXT NOT NULL,
    breed TEXT,
    sex TEXT NOT NULL CHECK (sex IN ('male', 'female', 'unknown')),
    birth_date DATE,
    birth_weight NUMERIC(10,2),
    current_weight NUMERIC(10,2),
    parent_sire_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
    parent_dam_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
    color TEXT,
    markings TEXT,
    tracking_type TEXT NOT NULL DEFAULT 'individual'
        CHECK (tracking_type IN ('individual', 'batch')),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'sold', 'deceased', 'transferred', 'culled')),
    status_reason TEXT,
    origin_type TEXT,
    origin_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (farm_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_animals_farm_id ON public.animals(farm_id);
CREATE INDEX IF NOT EXISTS idx_animals_tag_id ON public.animals(tag_id);
CREATE INDEX IF NOT EXISTS idx_animals_species ON public.animals(species);
CREATE INDEX IF NOT EXISTS idx_animals_status ON public.animals(status);
CREATE INDEX IF NOT EXISTS idx_animals_parent_sire ON public.animals(parent_sire_id);
CREATE INDEX IF NOT EXISTS idx_animals_parent_dam ON public.animals(parent_dam_id);

-- ---------------------------------------------------------------------------
-- Groups & animal membership
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    species TEXT NOT NULL DEFAULT 'mixed',
    purpose TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    capacity INTEGER,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive', 'archived')),
    notes TEXT,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_farm_id ON public.groups(farm_id);
CREATE INDEX IF NOT EXISTS idx_groups_species ON public.groups(species);
CREATE INDEX IF NOT EXISTS idx_groups_status ON public.groups(status);

CREATE TABLE IF NOT EXISTS public.animal_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    UNIQUE (animal_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_animal_groups_animal_id ON public.animal_groups(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_groups_group_id ON public.animal_groups(group_id);

CREATE TABLE IF NOT EXISTS public.animal_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
    from_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    to_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    moved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reason TEXT,
    notes TEXT,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_animal_movements_animal_id ON public.animal_movements(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_movements_moved_at ON public.animal_movements(moved_at DESC);

-- ---------------------------------------------------------------------------
-- Animal measurements
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.animal_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
    measurement_type TEXT NOT NULL CHECK (measurement_type IN (
        'weight', 'temperature', 'bcs', 'height', 'length', 'girth',
        'milk_production', 'wool_production', 'custom'
    )),
    value NUMERIC(10,2) NOT NULL,
    unit TEXT NOT NULL,
    measured_at TIMESTAMPTZ NOT NULL,
    notes TEXT,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_animal_measurements_farm_id ON public.animal_measurements(farm_id);
CREATE INDEX IF NOT EXISTS idx_animal_measurements_animal_id ON public.animal_measurements(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_measurements_measured_at ON public.animal_measurements(measured_at DESC);

-- ---------------------------------------------------------------------------
-- Health records & schedules
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.health_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    animal_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    record_type TEXT NOT NULL
        CHECK (record_type IN ('treatment', 'vaccination', 'inspection', 'injury', 'note')),
    title TEXT NOT NULL,
    description TEXT,
    performed_at TIMESTAMPTZ NOT NULL,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    vet_name TEXT,
    medication TEXT,
    dosage TEXT,
    withdrawal_period_days INTEGER,
    cost NUMERIC(12,2),
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    follow_up_date DATE,
    outcome TEXT,
    health_score NUMERIC(4,1)
        CHECK (health_score IS NULL OR (health_score >= 0 AND health_score <= 100)),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_records_farm_performed_at
    ON public.health_records(farm_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_records_animal
    ON public.health_records(animal_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_records_group
    ON public.health_records(group_id, performed_at DESC);

-- Health schedules had no table in farmorb_api; the shape is taken from the
-- frontend's HealthSchedule type, which the Go handlers never implemented.
CREATE TABLE IF NOT EXISTS public.health_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('animal', 'group')),
    target_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    frequency_type TEXT NOT NULL CHECK (frequency_type IN ('once', 'recurring')),
    frequency_interval_days INTEGER
        CHECK (frequency_interval_days IS NULL OR frequency_interval_days > 0),
    start_date DATE NOT NULL,
    lead_time_days INTEGER NOT NULL DEFAULT 0 CHECK (lead_time_days >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT health_schedule_recurring_interval CHECK (
        frequency_type <> 'recurring' OR frequency_interval_days IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_health_schedules_farm_id ON public.health_schedules(farm_id);
CREATE INDEX IF NOT EXISTS idx_health_schedules_target ON public.health_schedules(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_health_schedules_active ON public.health_schedules(farm_id, active);

-- ---------------------------------------------------------------------------
-- Breeding records
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.breeding_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
    record_type TEXT NOT NULL
        CHECK (record_type IN ('heat', 'breeding', 'pregnancy_check', 'birth')),
    event_date DATE NOT NULL,
    mate_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
    method TEXT CHECK (method IS NULL OR method IN ('natural', 'ai', 'embryo')),
    status TEXT NOT NULL
        CHECK (status IN ('planned', 'in_progress', 'confirmed', 'failed', 'completed')),
    gestation_days INTEGER CHECK (gestation_days IS NULL OR gestation_days > 0),
    expected_due_date DATE,
    actual_due_date DATE,
    offspring_count INTEGER CHECK (offspring_count IS NULL OR offspring_count >= 0),
    offspring_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_breeding_records_farm_event
    ON public.breeding_records(farm_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_breeding_records_animal
    ON public.breeding_records(animal_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_breeding_records_status ON public.breeding_records(status);

-- ---------------------------------------------------------------------------
-- Inventory: suppliers, items, transactions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_info JSONB NOT NULL DEFAULT '{}'::jsonb,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_farm_id ON public.suppliers(farm_id);

CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL
        CHECK (category IN ('feed', 'medication', 'equipment', 'supplies', 'other')),
    quantity NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    unit TEXT NOT NULL DEFAULT 'kg',
    cost_per_unit NUMERIC(10,2) CHECK (cost_per_unit IS NULL OR cost_per_unit >= 0),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    expiry_date DATE,
    low_stock_threshold NUMERIC(10,2)
        CHECK (low_stock_threshold IS NULL OR low_stock_threshold >= 0),
    -- PostgREST cannot compare two columns in a filter, so the low-stock test
    -- the Go API did in SQL is materialised here instead.
    is_low_stock BOOLEAN GENERATED ALWAYS AS (
        low_stock_threshold IS NOT NULL AND quantity <= low_stock_threshold
    ) STORED,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_farm_id ON public.inventory_items(farm_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_supplier_id ON public.inventory_items(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_low_stock
    ON public.inventory_items(farm_id) WHERE is_low_stock;

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL
        CHECK (transaction_type IN ('purchase', 'usage', 'restock', 'adjustment', 'loss')),
    quantity NUMERIC(10,2) NOT NULL,
    cost NUMERIC(10,2) CHECK (cost IS NULL OR cost >= 0),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    notes TEXT,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_farm_id ON public.inventory_transactions(farm_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_id
    ON public.inventory_transactions(inventory_item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON public.inventory_transactions(transaction_type);

-- The Go handler adjusted inventory_items.quantity in the same transaction as
-- the ledger insert. Moving that to a trigger keeps stock correct no matter
-- which client writes the transaction.
CREATE OR REPLACE FUNCTION public.apply_inventory_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_delta NUMERIC(10,2);
BEGIN
    v_delta := CASE NEW.transaction_type
        WHEN 'purchase'   THEN ABS(NEW.quantity)
        WHEN 'restock'    THEN ABS(NEW.quantity)
        WHEN 'usage'      THEN -ABS(NEW.quantity)
        WHEN 'loss'       THEN -ABS(NEW.quantity)
        WHEN 'adjustment' THEN NEW.quantity
    END;

    UPDATE public.inventory_items
    SET quantity = quantity + v_delta
    WHERE id = NEW.inventory_item_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apply_inventory_transaction ON public.inventory_transactions;
CREATE TRIGGER apply_inventory_transaction
    AFTER INSERT ON public.inventory_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.apply_inventory_transaction();

-- ---------------------------------------------------------------------------
-- Feeding records
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feeding_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    animal_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
    feed_type TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    unit TEXT NOT NULL,
    date DATE NOT NULL,
    cost NUMERIC(10,2) CHECK (cost IS NULL OR cost >= 0),
    notes TEXT,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT feeding_record_target_check CHECK (
        (animal_id IS NOT NULL AND group_id IS NULL) OR
        (animal_id IS NULL AND group_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_feeding_records_farm_id ON public.feeding_records(farm_id);
CREATE INDEX IF NOT EXISTS idx_feeding_records_animal_id ON public.feeding_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_feeding_records_group_id ON public.feeding_records(group_id);
CREATE INDEX IF NOT EXISTS idx_feeding_records_date ON public.feeding_records(date DESC);

-- ---------------------------------------------------------------------------
-- Audit logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    -- Intentionally not a foreign key: deleting a farm cascades into the
    -- audited tables, whose DELETE triggers then insert audit rows referencing
    -- the farm being deleted. A plain column keeps the trail intact and lets
    -- the cascade finish.
    farm_id UUID,
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    changes JSONB,
    ip_address TEXT,
    user_agent TEXT,
    request_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_farm_created
    ON public.audit_logs(farm_id, created_at DESC);

-- Generic audit trigger. TG_ARGV[0] is the singular entity_type the frontend
-- filters on ('animal', 'group', ...); TG_ARGV[1], when present, names a column
-- to resolve farm_id through for tables that have no farm_id of their own.
CREATE OR REPLACE FUNCTION public.record_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old JSONB;
    v_new JSONB;
    v_row JSONB;
    v_changes JSONB;
    v_farm_id UUID;
    v_action TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_new := to_jsonb(NEW);
        v_action := 'create';
    ELSIF TG_OP = 'UPDATE' THEN
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
        v_action := 'update';
    ELSE
        v_old := to_jsonb(OLD);
        v_action := 'delete';
    END IF;

    v_row := COALESCE(v_new, v_old);

    IF TG_NARGS > 1 THEN
        SELECT a.farm_id INTO v_farm_id
        FROM public.animals a
        WHERE a.id = (v_row ->> TG_ARGV[1])::uuid;
    ELSIF TG_TABLE_NAME = 'farms' THEN
        v_farm_id := (v_row ->> 'id')::uuid;
    ELSE
        v_farm_id := (v_row ->> 'farm_id')::uuid;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        -- Keys are 'old'/'new' because that is the shape the activity table
        -- reads (FarmActivity's getSummary), inherited from the Go API.
        SELECT jsonb_object_agg(k, jsonb_build_object('old', v_old -> k, 'new', v_new -> k))
        INTO v_changes
        FROM jsonb_object_keys(v_new) AS k
        WHERE v_new -> k IS DISTINCT FROM v_old -> k
          AND k <> 'updated_at';

        -- A write that only bumped updated_at is not worth an audit row.
        IF v_changes IS NULL THEN
            RETURN NEW;
        END IF;
    END IF;

    INSERT INTO public.audit_logs (
        user_id, farm_id, action_type, entity_type, entity_id,
        old_values, new_values, changes
    )
    VALUES (
        auth.uid(), v_farm_id, v_action, TG_ARGV[0], (v_row ->> 'id')::uuid,
        v_old, v_new, v_changes
    );

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- ---------------------------------------------------------------------------
-- Triggers: updated_at + audit
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    v_spec RECORD;
BEGIN
    FOR v_spec IN
        SELECT * FROM (VALUES
            -- Farm-level tables live in the crops migration but were audited by
            -- the Go API too, and the activity tab filters on them.
            ('farms',                  'farm',              NULL,         FALSE),
            ('farm_members',           'user',              NULL,         FALSE),
            ('farm_invitations',       'invitation',        NULL,         FALSE),
            ('animals',                'animal',            NULL,         TRUE),
            ('groups',                 'group',             NULL,         TRUE),
            ('animal_measurements',    'measurement',       NULL,         TRUE),
            ('health_records',         'health_record',     NULL,         TRUE),
            ('health_schedules',       'health_schedule',   NULL,         TRUE),
            ('breeding_records',       'breeding_record',   NULL,         TRUE),
            ('suppliers',              'supplier',          NULL,         TRUE),
            ('inventory_items',        'inventory_item',    NULL,         TRUE),
            ('feeding_records',        'feeding_record',    NULL,         TRUE),
            -- Append-only ledgers: no updated_at column to maintain.
            ('inventory_transactions', 'inventory_txn',     NULL,         FALSE),
            ('animal_groups',          'group_membership',  'animal_id',  FALSE),
            ('animal_movements',       'animal_movement',   'animal_id',  FALSE)
        ) AS t(table_name, entity_type, farm_via, has_updated_at)
    LOOP
        IF v_spec.has_updated_at THEN
            EXECUTE format(
                'DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
                 CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I
                 FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
                v_spec.table_name, v_spec.table_name
            );
        END IF;

        EXECUTE format(
            'DROP TRIGGER IF EXISTS record_audit_log ON public.%I;
             CREATE TRIGGER record_audit_log
             AFTER INSERT OR UPDATE OR DELETE ON public.%I
             FOR EACH ROW EXECUTE FUNCTION public.record_audit_log(%L%s)',
            v_spec.table_name,
            v_spec.table_name,
            v_spec.entity_type,
            CASE WHEN v_spec.farm_via IS NULL THEN '' ELSE format(', %L', v_spec.farm_via) END
        );
    END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_animal_farm_member(p_animal_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.animals a
        WHERE a.id = p_animal_id
          AND public.is_farm_member(a.farm_id)
    );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breeding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feeding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Farm-scoped tables: any member of the farm may read and write.
DO $$
DECLARE
    v_table TEXT;
BEGIN
    FOREACH v_table IN ARRAY ARRAY[
        'animals', 'groups', 'animal_measurements', 'health_records',
        'health_schedules', 'breeding_records', 'suppliers',
        'inventory_items', 'inventory_transactions', 'feeding_records'
    ]
    LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON public.%I;
             CREATE POLICY %I ON public.%I
             FOR SELECT USING (public.is_farm_member(farm_id))',
            v_table || '_select', v_table, v_table || '_select', v_table
        );
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON public.%I;
             CREATE POLICY %I ON public.%I
             FOR INSERT WITH CHECK (public.is_farm_member(farm_id))',
            v_table || '_insert', v_table, v_table || '_insert', v_table
        );
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON public.%I;
             CREATE POLICY %I ON public.%I
             FOR UPDATE USING (public.is_farm_member(farm_id))
             WITH CHECK (public.is_farm_member(farm_id))',
            v_table || '_update', v_table, v_table || '_update', v_table
        );
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON public.%I;
             CREATE POLICY %I ON public.%I
             FOR DELETE USING (public.is_farm_member(farm_id))',
            v_table || '_delete', v_table, v_table || '_delete', v_table
        );
    END LOOP;
END;
$$;

-- Animal-scoped join tables reach the farm through the animal.
CREATE POLICY animal_groups_select ON public.animal_groups
    FOR SELECT USING (public.is_animal_farm_member(animal_id));
CREATE POLICY animal_groups_insert ON public.animal_groups
    FOR INSERT WITH CHECK (public.is_animal_farm_member(animal_id));
CREATE POLICY animal_groups_update ON public.animal_groups
    FOR UPDATE USING (public.is_animal_farm_member(animal_id))
    WITH CHECK (public.is_animal_farm_member(animal_id));
CREATE POLICY animal_groups_delete ON public.animal_groups
    FOR DELETE USING (public.is_animal_farm_member(animal_id));

CREATE POLICY animal_movements_select ON public.animal_movements
    FOR SELECT USING (public.is_animal_farm_member(animal_id));
CREATE POLICY animal_movements_insert ON public.animal_movements
    FOR INSERT WITH CHECK (public.is_animal_farm_member(animal_id));
CREATE POLICY animal_movements_delete ON public.animal_movements
    FOR DELETE USING (public.is_animal_farm_member(animal_id));

-- Audit logs are readable by farm members and written only by the trigger,
-- which is SECURITY DEFINER and so bypasses the missing INSERT policy.
CREATE POLICY audit_logs_select ON public.audit_logs
    FOR SELECT USING (
        (farm_id IS NOT NULL AND public.is_farm_member(farm_id))
        OR (farm_id IS NULL AND user_id = auth.uid())
    );

-- ---------------------------------------------------------------------------
-- Grants
--
-- RLS narrows what a row-level query may touch, but the role still needs the
-- table privilege underneath it. Audit logs are read-only to clients: the
-- trigger writes them.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    v_table TEXT;
BEGIN
    FOREACH v_table IN ARRAY ARRAY[
        'animals', 'groups', 'animal_groups', 'animal_movements',
        'animal_measurements', 'health_records', 'health_schedules',
        'breeding_records', 'suppliers', 'inventory_items',
        'inventory_transactions', 'feeding_records'
    ]
    LOOP
        EXECUTE format(
            'GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated',
            v_table
        );
    END LOOP;
END;
$$;

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_animal_farm_member TO authenticated;
