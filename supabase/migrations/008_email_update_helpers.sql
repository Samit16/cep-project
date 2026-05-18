-- Migration: Create helper functions for email management
-- These functions run with SECURITY DEFINER to access the auth schema

-- 1. Clear any pending email change (new_email) for a user
CREATE OR REPLACE FUNCTION public.clear_pending_email_change(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  UPDATE auth.users
  SET
    email_change = '',
    email_change_token_new = '',
    email_change_token_current = '',
    email_change_confirm_status = 0,
    new_email = NULL  -- Clear pending new email
  WHERE id = target_user_id;
END;
$$;

-- 2. Find conflicting email entries in auth.users (excluding a specific user)
CREATE OR REPLACE FUNCTION public.find_email_conflicts(check_email TEXT, exclude_user_id UUID)
RETURNS TABLE(id UUID, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email::TEXT
  FROM auth.users u
  WHERE (LOWER(u.email) = LOWER(check_email) OR LOWER(u.new_email) = LOWER(check_email))
    AND u.id != exclude_user_id;
END;
$$;

-- 3. Force update a user's email directly in auth.users (nuclear option)
CREATE OR REPLACE FUNCTION public.admin_force_update_email(target_user_id UUID, new_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  -- First clear the email from any other user's new_email field
  UPDATE auth.users
  SET new_email = NULL
  WHERE LOWER(new_email) = LOWER(admin_force_update_email.new_email)
    AND id != target_user_id;

  -- Now update the target user's email
  UPDATE auth.users
  SET
    email = admin_force_update_email.new_email,
    email_confirmed_at = NOW(),
    email_change = '',
    email_change_token_new = '',
    email_change_token_current = '',
    email_change_confirm_status = 0,
    new_email = NULL,
    updated_at = NOW()
  WHERE id = target_user_id;

  -- Also update the identity email in auth.identities
  UPDATE auth.identities
  SET
    identity_data = jsonb_set(
      COALESCE(identity_data, '{}'::jsonb),
      '{email}',
      to_jsonb(admin_force_update_email.new_email)
    ),
    updated_at = NOW()
  WHERE user_id = target_user_id
    AND provider = 'email';
END;
$$;

-- Grant execute permissions to the service role
GRANT EXECUTE ON FUNCTION public.clear_pending_email_change(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.find_email_conflicts(TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_force_update_email(UUID, TEXT) TO service_role;
