-- Farm invitations RPCs for Supabase cutover

CREATE OR REPLACE FUNCTION public.invite_farm_member(
    p_farm_id UUID,
    p_email TEXT,
    p_role TEXT DEFAULT 'member'
)
RETURNS public.farm_invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_email TEXT := lower(trim(p_email));
    v_invitation public.farm_invitations;
    v_token TEXT := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF NOT public.is_farm_owner(p_farm_id) THEN
        RAISE EXCEPTION 'Only farm owners can invite members';
    END IF;

    IF v_email IS NULL OR v_email = '' THEN
        RAISE EXCEPTION 'Email is required';
    END IF;

    IF p_role IS DISTINCT FROM 'member' THEN
        RAISE EXCEPTION 'Only member role is supported for invitations';
    END IF;

    -- Already a member?
    IF EXISTS (
        SELECT 1
        FROM public.farm_members fm
        JOIN public.profiles p ON p.id = fm.user_id
        WHERE fm.farm_id = p_farm_id
          AND lower(COALESCE(p.email, '')) = v_email
    ) THEN
        RAISE EXCEPTION 'User is already a farm member';
    END IF;

    -- Expire prior pending invites for same email
    UPDATE public.farm_invitations
    SET status = 'expired', updated_at = NOW()
    WHERE farm_id = p_farm_id
      AND lower(email) = v_email
      AND status = 'pending';

    INSERT INTO public.farm_invitations (
        farm_id,
        invited_by,
        email,
        role,
        status,
        token_hash,
        expires_at
    )
    VALUES (
        p_farm_id,
        v_user_id,
        v_email,
        'member',
        'pending',
        v_token,
        NOW() + INTERVAL '7 days'
    )
    RETURNING * INTO v_invitation;

    RETURN v_invitation;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_farm_invitation(p_invitation_id UUID)
RETURNS public.farm_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_email TEXT;
    v_invitation public.farm_invitations;
    v_member public.farm_members;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT lower(COALESCE(email, '')) INTO v_email FROM public.profiles WHERE id = v_user_id;

    SELECT * INTO v_invitation
    FROM public.farm_invitations
    WHERE id = p_invitation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invitation not found';
    END IF;

    IF v_invitation.status <> 'pending' THEN
        RAISE EXCEPTION 'Invitation is not pending';
    END IF;

    IF v_invitation.expires_at < NOW() THEN
        UPDATE public.farm_invitations
        SET status = 'expired', updated_at = NOW()
        WHERE id = p_invitation_id;
        RAISE EXCEPTION 'Invitation has expired';
    END IF;

    IF lower(COALESCE(v_invitation.email, '')) <> v_email THEN
        RAISE EXCEPTION 'Invitation email does not match current user';
    END IF;

    INSERT INTO public.farm_members (farm_id, user_id, role)
    VALUES (v_invitation.farm_id, v_user_id, COALESCE(v_invitation.role, 'member'))
    ON CONFLICT (farm_id, user_id) DO UPDATE
      SET role = EXCLUDED.role,
          updated_at = NOW()
    RETURNING * INTO v_member;

    UPDATE public.farm_invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        updated_at = NOW()
    WHERE id = p_invitation_id;

    RETURN v_member;
END;
$$;

CREATE OR REPLACE FUNCTION public.decline_farm_invitation(p_invitation_id UUID)
RETURNS public.farm_invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_email TEXT;
    v_invitation public.farm_invitations;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT lower(COALESCE(email, '')) INTO v_email FROM public.profiles WHERE id = v_user_id;

    SELECT * INTO v_invitation
    FROM public.farm_invitations
    WHERE id = p_invitation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invitation not found';
    END IF;

    IF v_invitation.status <> 'pending' THEN
        RAISE EXCEPTION 'Invitation is not pending';
    END IF;

    IF lower(COALESCE(v_invitation.email, '')) <> v_email THEN
        RAISE EXCEPTION 'Invitation email does not match current user';
    END IF;

    UPDATE public.farm_invitations
    SET status = 'declined',
        declined_at = NOW(),
        updated_at = NOW()
    WHERE id = p_invitation_id
    RETURNING * INTO v_invitation;

    RETURN v_invitation;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_my_invitations()
RETURNS TABLE (
    id UUID,
    farm_id UUID,
    farm_name TEXT,
    email VARCHAR,
    phone VARCHAR,
    role VARCHAR,
    status VARCHAR,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    declined_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email TEXT;
BEGIN
    SELECT lower(COALESCE(p.email, auth.jwt() ->> 'email', ''))
    INTO v_email
    FROM public.profiles p
    WHERE p.id = auth.uid();

    IF v_email IS NULL OR v_email = '' THEN
        v_email := lower(COALESCE(auth.jwt() ->> 'email', ''));
    END IF;

    RETURN QUERY
    SELECT
        i.id,
        i.farm_id,
        f.name::TEXT,
        i.email,
        i.phone,
        i.role,
        i.status,
        i.expires_at,
        i.created_at,
        i.accepted_at,
        i.declined_at
    FROM public.farm_invitations i
    JOIN public.farms f ON f.id = i.farm_id
    WHERE lower(COALESCE(i.email, '')) = v_email
    ORDER BY i.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.invite_farm_member TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_farm_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_farm_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_my_invitations() TO authenticated;
