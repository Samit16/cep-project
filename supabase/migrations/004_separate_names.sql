-- ============================================
-- Migration: Rename columns and split name
-- ============================================

-- Rename the exact case-sensitive columns
ALTER TABLE public.members RENAME COLUMN "NAME" TO first_name;
ALTER TABLE public.members RENAME COLUMN "LAST NAME" TO last_name;

-- Add the new middle_name column
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS middle_name TEXT;

-- Update the table to extract the middle name if there is a space in first_name
-- strpos returns the index of the first space
UPDATE public.members
SET 
  middle_name = trim(substring(first_name from strpos(first_name, ' ') + 1)),
  first_name = trim(substring(first_name from 1 for strpos(first_name, ' ') - 1))
WHERE strpos(first_name, ' ') > 0;
