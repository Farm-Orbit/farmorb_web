-- FarmOrb Supabase schema: profiles, farms, crop farming core
-- Adapted from farmorb_api migrations 006 + 015 (crop slice only)

-- ---------------------------------------------------------------------------
-- Profiles (linked to auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'firstName', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', NEW.raw_user_meta_data->>'lastName', '')
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Farms & membership
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location_address TEXT,
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    size_acres DECIMAL(10, 2),
    size_hectares DECIMAL(10, 2),
    farm_type VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS public.farm_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (farm_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.farm_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('member')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    declined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT farm_invitations_contact CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_farms_created_by ON public.farms(created_by);
CREATE INDEX IF NOT EXISTS idx_farm_members_user_id ON public.farm_members(user_id);
CREATE INDEX IF NOT EXISTS idx_farm_members_farm_id ON public.farm_members(farm_id);

-- ---------------------------------------------------------------------------
-- Crop types & varieties
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crop_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255),
    category VARCHAR(50) CHECK (category IN ('fruit', 'vegetable', 'grain', 'legume', 'root', 'tuber', 'herb', 'spice', 'other')),
    growing_type VARCHAR(50) NOT NULL CHECK (growing_type IN ('annual', 'perennial', 'ratoon', 'biennial')),
    months_to_first_harvest INTEGER,
    default_spacing_row_meters NUMERIC(10, 2),
    default_spacing_plant_meters NUMERIC(10, 2),
    plants_per_hectare INTEGER,
    expected_yield_per_hectare NUMERIC(10, 2),
    supports_ratoon BOOLEAN DEFAULT false,
    max_ratoon_cycles INTEGER CHECK (max_ratoon_cycles IS NULL OR (supports_ratoon = true AND max_ratoon_cycles > 0)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.crop_varieties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_type_id UUID NOT NULL REFERENCES public.crop_types(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    months_to_maturity INTEGER,
    expected_yield NUMERIC(10, 2),
    characteristics JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (crop_type_id, name)
);

-- ---------------------------------------------------------------------------
-- Grow locations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.grow_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    parent_location_id UUID REFERENCES public.grow_locations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location_type VARCHAR(50) NOT NULL CHECK (location_type IN ('block', 'field', 'bed', 'greenhouse', 'nursery', 'plot', 'section', 'other')),
    size_hectares NUMERIC(10, 2),
    size_acres NUMERIC(10, 2),
    gps_latitude NUMERIC(10, 8),
    gps_longitude NUMERIC(11, 8),
    boundary_coordinates JSONB,
    soil_type VARCHAR(100),
    soil_ph NUMERIC(4, 2),
    irrigation_type VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'fallow', 'retired', 'preparing')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- Plantings & cycles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plantings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES public.grow_locations(id) ON DELETE CASCADE,
    crop_type_id UUID NOT NULL REFERENCES public.crop_types(id) ON DELETE CASCADE,
    variety_id UUID REFERENCES public.crop_varieties(id) ON DELETE SET NULL,
    planting_date DATE NOT NULL,
    planting_method VARCHAR(50) CHECK (planting_method IN ('direct_seed', 'transplant', 'graft', 'crown', 'slip', 'sucker', 'cutting', 'bulb', 'tuber', 'other')),
    status VARCHAR(50) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'planted', 'establishing', 'vegetative', 'flowering', 'fruiting', 'harvesting', 'harvested', 'terminated')),
    area_hectares NUMERIC(10, 2),
    plant_count INTEGER,
    plant_density INTEGER,
    material_type VARCHAR(50) CHECK (material_type IN ('seed', 'crown', 'slip', 'sucker', 'cutting', 'bulb', 'tuber', 'seedling', 'other')),
    material_source VARCHAR(50) CHECK (material_source IN ('own_harvest', 'own_mother', 'purchased', 'gift', 'other')),
    source_planting_id UUID REFERENCES public.plantings(id) ON DELETE SET NULL,
    material_age_days INTEGER,
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.planting_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planting_id UUID NOT NULL REFERENCES public.plantings(id) ON DELETE CASCADE,
    cycle_number INTEGER NOT NULL,
    -- 'mother'/'ratoon' model a ratoon crop (pineapple, sugarcane, banana):
    -- one planting regrows a bounded number of times. 'season' models a
    -- perennial tree bearing annually and effectively indefinitely, so the
    -- number of cycles is not capped and each carries the year it belongs to.
    cycle_type VARCHAR(50) NOT NULL CHECK (cycle_type IN ('mother', 'ratoon', 'season')),
    season_year INTEGER CHECK (season_year IS NULL OR season_year BETWEEN 1900 AND 2200),
    start_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'harvested', 'terminated')),
    expected_yield NUMERIC(10, 2),
    actual_yield NUMERIC(10, 2),
    -- Ratoon-only: each regrowth typically yields less, and at some point
    -- replanting beats another cycle. Unused for perennial seasons.
    yield_decline_percent NUMERIC(5, 2),
    continue_ratoon BOOLEAN,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (planting_id, cycle_number),
    CONSTRAINT planting_cycle_season_year_required CHECK (
        cycle_type <> 'season' OR season_year IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_planting_cycles_planting
    ON public.planting_cycles(planting_id, cycle_number);

-- ---------------------------------------------------------------------------
-- Harvests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.harvests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    planting_id UUID NOT NULL REFERENCES public.plantings(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES public.planting_cycles(id) ON DELETE CASCADE,
    harvest_date DATE NOT NULL,
    -- Describes THIS pick only. Which season or ratoon it belongs to comes
    -- from cycle_id — encoding it here as well is what capped the old model
    -- at ratoon_4 and left a perennial's twelfth year unrecordable.
    harvest_type VARCHAR(50) NOT NULL DEFAULT 'partial' CHECK (harvest_type IN ('partial', 'final')),
    quantity NUMERIC(10, 2) NOT NULL,
    quantity_unit VARCHAR(50) NOT NULL,
    average_fruit_weight_kg NUMERIC(10, 2),
    average_brix NUMERIC(5, 2),
    quality_grade VARCHAR(50) CHECK (quality_grade IN ('export_a', 'export_b', 'local_a', 'local_b', 'processing', 'reject')),
    harvested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    labor_hours NUMERIC(10, 2),
    destination VARCHAR(50) CHECK (destination IN ('storage', 'direct_sale', 'processing', 'waste')),
    storage_location_id UUID REFERENCES public.grow_locations(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_crop_types_farm_id ON public.crop_types(farm_id);
CREATE INDEX IF NOT EXISTS idx_grow_locations_farm_id ON public.grow_locations(farm_id);
CREATE INDEX IF NOT EXISTS idx_plantings_farm_id ON public.plantings(farm_id);
CREATE INDEX IF NOT EXISTS idx_harvests_farm_id ON public.harvests(farm_id);

-- ---------------------------------------------------------------------------
-- Helper: farm membership check
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_farm_member(p_farm_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.farm_members fm
        WHERE fm.farm_id = p_farm_id
          AND fm.user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.is_farm_owner(p_farm_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.farm_members fm
        WHERE fm.farm_id = p_farm_id
          AND fm.user_id = auth.uid()
          AND fm.role = 'owner'
    );
$$;

-- ---------------------------------------------------------------------------
-- RPC: create farm + owner membership
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_farm(
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_farm_type TEXT DEFAULT NULL,
    p_location_address TEXT DEFAULT NULL,
    p_location_latitude NUMERIC DEFAULT NULL,
    p_location_longitude NUMERIC DEFAULT NULL,
    p_size_acres NUMERIC DEFAULT NULL,
    p_size_hectares NUMERIC DEFAULT NULL
)
RETURNS public.farms
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_farm public.farms;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    INSERT INTO public.farms (
        name, description, farm_type, location_address,
        location_latitude, location_longitude, size_acres, size_hectares,
        created_by, updated_by
    )
    VALUES (
        p_name, p_description, p_farm_type, p_location_address,
        p_location_latitude, p_location_longitude, p_size_acres, p_size_hectares,
        v_user_id, v_user_id
    )
    RETURNING * INTO v_farm;

    INSERT INTO public.farm_members (farm_id, user_id, role)
    VALUES (v_farm.id, v_user_id, 'owner');

    RETURN v_farm;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: create planting + mother cycle
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_planting_with_cycle(
    p_farm_id UUID,
    p_location_id UUID,
    p_crop_type_id UUID,
    p_planting_date DATE,
    p_variety_id UUID DEFAULT NULL,
    p_planting_method TEXT DEFAULT NULL,
    p_status TEXT DEFAULT 'planted',
    p_area_hectares NUMERIC DEFAULT NULL,
    p_plant_count INTEGER DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS public.plantings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_planting public.plantings;
    v_growing_type TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF NOT public.is_farm_member(p_farm_id) THEN
        RAISE EXCEPTION 'Not a farm member';
    END IF;

    INSERT INTO public.plantings (
        farm_id, location_id, crop_type_id, variety_id, planting_date,
        planting_method, status, area_hectares, plant_count, notes,
        created_by, updated_by
    )
    VALUES (
        p_farm_id, p_location_id, p_crop_type_id, p_variety_id, p_planting_date,
        p_planting_method, COALESCE(p_status, 'planted'), p_area_hectares, p_plant_count, p_notes,
        v_user_id, v_user_id
    )
    RETURNING * INTO v_planting;

    -- The first cycle's kind follows the crop: a perennial bears seasons, and
    -- anything else starts as a mother crop.
    SELECT growing_type INTO v_growing_type
    FROM public.crop_types
    WHERE id = p_crop_type_id;

    INSERT INTO public.planting_cycles (
        planting_id, cycle_number, cycle_type, season_year, start_date, status
    )
    VALUES (
        v_planting.id,
        1,
        CASE WHEN v_growing_type = 'perennial' THEN 'season' ELSE 'mother' END,
        CASE WHEN v_growing_type = 'perennial'
             THEN EXTRACT(YEAR FROM p_planting_date)::INTEGER END,
        p_planting_date,
        'active'
    );

    RETURN v_planting;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: advance a planting to its next cycle
--
-- Perennials bear a new season each year with no ceiling. Ratoon crops are
-- bounded by the crop's max_ratoon_cycles, and an annual has nothing to
-- advance to. Closes the current cycle so exactly one is ever active.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_next_cycle(
    p_planting_id UUID,
    p_start_date DATE DEFAULT NULL
)
RETURNS public.planting_cycles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_planting public.plantings;
    v_growing_type TEXT;
    v_max_ratoons INTEGER;
    v_current public.planting_cycles;
    v_start DATE := COALESCE(p_start_date, CURRENT_DATE);
    v_next public.planting_cycles;
    v_ratoon_count INTEGER;
BEGIN
    SELECT * INTO v_planting FROM public.plantings WHERE id = p_planting_id;
    IF v_planting.id IS NULL THEN
        RAISE EXCEPTION 'Planting not found';
    END IF;

    IF NOT public.is_farm_member(v_planting.farm_id) THEN
        RAISE EXCEPTION 'Not a farm member';
    END IF;

    SELECT growing_type, max_ratoon_cycles
    INTO v_growing_type, v_max_ratoons
    FROM public.crop_types
    WHERE id = v_planting.crop_type_id;

    SELECT * INTO v_current
    FROM public.planting_cycles
    WHERE planting_id = p_planting_id
    ORDER BY cycle_number DESC
    LIMIT 1;

    IF v_current.id IS NULL THEN
        RAISE EXCEPTION 'Planting has no cycles to advance from';
    END IF;

    IF v_growing_type = 'perennial' THEN
        INSERT INTO public.planting_cycles (
            planting_id, cycle_number, cycle_type, season_year, start_date, status
        )
        VALUES (
            p_planting_id,
            v_current.cycle_number + 1,
            'season',
            EXTRACT(YEAR FROM v_start)::INTEGER,
            v_start,
            'active'
        )
        RETURNING * INTO v_next;
    ELSIF v_growing_type = 'ratoon' THEN
        SELECT count(*) INTO v_ratoon_count
        FROM public.planting_cycles
        WHERE planting_id = p_planting_id AND cycle_type = 'ratoon';

        IF v_max_ratoons IS NOT NULL AND v_ratoon_count >= v_max_ratoons THEN
            RAISE EXCEPTION 'Planting has reached its % ratoon cycle limit', v_max_ratoons;
        END IF;

        INSERT INTO public.planting_cycles (
            planting_id, cycle_number, cycle_type, start_date, status
        )
        VALUES (
            p_planting_id, v_current.cycle_number + 1, 'ratoon', v_start, 'active'
        )
        RETURNING * INTO v_next;
    ELSE
        RAISE EXCEPTION 'A % crop does not carry over into another cycle', v_growing_type;
    END IF;

    -- Close the cycle we came from, honestly: a season that produced fruit was
    -- harvested, one that was abandoned or failed was terminated. Recording
    -- both as 'harvested' would quietly overstate the bearing history.
    UPDATE public.planting_cycles
    SET status = CASE
            WHEN EXISTS (SELECT 1 FROM public.harvests WHERE cycle_id = v_current.id)
            THEN 'harvested'
            ELSE 'terminated'
        END,
        updated_at = NOW()
    WHERE id = v_current.id AND status = 'active';

    RETURN v_next;
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_varieties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grow_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plantings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planting_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvests ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY profiles_select_own ON public.profiles
    FOR SELECT USING (
        id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM public.farm_members me
            JOIN public.farm_members peer ON peer.farm_id = me.farm_id
            WHERE me.user_id = auth.uid()
              AND peer.user_id = profiles.id
        )
    );
CREATE POLICY profiles_update_own ON public.profiles
    FOR UPDATE USING (id = auth.uid());

-- Farms
CREATE POLICY farms_select_member ON public.farms
    FOR SELECT USING (public.is_farm_member(id));
CREATE POLICY farms_update_owner ON public.farms
    FOR UPDATE USING (public.is_farm_owner(id));
CREATE POLICY farms_delete_owner ON public.farms
    FOR DELETE USING (public.is_farm_owner(id));
-- Inserts go through create_farm RPC (security definer)

-- Farm members
CREATE POLICY farm_members_select ON public.farm_members
    FOR SELECT USING (public.is_farm_member(farm_id) OR user_id = auth.uid());
CREATE POLICY farm_members_manage_owner ON public.farm_members
    FOR ALL USING (public.is_farm_owner(farm_id));

-- Invitations
CREATE POLICY farm_invitations_select ON public.farm_invitations
    FOR SELECT USING (
        public.is_farm_member(farm_id)
        OR lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    );
CREATE POLICY farm_invitations_manage_owner ON public.farm_invitations
    FOR ALL USING (public.is_farm_owner(farm_id));

-- Crop types
CREATE POLICY crop_types_select ON public.crop_types
    FOR SELECT USING (public.is_farm_member(farm_id));
CREATE POLICY crop_types_insert ON public.crop_types
    FOR INSERT WITH CHECK (public.is_farm_member(farm_id));
CREATE POLICY crop_types_update ON public.crop_types
    FOR UPDATE USING (public.is_farm_member(farm_id));
CREATE POLICY crop_types_delete ON public.crop_types
    FOR DELETE USING (public.is_farm_member(farm_id));

-- Crop varieties (via parent crop type farm)
CREATE POLICY crop_varieties_select ON public.crop_varieties
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.crop_types ct
            WHERE ct.id = crop_type_id AND public.is_farm_member(ct.farm_id)
        )
    );
CREATE POLICY crop_varieties_insert ON public.crop_varieties
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.crop_types ct
            WHERE ct.id = crop_type_id AND public.is_farm_member(ct.farm_id)
        )
    );
CREATE POLICY crop_varieties_update ON public.crop_varieties
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.crop_types ct
            WHERE ct.id = crop_type_id AND public.is_farm_member(ct.farm_id)
        )
    );
CREATE POLICY crop_varieties_delete ON public.crop_varieties
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.crop_types ct
            WHERE ct.id = crop_type_id AND public.is_farm_member(ct.farm_id)
        )
    );

-- Grow locations
CREATE POLICY grow_locations_select ON public.grow_locations
    FOR SELECT USING (public.is_farm_member(farm_id));
CREATE POLICY grow_locations_insert ON public.grow_locations
    FOR INSERT WITH CHECK (public.is_farm_member(farm_id));
CREATE POLICY grow_locations_update ON public.grow_locations
    FOR UPDATE USING (public.is_farm_member(farm_id));
CREATE POLICY grow_locations_delete ON public.grow_locations
    FOR DELETE USING (public.is_farm_member(farm_id));

-- Plantings
CREATE POLICY plantings_select ON public.plantings
    FOR SELECT USING (public.is_farm_member(farm_id));
CREATE POLICY plantings_insert ON public.plantings
    FOR INSERT WITH CHECK (public.is_farm_member(farm_id));
CREATE POLICY plantings_update ON public.plantings
    FOR UPDATE USING (public.is_farm_member(farm_id));
CREATE POLICY plantings_delete ON public.plantings
    FOR DELETE USING (public.is_farm_member(farm_id));

-- Planting cycles
CREATE POLICY planting_cycles_select ON public.planting_cycles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.plantings p
            WHERE p.id = planting_id AND public.is_farm_member(p.farm_id)
        )
    );
CREATE POLICY planting_cycles_insert ON public.planting_cycles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.plantings p
            WHERE p.id = planting_id AND public.is_farm_member(p.farm_id)
        )
    );
CREATE POLICY planting_cycles_update ON public.planting_cycles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.plantings p
            WHERE p.id = planting_id AND public.is_farm_member(p.farm_id)
        )
    );
CREATE POLICY planting_cycles_delete ON public.planting_cycles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.plantings p
            WHERE p.id = planting_id AND public.is_farm_member(p.farm_id)
        )
    );

-- Harvests
CREATE POLICY harvests_select ON public.harvests
    FOR SELECT USING (public.is_farm_member(farm_id));
CREATE POLICY harvests_insert ON public.harvests
    FOR INSERT WITH CHECK (public.is_farm_member(farm_id));
CREATE POLICY harvests_update ON public.harvests
    FOR UPDATE USING (public.is_farm_member(farm_id));
CREATE POLICY harvests_delete ON public.harvests
    FOR DELETE USING (public.is_farm_member(farm_id));

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.farms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farm_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farm_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crop_types TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crop_varieties TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grow_locations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plantings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planting_cycles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.harvests TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_farm TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_planting_with_cycle TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_next_cycle TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_farm_member TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_farm_owner TO authenticated;
