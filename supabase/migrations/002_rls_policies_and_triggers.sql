-- ============================================
-- RLS Policies & Triggers
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csv_import_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Helper function: get current user's role
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================
-- PROFILES policies
-- ============================================
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins/committee can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.get_user_role() IN ('admin', 'committee'));

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.get_user_role() = 'admin');

-- ============================================
-- MEMBERS policies
-- ============================================
-- Authenticated users can view active members (basic info)
CREATE POLICY "Authenticated users can view active members"
  ON public.members FOR SELECT
  TO authenticated
  USING (active = true);

-- Admins/committee can view ALL members (including inactive)
CREATE POLICY "Admins can view all members"
  ON public.members FOR SELECT
  USING (public.get_user_role() IN ('admin', 'committee'));

-- Admins/committee can insert members
CREATE POLICY "Admins can insert members"
  ON public.members FOR INSERT
  WITH CHECK (public.get_user_role() IN ('admin', 'committee'));

-- Admins/committee can update members
CREATE POLICY "Admins can update members"
  ON public.members FOR UPDATE
  USING (public.get_user_role() IN ('admin', 'committee'));

-- ============================================
-- EVENTS policies
-- ============================================
-- Public events are readable by anyone (including anon)
CREATE POLICY "Public events are viewable by anyone"
  ON public.events FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- Authenticated users can also see private events
CREATE POLICY "Authenticated users can view all events"
  ON public.events FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can create/update/delete events
CREATE POLICY "Admins can insert events"
  ON public.events FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins can update events"
  ON public.events FOR UPDATE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can delete events"
  ON public.events FOR DELETE
  USING (public.get_user_role() = 'admin');

-- ============================================
-- AUDIT LOGS policies
-- ============================================
-- Only admin/committee can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.get_user_role() IN ('admin', 'committee'));

-- Authenticated users can insert audit logs (for update requests)
CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- CSV IMPORT ERRORS policies
-- ============================================
CREATE POLICY "Admins can view csv import errors"
  ON public.csv_import_errors FOR SELECT
  USING (public.get_user_role() IN ('admin', 'committee'));

CREATE POLICY "Admins can insert csv import errors"
  ON public.csv_import_errors FOR INSERT
  WITH CHECK (public.get_user_role() IN ('admin', 'committee'));

-- ============================================
-- SYSTEM SETTINGS policies
-- ============================================
CREATE POLICY "Admins can view system settings"
  ON public.system_settings FOR SELECT
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can update system settings"
  ON public.system_settings FOR UPDATE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can insert system settings"
  ON public.system_settings FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'member');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_members
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_events
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_system_settings
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
