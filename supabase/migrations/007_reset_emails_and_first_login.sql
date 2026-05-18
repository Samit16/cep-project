-- ============================================
-- CONSOLIDATED RESET MIGRATION
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- 1. Ensure the username column exists on public.profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 2. Populate the username column from current auth.users email (e.g. M-001 from M-001@kvonagpur.com)
-- This is critical so we don't lose their login username during the reset.
UPDATE public.profiles p
SET username = SPLIT_PART(u.email, '@', 1)
FROM auth.users u
WHERE p.id = u.id 
  AND u.email LIKE '%@kvonagpur.com'
  AND p.username IS NULL;

-- 3. Reset the email field in the public.members table to NULL for all members
UPDATE public.members
SET email = NULL, email_verified = false;

-- 4. Reset all auth.users emails back to the dummy format so login still works.
-- For accounts that have a username, we reconstruct the dummy email username@kvonagpur.com
UPDATE auth.users u
SET email = p.username || '@kvonagpur.com',
    email_confirmed_at = now(),        -- keep confirmed so they can still log in
    email_change = '',                 -- clear pending email-change requests
    email_change_token_new = '',       -- clear pending tokens
    email_change_confirm_status = 0   -- reset confirmation state
FROM public.profiles p
WHERE u.id = p.id
  AND p.username IS NOT NULL;

-- 5. Set all is_first_login flags to true on profiles
-- This forces the mandatory email prompt to show up next time they log in.
UPDATE public.profiles
SET is_first_login = true;
