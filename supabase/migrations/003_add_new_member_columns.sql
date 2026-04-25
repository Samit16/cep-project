-- ============================================
-- Migration: Add nukh, birthplace, and relations to members
-- ============================================

ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS nukh TEXT,
ADD COLUMN IF NOT EXISTS birthplace TEXT,
ADD COLUMN IF NOT EXISTS relations JSONB DEFAULT '[]'::jsonb;
