-- Financial tests: derived expenses, the sale-within-harvest rule, and the
-- rollups that answer "what did a kilo cost me, and did this block pay".
--
--   docker exec -i supabase_db_farmorb_web psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 -f - < supabase/tests/crop_financials.sql

BEGIN;

DO $$
DECLARE
    v_user     UUID := '44444444-4444-4444-4444-444444444444';
    v_farm     UUID;
    v_loc      UUID;
    v_crop     UUID;
    v_item     UUID;
    v_planting public.plantings;
    v_cycle    UUID;
    v_harvest  UUID;
    v_activity UUID;
    v_amount   NUMERIC;
    v_count    INTEGER;
    v_row      RECORD;
    v_failed   BOOLEAN;
    v_message  TEXT;
BEGIN
    -- ---- fixture ---------------------------------------------------------
    INSERT INTO auth.users (id, instance_id, aud, role, email,
                            encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES (v_user, '00000000-0000-0000-0000-000000000000', 'authenticated',
            'authenticated', 'money-test@example.com', 'x', NOW(), NOW(), NOW());

    PERFORM set_config('request.jwt.claims',
        json_build_object('sub', v_user, 'role', 'authenticated')::text, true);

    INSERT INTO public.farms (name, created_by, updated_by, labour_rate_per_hour, currency)
    VALUES ('Margin Estate', v_user, v_user, 20.00, 'USD') RETURNING id INTO v_farm;
    INSERT INTO public.farm_members (farm_id, user_id, role) VALUES (v_farm, v_user, 'owner');

    INSERT INTO public.grow_locations (farm_id, name, location_type, size_hectares)
    VALUES (v_farm, 'Block 4', 'block', 4) RETURNING id INTO v_loc;

    INSERT INTO public.crop_types (farm_id, name, growing_type)
    VALUES (v_farm, 'Mango', 'perennial') RETURNING id INTO v_crop;

    INSERT INTO public.inventory_items (farm_id, name, category, quantity, unit, cost_per_unit)
    VALUES (v_farm, 'Mancozeb', 'medication', 100, 'l', 12.50) RETURNING id INTO v_item;

    v_planting := public.create_planting_with_cycle(
        v_farm, v_loc, v_crop, DATE '2026-03-01', NULL, 'graft');
    SELECT id INTO v_cycle FROM public.planting_cycles WHERE planting_id = v_planting.id;

    -- ---- 1. an activity derives both its input and labour cost -----------
    INSERT INTO public.crop_activities (
        farm_id, planting_id, cycle_id, location_id, activity_type, activity_date,
        inventory_item_id, product_name, quantity, quantity_unit,
        labour_hours, phi_days, performed_by
    )
    VALUES (
        v_farm, v_planting.id, v_cycle, v_loc, 'spray', DATE '2026-06-01',
        v_item, 'Mancozeb 80WP', 10, 'l', 3, 14, v_user
    )
    RETURNING id INTO v_activity;

    SELECT count(*) INTO v_count
    FROM public.expenses WHERE crop_activity_id = v_activity AND is_derived;
    IF v_count <> 2 THEN
        RAISE EXCEPTION 'expected inputs and labour to be derived, got % expense(s)', v_count;
    END IF;

    SELECT amount INTO v_amount
    FROM public.expenses WHERE crop_activity_id = v_activity AND category = 'inputs';
    IF v_amount <> 125.00 THEN
        RAISE EXCEPTION 'expected 10 l x 12.50 = 125.00, got %', v_amount;
    END IF;

    SELECT amount INTO v_amount
    FROM public.expenses WHERE crop_activity_id = v_activity AND category = 'labour';
    IF v_amount <> 60.00 THEN
        RAISE EXCEPTION 'expected 3 h x 20.00 = 60.00, got %', v_amount;
    END IF;

    -- ---- 2. re-deriving updates rather than duplicating ------------------
    UPDATE public.crop_activities SET labour_hours = 5 WHERE id = v_activity;

    SELECT count(*) INTO v_count
    FROM public.expenses WHERE crop_activity_id = v_activity;
    IF v_count <> 2 THEN
        RAISE EXCEPTION 'expected editing an activity to update its expenses, got % rows', v_count;
    END IF;

    SELECT amount INTO v_amount
    FROM public.expenses WHERE crop_activity_id = v_activity AND category = 'labour';
    IF v_amount <> 100.00 THEN
        RAISE EXCEPTION 'expected the labour cost to follow the edit to 100.00, got %', v_amount;
    END IF;

    -- ---- 3. a manual expense sits alongside the derived ones -------------
    INSERT INTO public.expenses (
        farm_id, expense_date, category, description, amount, planting_id, created_by
    )
    VALUES (v_farm, DATE '2026-06-10', 'land', 'Block 4 rent', 300.00, v_planting.id, v_user);

    SELECT count(*) INTO v_count
    FROM public.expenses WHERE planting_id = v_planting.id AND NOT is_derived;
    IF v_count <> 1 THEN
        RAISE EXCEPTION 'expected exactly one manual expense, got %', v_count;
    END IF;

    -- ---- 4. harvest and sell ---------------------------------------------
    INSERT INTO public.harvests (
        farm_id, planting_id, cycle_id, harvest_date, harvest_type,
        quantity, quantity_unit, quality_grade
    )
    VALUES (v_farm, v_planting.id, v_cycle, DATE '2026-08-01', 'partial',
            2000, 'kg', 'export_a')
    RETURNING id INTO v_harvest;

    INSERT INTO public.sales (
        farm_id, harvest_id, sale_date, channel, customer_name,
        quantity, quantity_unit, unit_price, created_by
    )
    VALUES (v_farm, v_harvest, DATE '2026-08-05', 'export', 'Fruit Co',
            1500, 'kg', 1.20, v_user);

    SELECT total_amount INTO v_amount FROM public.sales WHERE harvest_id = v_harvest;
    IF v_amount <> 1800.00 THEN
        RAISE EXCEPTION 'expected 1500 x 1.20 = 1800.00, got %', v_amount;
    END IF;

    -- ---- 5. you cannot sell more than you picked -------------------------
    v_failed := false;
    BEGIN
        INSERT INTO public.sales (
            farm_id, harvest_id, sale_date, channel,
            quantity, quantity_unit, unit_price, created_by
        )
        VALUES (v_farm, v_harvest, DATE '2026-08-06', 'wholesale',
                600, 'kg', 1.00, v_user);
    EXCEPTION WHEN others THEN
        v_failed := true;
        v_message := SQLERRM;
    END;

    IF NOT v_failed THEN
        RAISE EXCEPTION 'expected selling 2100 kg of a 2000 kg harvest to be refused';
    END IF;
    IF v_message NOT LIKE '%2000%' OR v_message NOT LIKE '%1500%' THEN
        RAISE EXCEPTION 'expected the refusal to state picked and already-sold, got: %', v_message;
    END IF;

    -- Selling exactly the remainder is fine.
    INSERT INTO public.sales (
        farm_id, harvest_id, sale_date, channel,
        quantity, quantity_unit, unit_price, created_by
    )
    VALUES (v_farm, v_harvest, DATE '2026-08-06', 'wholesale',
            500, 'kg', 1.00, v_user);

    -- ---- 6. the rollup answers the actual question -----------------------
    SELECT * INTO v_row FROM public.planting_financials WHERE planting_id = v_planting.id;

    -- 125 inputs + 100 labour + 300 rent
    IF v_row.total_cost <> 525.00 THEN
        RAISE EXCEPTION 'expected total cost 525.00, got %', v_row.total_cost;
    END IF;
    -- 1800 export + 500 wholesale
    IF v_row.total_revenue <> 2300.00 THEN
        RAISE EXCEPTION 'expected total revenue 2300.00, got %', v_row.total_revenue;
    END IF;
    IF v_row.margin <> 1775.00 THEN
        RAISE EXCEPTION 'expected margin 1775.00, got %', v_row.margin;
    END IF;
    IF v_row.harvested_kg <> 2000 THEN
        RAISE EXCEPTION 'expected 2000 kg harvested, got %', v_row.harvested_kg;
    END IF;
    IF v_row.cost_per_kg <> 0.2625 THEN
        RAISE EXCEPTION 'expected cost per kg 0.2625, got %', v_row.cost_per_kg;
    END IF;

    -- ---- 7. harvests in other units still normalise ----------------------
    INSERT INTO public.harvests (
        farm_id, planting_id, cycle_id, harvest_date, harvest_type,
        quantity, quantity_unit
    )
    VALUES (v_farm, v_planting.id, v_cycle, DATE '2026-08-20', 'partial', 1, 't');

    SELECT harvested_kg INTO v_amount
    FROM public.planting_financials WHERE planting_id = v_planting.id;
    IF v_amount <> 3000 THEN
        RAISE EXCEPTION 'expected 2000 kg + 1 t = 3000 kg, got %', v_amount;
    END IF;

    -- ---- 8. the cycle rollup attributes to the season --------------------
    SELECT * INTO v_row FROM public.cycle_financials WHERE cycle_id = v_cycle;
    IF v_row.total_revenue <> 2300.00 THEN
        RAISE EXCEPTION 'expected the season to carry the revenue, got %', v_row.total_revenue;
    END IF;
    IF v_row.season_year <> 2026 THEN
        RAISE EXCEPTION 'expected the 2026 season, got %', v_row.season_year;
    END IF;

    -- ---- 9. an activity with no priced product derives nothing -----------
    UPDATE public.inventory_items SET cost_per_unit = NULL WHERE id = v_item;

    INSERT INTO public.crop_activities (
        farm_id, planting_id, location_id, activity_type, activity_date,
        inventory_item_id, quantity, quantity_unit
    )
    VALUES (v_farm, v_planting.id, v_loc, 'fertilisation', DATE '2026-09-01',
            v_item, 5, 'l')
    RETURNING id INTO v_activity;

    SELECT count(*) INTO v_count
    FROM public.expenses WHERE crop_activity_id = v_activity AND category = 'inputs';
    IF v_count <> 0 THEN
        RAISE EXCEPTION 'expected no input expense when the product has no cost, got %', v_count;
    END IF;

    RAISE NOTICE 'crop_financials: all 9 expectations passed';
END $$;

ROLLBACK;
