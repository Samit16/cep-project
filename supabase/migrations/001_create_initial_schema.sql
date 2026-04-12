-- ============================================
-- KJO Nagpur Community Platform - Initial Schema
-- Supabase PostgreSQL Migration
-- ============================================

-- Create custom types
CREATE TYPE public.user_role AS ENUM ('member', 'committee', 'admin');
CREATE TYPE public.contact_visibility AS ENUM ('public', 'private');

-- ============================================
-- PROFILES: Links to Supabase auth.users
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'member',
  member_id UUID DEFAULT NULL,
  is_first_login BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- MEMBERS: Community member records
-- ============================================
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  address TEXT,
  contact_numbers TEXT[] NOT NULL DEFAULT '{}',
  email TEXT,
  occupation TEXT,
  marital_status TEXT,
  current_place TEXT,
  kutch_town TEXT,
  family_members TEXT[] DEFAULT '{}',
  is_alive BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  profile_complete BOOLEAN NOT NULL DEFAULT false,
  contact_visibility contact_visibility NOT NULL DEFAULT 'private',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FK from profiles to members
ALTER TABLE public.profiles
  ADD CONSTRAINT fk_profiles_member
  FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE SET NULL;

-- ============================================
-- EVENTS
-- ============================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- AUDIT LOGS
-- ============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- CSV IMPORT ERRORS
-- ============================================
CREATE TABLE public.csv_import_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL,
  row_number INTEGER NOT NULL,
  field_name TEXT,
  value TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- SYSTEM SETTINGS
-- ============================================
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  default_password TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_members_name ON public.members(first_name, last_name);
CREATE INDEX idx_members_current_place ON public.members(current_place);
CREATE INDEX idx_members_occupation ON public.members(occupation);
CREATE INDEX idx_members_active ON public.members(active);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_member_id ON public.audit_logs(member_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_csv_import_errors_job_id ON public.csv_import_errors(job_id);
CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_profiles_role ON public.profiles(role);
