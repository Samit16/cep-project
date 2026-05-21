-- ============================================
-- Add Singular Relation Column to Members Table
-- ============================================

ALTER TABLE public.members
  ADD COLUMN relation TEXT;
