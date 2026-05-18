-- ============================================
-- Migration: Decouple usernames from dummy emails
-- ============================================

-- 1. Add a username column to profiles to store "M-001", etc.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 2. Populate the username column for existing users based on their current auth email
-- Assuming their current email is format: username@kvonagpur.com
UPDATE public.profiles p
SET username = SPLIT_PART(u.email, '@', 1)
FROM auth.users u
WHERE p.id = u.id 
  AND u.email LIKE '%@kvonagpur.com'
  AND p.username IS NULL;

-- 3. Update auth.users with their real email from the members table (if they have one)
-- This removes the dummy email from the system for users who have provided a real one.
-- Note: Supabase requires emails to be unique in auth.users.
UPDATE auth.users u
SET email = m.email
FROM public.profiles p
JOIN public.members m ON p.member_id = m.id
WHERE u.id = p.id
  AND m.email IS NOT NULL 
  AND m.email != '' 
  AND m.email NOT LIKE '%@kvonagpur.com'
  AND u.email LIKE '%@kvonagpur.com';
