-- FarmOrb: crop activities, scouting observations, and plant-protection rules.
--
-- CR-2 from docs/CROP_BUILD_PLAN.md. This is the spine of the crop module:
-- everything done to a crop between planting and harvest. Cost accounting
-- (CR-3) and disease history both hang off it, and pre-harvest intervals
-- become a rule the database enforces rather than a note someone remembers.

-- ---------------------------------------------------------------------------
-- Units
--
-- The build plan flagged this as a decision to take before quantities spread
-- across activities, expenses and sales. The call: record what the user
-- actually typed (they said "3 crates", not "54 kg") and convert on read via a
-- known table, so aggregation is consistent without forcing entry into one
-- unit. Farm-specific units — a crate's weight differs by farm — are a later
-- override on top of this, not a different model.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.unit_conversions (
    unit TEXT PRIMARY KEY,
    dimension TEXT NOT NULL CHECK (dimension IN ('mass', 'volume', 'area', 'count', 'time')),
    base_unit TEXT NOT NULL,
    factor_to_base NUMERIC(20, 8) NOT NULL CHECK (factor_to_base > 0)
);

INSERT INTO public.unit_conversions (unit, dimension, base_unit, factor_to_base) VALUES
    ('g',      'mass',   'kg', 0.001),
    ('kg',     'mass',   'kg', 1),
    ('t',      'mass',   'kg', 1000),
    ('lb',     'mass',   'kg', 0.45359237),
    ('ml',     'volume', 'l',  0.001),
    ('l',      'volume', 'l',  1),
    ('gal',    'volume', 'l',  3.785411784),
    ('m2',     'area',   'ha', 0.0001),
    ('ha',     'area',   'ha', 1),
    ('acre',   'area',   'ha', 0.40468564),
    ('each',   'count',  'each', 1),
    ('hour',   'time',   'hour', 1)
ON CONFLICT (unit) DO NOTHING;

-- Returns NULL for an unknown unit rather than guessing — a wrong conversion
-- is worse than an absent one.
CREATE OR REPLACE FUNCTION public.to_base_unit(p_value NUMERIC, p_unit TEXT)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT p_value * uc.factor_to_base
    FROM public.unit_conversions uc
    WHERE uc.unit = lower(trim(p_unit));
$$;

-- ---------------------------------------------------------------------------
-- Crop activities
--
-- One table for every field operation. Spray-specific columns live here rather
-- than in a side table: a spray is an activity that happens to carry more
-- detail, and splitting it would mean two queries for one timeline.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crop_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,

    -- An activity targets a planting, or bare land (land prep, pre-plant
    -- weeding) via a location. At least one must be present.
    planting_id UUID REFERENCES public.plantings(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.grow_locations(id) ON DELETE SET NULL,
    cycle_id UUID REFERENCES public.planting_cycles(id) ON DELETE SET NULL,

    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'irrigation', 'fertilisation', 'spray', 'pruning', 'induction',
        'thinning', 'bagging', 'weeding', 'land_prep', 'other'
    )),
    activity_date DATE NOT NULL,

    -- What was used. inventory_item_id links to stock so the activity can
    -- consume it; product_name covers anything not carried in inventory.
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
    product_name TEXT,
    active_ingredient TEXT,
    rate NUMERIC(12, 4) CHECK (rate IS NULL OR rate >= 0),
    rate_unit TEXT,
    water_volume_l NUMERIC(10, 2) CHECK (water_volume_l IS NULL OR water_volume_l >= 0),
    quantity NUMERIC(12, 3) CHECK (quantity IS NULL OR quantity >= 0),
    quantity_unit TEXT,

    -- Compliance. A spray without phi_days cannot restrict a harvest, so the
    -- product record should supply it and the form should insist.
    phi_days INTEGER CHECK (phi_days IS NULL OR phi_days >= 0),
    rei_hours INTEGER CHECK (rei_hours IS NULL OR rei_hours >= 0),
    equipment TEXT,
    weather_conditions JSONB,

    labour_hours NUMERIC(8, 2) CHECK (labour_hours IS NULL OR labour_hours >= 0),
    worker_count INTEGER CHECK (worker_count IS NULL OR worker_count > 0),
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- One submission across six blocks writes six rows sharing a batch_id, so
    -- the timeline can read it back as one action rather than six.
    batch_id UUID,

    notes TEXT,
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT crop_activity_target_required CHECK (
        planting_id IS NOT NULL OR location_id IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_crop_activities_farm_date
    ON public.crop_activities(farm_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_crop_activities_planting
    ON public.crop_activities(planting_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_crop_activities_batch
    ON public.crop_activities(batch_id) WHERE batch_id IS NOT NULL;
-- Supports the pre-harvest interval lookup, which only cares about sprays.
CREATE INDEX IF NOT EXISTS idx_crop_activities_phi
    ON public.crop_activities(planting_id, activity_date)
    WHERE activity_type = 'spray' AND phi_days IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Scouting observations
--
-- Different shape from an activity: what was seen and how bad, not what was
-- applied. eppo_code is here now so the reference pest library in
-- docs/FARM_DOMAIN_MAP.md can attach later without a migration.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crop_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    planting_id UUID REFERENCES public.plantings(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.grow_locations(id) ON DELETE SET NULL,

    observed_on DATE NOT NULL,
    observation_type TEXT NOT NULL CHECK (observation_type IN (
        'pest', 'disease', 'deficiency', 'damage', 'other'
    )),
    problem_name TEXT,
    eppo_code TEXT,
    -- Worded rather than numeric: "moderate" is repeatable between people in a
    -- way that "6" is not.
    severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN (
        'trace', 'low', 'moderate', 'high', 'severe'
    )),
    incidence_percent NUMERIC(5, 2)
        CHECK (incidence_percent IS NULL OR (incidence_percent >= 0 AND incidence_percent <= 100)),
    growth_stage TEXT,
    observed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT crop_observation_target_required CHECK (
        planting_id IS NOT NULL OR location_id IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_crop_observations_farm_date
    ON public.crop_observations(farm_id, observed_on DESC);
CREATE INDEX IF NOT EXISTS idx_crop_observations_planting
    ON public.crop_observations(planting_id, observed_on DESC);

-- ---------------------------------------------------------------------------
-- An activity consumes stock
--
-- The user logs the spray; they do not also log an inventory movement. Writing
-- a transaction here means stock decrements through the existing path, whose
-- own trigger adjusts inventory_items.quantity.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.consume_inventory_for_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.inventory_item_id IS NULL OR COALESCE(NEW.quantity, 0) <= 0 THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.inventory_transactions (
        farm_id, inventory_item_id, transaction_type, quantity, notes, performed_by
    )
    VALUES (
        NEW.farm_id,
        NEW.inventory_item_id,
        'usage',
        NEW.quantity,
        format('%s on %s', NEW.activity_type, NEW.activity_date),
        NEW.performed_by
    );

    RETURN NEW;
END;
$$;

-- INSERT only. Firing on UPDATE would double-count, and an edited activity
-- should correct its transaction explicitly rather than silently add another.
DROP TRIGGER IF EXISTS consume_inventory_for_activity ON public.crop_activities;
CREATE TRIGGER consume_inventory_for_activity
    AFTER INSERT ON public.crop_activities
    FOR EACH ROW
    EXECUTE FUNCTION public.consume_inventory_for_activity();

-- ---------------------------------------------------------------------------
-- Pre-harvest intervals
--
-- Every pesticide has a legally mandated gap between application and harvest.
-- Knowing both dates and not enforcing the gap would hand a grower documented
-- evidence of a violation, so this blocks the write.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.earliest_safe_harvest_date(p_planting_id UUID)
RETURNS DATE
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT max(a.activity_date + a.phi_days)
    FROM public.crop_activities a
    WHERE a.planting_id = p_planting_id
      AND a.activity_type = 'spray'
      AND a.phi_days IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.enforce_pre_harvest_interval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_safe DATE;
    v_product TEXT;
    v_applied DATE;
BEGIN
    v_safe := public.earliest_safe_harvest_date(NEW.planting_id);

    IF v_safe IS NULL OR NEW.harvest_date >= v_safe THEN
        RETURN NEW;
    END IF;

    -- Name the specific application, so the message says what to do about it.
    SELECT COALESCE(a.product_name, a.active_ingredient, 'a spray'), a.activity_date
    INTO v_product, v_applied
    FROM public.crop_activities a
    WHERE a.planting_id = NEW.planting_id
      AND a.activity_type = 'spray'
      AND a.phi_days IS NOT NULL
      AND a.activity_date + a.phi_days = v_safe
    ORDER BY a.activity_date DESC
    LIMIT 1;

    RAISE EXCEPTION
        'Harvest blocked: % was applied on %, so this planting cannot be harvested until %',
        v_product, v_applied, v_safe
        USING ERRCODE = 'check_violation';
END;
$$;

DROP TRIGGER IF EXISTS enforce_pre_harvest_interval ON public.harvests;
CREATE TRIGGER enforce_pre_harvest_interval
    BEFORE INSERT OR UPDATE OF harvest_date, planting_id ON public.harvests
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_pre_harvest_interval();

-- ---------------------------------------------------------------------------
-- updated_at + audit triggers
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    v_spec RECORD;
BEGIN
    FOR v_spec IN
        SELECT * FROM (VALUES
            ('crop_activities',   'crop_activity'),
            ('crop_observations', 'crop_observation')
        ) AS t(table_name, entity_type)
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
             CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I
             FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
            v_spec.table_name, v_spec.table_name
        );
        EXECUTE format(
            'DROP TRIGGER IF EXISTS record_audit_log ON public.%I;
             CREATE TRIGGER record_audit_log
             AFTER INSERT OR UPDATE OR DELETE ON public.%I
             FOR EACH ROW EXECUTE FUNCTION public.record_audit_log(%L)',
            v_spec.table_name, v_spec.table_name, v_spec.entity_type
        );
    END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.crop_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_conversions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    v_table TEXT;
BEGIN
    FOREACH v_table IN ARRAY ARRAY['crop_activities', 'crop_observations']
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

-- Reference data: readable by anyone signed in, writable by nobody.
CREATE POLICY unit_conversions_select ON public.unit_conversions
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crop_activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crop_observations TO authenticated;
GRANT SELECT ON public.unit_conversions TO authenticated;
GRANT EXECUTE ON FUNCTION public.to_base_unit TO authenticated;
GRANT EXECUTE ON FUNCTION public.earliest_safe_harvest_date TO authenticated;

-- ---------------------------------------------------------------------------
-- File storage
--
-- Scouting is worthless without photographs — a picture of a lesion is how the
-- problem actually gets identified and compared week to week. Nothing in the
-- product stored files before this.
--
-- Objects are keyed <farm_id>/<entity>/<uuid>-<filename>, so farm membership
-- is decided by the first path segment.
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'farm-files', 'farm-files', false, 10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_farm_file_member(p_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_farm UUID;
BEGIN
    -- A malformed key is simply not a farm file; never let it read as allowed.
    BEGIN
        v_farm := (storage.foldername(p_name))[1]::uuid;
    EXCEPTION WHEN others THEN
        RETURN false;
    END;

    RETURN v_farm IS NOT NULL AND public.is_farm_member(v_farm);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_farm_file_member TO authenticated;

DROP POLICY IF EXISTS farm_files_select ON storage.objects;
CREATE POLICY farm_files_select ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'farm-files' AND public.is_farm_file_member(name));

DROP POLICY IF EXISTS farm_files_insert ON storage.objects;
CREATE POLICY farm_files_insert ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'farm-files' AND public.is_farm_file_member(name));

DROP POLICY IF EXISTS farm_files_update ON storage.objects;
CREATE POLICY farm_files_update ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'farm-files' AND public.is_farm_file_member(name));

DROP POLICY IF EXISTS farm_files_delete ON storage.objects;
CREATE POLICY farm_files_delete ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'farm-files' AND public.is_farm_file_member(name));
