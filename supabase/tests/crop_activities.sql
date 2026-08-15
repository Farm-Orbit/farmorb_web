-- Crop activity tests: inventory consumption, pre-harvest intervals, batches,
-- unit conversion and the storage path policy.
--
--   docker exec -i supabase_db_farmorb_web psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 -f - < supabase/tests/crop_activities.sql
--
-- Runs inside a transaction that is rolled back.

BEGIN;

DO $$
DECLARE
    v_user     UUID := '22222222-2222-2222-2222-222222222222';
    v_outsider UUID := '33333333-3333-3333-3333-333333333333';
    v_farm     UUID;
    v_loc      UUID;
    v_crop     UUID;
    v_item     UUID;
    v_planting public.plantings;
    v_cycle    UUID;
    v_batch    UUID := gen_random_uuid();
    v_qty      NUMERIC;
    v_count    INTEGER;
    v_date     DATE;
    v_failed   BOOLEAN;
    v_message  TEXT;
BEGIN
    -- ---- fixture ---------------------------------------------------------
    INSERT INTO auth.users (id, instance_id, aud, role, email,
                            encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES
        (v_user, '00000000-0000-0000-0000-000000000000', 'authenticated',
         'authenticated', 'activities-test@example.com', 'x', NOW(), NOW(), NOW()),
        (v_outsider, '00000000-0000-0000-0000-000000000000', 'authenticated',
         'authenticated', 'outsider-test@example.com', 'x', NOW(), NOW(), NOW());

    PERFORM set_config('request.jwt.claims',
        json_build_object('sub', v_user, 'role', 'authenticated')::text, true);

    INSERT INTO public.farms (name, created_by, updated_by)
    VALUES ('Spray Test Estate', v_user, v_user) RETURNING id INTO v_farm;
    INSERT INTO public.farm_members (farm_id, user_id, role) VALUES (v_farm, v_user, 'owner');

    INSERT INTO public.grow_locations (farm_id, name, location_type)
    VALUES (v_farm, 'Block 4', 'block') RETURNING id INTO v_loc;

    INSERT INTO public.crop_types (farm_id, name, growing_type)
    VALUES (v_farm, 'Mango', 'perennial') RETURNING id INTO v_crop;

    INSERT INTO public.inventory_items (farm_id, name, category, quantity, unit, cost_per_unit)
    VALUES (v_farm, 'Mancozeb', 'medication', 40, 'l', 12.50) RETURNING id INTO v_item;

    v_planting := public.create_planting_with_cycle(
        v_farm, v_loc, v_crop, DATE '2026-03-01', NULL, 'graft');

    SELECT id INTO v_cycle FROM public.planting_cycles WHERE planting_id = v_planting.id;

    -- ---- 1. unit conversion ---------------------------------------------
    IF public.to_base_unit(2, 't') <> 2000 THEN
        RAISE EXCEPTION 'expected 2 t to convert to 2000 kg, got %', public.to_base_unit(2, 't');
    END IF;
    IF public.to_base_unit(1, 'crate') IS NOT NULL THEN
        RAISE EXCEPTION 'expected an unknown unit to convert to NULL rather than a guess';
    END IF;

    -- ---- 2. a spray consumes stock through the existing path -------------
    INSERT INTO public.crop_activities (
        farm_id, planting_id, cycle_id, activity_type, activity_date,
        inventory_item_id, product_name, active_ingredient,
        rate, rate_unit, quantity, quantity_unit, phi_days, labour_hours, performed_by
    )
    VALUES (
        v_farm, v_planting.id, v_cycle, 'spray', DATE '2026-08-01',
        v_item, 'Mancozeb 80WP', 'mancozeb',
        2.5, 'l/ha', 18, 'l', 14, 3.5, v_user
    );

    SELECT quantity INTO v_qty FROM public.inventory_items WHERE id = v_item;
    IF v_qty <> 22 THEN
        RAISE EXCEPTION 'expected stock 40 - 18 = 22, got %', v_qty;
    END IF;

    SELECT count(*) INTO v_count
    FROM public.inventory_transactions
    WHERE inventory_item_id = v_item AND transaction_type = 'usage';
    IF v_count <> 1 THEN
        RAISE EXCEPTION 'expected exactly one usage transaction, got %', v_count;
    END IF;

    -- ---- 3. the pre-harvest interval is computed -------------------------
    v_date := public.earliest_safe_harvest_date(v_planting.id);
    IF v_date <> DATE '2026-08-15' THEN
        RAISE EXCEPTION 'expected 1 Aug + 14 days = 15 Aug, got %', v_date;
    END IF;

    -- ---- 4. harvesting inside the interval is blocked --------------------
    v_failed := false;
    BEGIN
        INSERT INTO public.harvests (
            farm_id, planting_id, cycle_id, harvest_date, harvest_type,
            quantity, quantity_unit
        )
        VALUES (v_farm, v_planting.id, v_cycle, DATE '2026-08-10', 'partial', 100, 'kg');
    EXCEPTION WHEN others THEN
        v_failed := true;
        v_message := SQLERRM;
    END;

    IF NOT v_failed THEN
        RAISE EXCEPTION 'expected a harvest 5 days into a 14-day interval to be refused';
    END IF;
    -- The message has to say what to do about it, not just "not allowed".
    IF v_message NOT LIKE '%Mancozeb%' OR v_message NOT LIKE '%2026-08-15%' THEN
        RAISE EXCEPTION 'expected the block to name the product and the safe date, got: %', v_message;
    END IF;

    -- ---- 5. harvesting on the safe date is allowed -----------------------
    INSERT INTO public.harvests (
        farm_id, planting_id, cycle_id, harvest_date, harvest_type,
        quantity, quantity_unit
    )
    VALUES (v_farm, v_planting.id, v_cycle, DATE '2026-08-15', 'partial', 100, 'kg');

    -- ---- 6. a spray with no interval does not restrict anything ----------
    INSERT INTO public.crop_activities (
        farm_id, location_id, activity_type, activity_date, product_name, phi_days
    )
    VALUES (v_farm, v_loc, 'weeding', DATE '2026-09-01', 'hand weeding', NULL);

    IF public.earliest_safe_harvest_date(v_planting.id) <> DATE '2026-08-15' THEN
        RAISE EXCEPTION 'a non-spray activity should not affect the interval';
    END IF;

    -- ---- 7. one submission across blocks shares a batch ------------------
    INSERT INTO public.crop_activities (
        farm_id, location_id, activity_type, activity_date, batch_id, labour_hours
    )
    SELECT v_farm, v_loc, 'irrigation', DATE '2026-09-05', v_batch, 2
    FROM generate_series(1, 3);

    SELECT count(*) INTO v_count FROM public.crop_activities WHERE batch_id = v_batch;
    IF v_count <> 3 THEN
        RAISE EXCEPTION 'expected 3 rows sharing one batch, got %', v_count;
    END IF;

    -- ---- 8. an activity must target something ----------------------------
    v_failed := false;
    BEGIN
        INSERT INTO public.crop_activities (farm_id, activity_type, activity_date)
        VALUES (v_farm, 'pruning', DATE '2026-09-10');
    EXCEPTION WHEN others THEN
        v_failed := true;
    END;
    IF NOT v_failed THEN
        RAISE EXCEPTION 'expected an activity with no planting and no location to be rejected';
    END IF;

    -- ---- 9. storage keys are farm-scoped ---------------------------------
    IF NOT public.is_farm_file_member(v_farm || '/observations/leaf.jpg') THEN
        RAISE EXCEPTION 'expected a member to reach their own farm files';
    END IF;
    IF public.is_farm_file_member(gen_random_uuid() || '/observations/leaf.jpg') THEN
        RAISE EXCEPTION 'expected another farm''s files to be unreachable';
    END IF;
    IF public.is_farm_file_member('not-a-uuid/leaf.jpg') THEN
        RAISE EXCEPTION 'expected a malformed key to be rejected, not treated as allowed';
    END IF;

    -- ---- 10. observations record what was seen ---------------------------
    INSERT INTO public.crop_observations (
        farm_id, planting_id, observed_on, observation_type,
        problem_name, severity, incidence_percent, observed_by
    )
    VALUES (
        v_farm, v_planting.id, DATE '2026-07-20', 'disease',
        'Anthracnose', 'moderate', 12.5, v_user
    );

    v_failed := false;
    BEGIN
        INSERT INTO public.crop_observations (
            farm_id, planting_id, observed_on, observation_type, severity, incidence_percent
        )
        VALUES (v_farm, v_planting.id, DATE '2026-07-21', 'pest', 'moderate', 140);
    EXCEPTION WHEN others THEN
        v_failed := true;
    END;
    IF NOT v_failed THEN
        RAISE EXCEPTION 'expected an incidence above 100%% to be rejected';
    END IF;

    -- ---- 11. activities are audited --------------------------------------
    SELECT count(*) INTO v_count
    FROM public.audit_logs
    WHERE farm_id = v_farm AND entity_type = 'crop_activity' AND action_type = 'create';
    IF v_count < 1 THEN
        RAISE EXCEPTION 'expected crop activities to be audited';
    END IF;

    RAISE NOTICE 'crop_activities: all 11 expectations passed';
END $$;

ROLLBACK;
