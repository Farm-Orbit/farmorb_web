-- Cycle model tests: perennial seasons, ratoon limits, and annuals.
--
-- Run against a local stack:
--   docker exec -i supabase_db_farmorb_web psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 -f - < supabase/tests/perennial_cycles.sql
--
-- Everything runs inside a transaction that is rolled back, so it is safe to
-- run repeatedly against a stack with data in it. Any failed expectation
-- raises, and ON_ERROR_STOP turns that into a non-zero exit.

BEGIN;

DO $$
DECLARE
    v_user   UUID := '11111111-1111-1111-1111-111111111111';
    v_farm   UUID;
    v_mango  UUID;
    v_pine   UUID;
    v_loc    UUID;
    v_crop_mango UUID;
    v_crop_pine  UUID;
    v_crop_maize UUID;
    v_planting public.plantings;
    v_cycle  public.planting_cycles;
    v_count  INTEGER;
    v_active INTEGER;
    v_year   INTEGER;
    v_failed BOOLEAN;
BEGIN
    -- ---- fixture ---------------------------------------------------------
    INSERT INTO auth.users (id, instance_id, aud, role, email,
                            encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES (v_user, '00000000-0000-0000-0000-000000000000', 'authenticated',
            'authenticated', 'cycles-test@example.com', 'x', NOW(), NOW(), NOW());

    PERFORM set_config('request.jwt.claims',
        json_build_object('sub', v_user, 'role', 'authenticated')::text, true);

    INSERT INTO public.farms (name, created_by, updated_by)
    VALUES ('Cycle Test Estate', v_user, v_user) RETURNING id INTO v_farm;
    INSERT INTO public.farm_members (farm_id, user_id, role) VALUES (v_farm, v_user, 'owner');

    INSERT INTO public.grow_locations (farm_id, name, location_type)
    VALUES (v_farm, 'Block 4', 'block') RETURNING id INTO v_loc;

    INSERT INTO public.crop_types (farm_id, name, growing_type, months_to_first_harvest)
    VALUES (v_farm, 'Mango', 'perennial', 36) RETURNING id INTO v_crop_mango;

    INSERT INTO public.crop_types (farm_id, name, growing_type, supports_ratoon, max_ratoon_cycles)
    VALUES (v_farm, 'Pineapple', 'ratoon', true, 2) RETURNING id INTO v_crop_pine;

    INSERT INTO public.crop_types (farm_id, name, growing_type)
    VALUES (v_farm, 'Maize', 'annual') RETURNING id INTO v_crop_maize;

    -- ---- 1. a perennial opens on a season, not a mother crop -------------
    -- Also exercises 'graft', which the planting_method CHECK previously
    -- rejected — how essentially all commercial mango is established.
    v_planting := public.create_planting_with_cycle(
        v_farm, v_loc, v_crop_mango, DATE '2026-03-01', NULL, 'graft');
    v_mango := v_planting.id;

    SELECT * INTO v_cycle FROM public.planting_cycles WHERE planting_id = v_mango;
    IF v_cycle.cycle_type <> 'season' THEN
        RAISE EXCEPTION 'expected a perennial to open on a season, got %', v_cycle.cycle_type;
    END IF;
    IF v_cycle.season_year <> 2026 THEN
        RAISE EXCEPTION 'expected season_year 2026, got %', v_cycle.season_year;
    END IF;

    -- ---- 2. it reaches season 12, which the old model could not ----------
    FOR v_year IN 1..11 LOOP
        PERFORM public.start_next_cycle(
            v_mango, (DATE '2026-03-01' + (v_year || ' years')::interval)::date);
    END LOOP;

    SELECT count(*) INTO v_count FROM public.planting_cycles WHERE planting_id = v_mango;
    IF v_count <> 12 THEN
        RAISE EXCEPTION 'expected 12 cycles, got %', v_count;
    END IF;

    SELECT season_year INTO v_year
    FROM public.planting_cycles WHERE planting_id = v_mango AND cycle_number = 12;
    IF v_year <> 2037 THEN
        RAISE EXCEPTION 'expected cycle 12 to be the 2037 season, got %', v_year;
    END IF;

    -- ---- 3. exactly one cycle is ever active -----------------------------
    SELECT count(*) INTO v_active
    FROM public.planting_cycles WHERE planting_id = v_mango AND status = 'active';
    IF v_active <> 1 THEN
        RAISE EXCEPTION 'expected exactly 1 active cycle, got %', v_active;
    END IF;

    -- ---- 4. a harvest lands in the twelfth season ------------------------
    INSERT INTO public.harvests (
        farm_id, planting_id, cycle_id, harvest_date, harvest_type,
        quantity, quantity_unit, quality_grade
    )
    SELECT v_farm, v_mango, id, DATE '2037-08-15', 'partial', 4200, 'kg', 'export_a'
    FROM public.planting_cycles WHERE planting_id = v_mango AND cycle_number = 12;

    SELECT count(*) INTO v_count
    FROM public.harvests h
    JOIN public.planting_cycles c ON c.id = h.cycle_id
    WHERE h.planting_id = v_mango AND c.season_year = 2037;
    IF v_count <> 1 THEN
        RAISE EXCEPTION 'expected the 2037 harvest to be attributable, got %', v_count;
    END IF;

    -- ---- 4b. closing a cycle tells the truth about whether it bore ------
    -- Cycle 12 has the harvest above; cycles 1..11 were advanced past without
    -- one. Recording all of them as 'harvested' would overstate the history.
    SELECT count(*) INTO v_count
    FROM public.planting_cycles
    WHERE planting_id = v_mango AND status = 'terminated';
    IF v_count <> 11 THEN
        RAISE EXCEPTION 'expected 11 unharvested cycles to be terminated, got %', v_count;
    END IF;

    PERFORM public.start_next_cycle(v_mango, DATE '2038-03-01');

    SELECT status INTO v_cycle.status
    FROM public.planting_cycles WHERE planting_id = v_mango AND cycle_number = 12;
    IF v_cycle.status <> 'harvested' THEN
        RAISE EXCEPTION 'expected the season that bore fruit to close as harvested, got %', v_cycle.status;
    END IF;

    -- ---- 5. a ratoon crop is still capped by max_ratoon_cycles -----------
    v_planting := public.create_planting_with_cycle(
        v_farm, v_loc, v_crop_pine, DATE '2026-04-01');
    v_pine := v_planting.id;

    SELECT * INTO v_cycle FROM public.planting_cycles WHERE planting_id = v_pine;
    IF v_cycle.cycle_type <> 'mother' THEN
        RAISE EXCEPTION 'expected a ratoon crop to open on a mother cycle, got %', v_cycle.cycle_type;
    END IF;

    PERFORM public.start_next_cycle(v_pine, DATE '2027-04-01');  -- ratoon 1
    PERFORM public.start_next_cycle(v_pine, DATE '2028-04-01');  -- ratoon 2

    v_failed := false;
    BEGIN
        PERFORM public.start_next_cycle(v_pine, DATE '2029-04-01');  -- over the limit
    EXCEPTION WHEN others THEN
        v_failed := true;
    END;
    IF NOT v_failed THEN
        RAISE EXCEPTION 'expected a third ratoon to be refused at max_ratoon_cycles = 2';
    END IF;

    -- ---- 6. an annual has nothing to advance to --------------------------
    v_planting := public.create_planting_with_cycle(
        v_farm, v_loc, v_crop_maize, DATE '2026-05-01');

    v_failed := false;
    BEGIN
        PERFORM public.start_next_cycle(v_planting.id, DATE '2027-05-01');
    EXCEPTION WHEN others THEN
        v_failed := true;
    END;
    IF NOT v_failed THEN
        RAISE EXCEPTION 'expected an annual crop to refuse a next cycle';
    END IF;

    -- ---- 7. a season cycle cannot exist without its year -----------------
    v_failed := false;
    BEGIN
        INSERT INTO public.planting_cycles (planting_id, cycle_number, cycle_type, start_date)
        VALUES (v_mango, 99, 'season', DATE '2040-01-01');
    EXCEPTION WHEN others THEN
        v_failed := true;
    END;
    IF NOT v_failed THEN
        RAISE EXCEPTION 'expected a season cycle without season_year to be rejected';
    END IF;

    RAISE NOTICE 'perennial_cycles: all 8 expectations passed';
END $$;

ROLLBACK;
