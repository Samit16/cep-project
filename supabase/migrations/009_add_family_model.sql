-- ============================================
-- Add Family Model
-- ============================================

-- 1. Create families table
CREATE TABLE public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add family_id to members
ALTER TABLE public.members
  ADD COLUMN family_id UUID REFERENCES public.families(id) ON DELETE SET NULL;

CREATE INDEX idx_members_family_id ON public.members(family_id);

CREATE TRIGGER set_updated_at_families
  BEFORE UPDATE ON public.families
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 3. RLS for families
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all families"
  ON public.families FOR SELECT
  USING (public.get_user_role() IN ('admin', 'committee'));

CREATE POLICY "Admins can update families"
  ON public.families FOR UPDATE
  USING (public.get_user_role() IN ('admin', 'committee'));

CREATE POLICY "Admins can insert families"
  ON public.families FOR INSERT
  WITH CHECK (public.get_user_role() IN ('admin', 'committee'));

CREATE POLICY "Users can view their own family"
  ON public.families FOR SELECT
  USING (id IN (
    SELECT family_id FROM public.members 
    WHERE id = (SELECT member_id FROM public.profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Users can update their own family"
  ON public.families FOR UPDATE
  USING (id IN (
    SELECT family_id FROM public.members 
    WHERE id = (SELECT member_id FROM public.profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Users can insert families"
  ON public.families FOR INSERT
  WITH CHECK (true);

-- 4. Assign every existing member a unique family so they can use the new system immediately
DO $$
DECLARE
  rec RECORD;
  new_family_id UUID;
BEGIN
  FOR rec IN SELECT id, last_name FROM public.members WHERE family_id IS NULL
  LOOP
    INSERT INTO public.families (name) VALUES (COALESCE(rec.last_name, 'Unknown') || ' Family') RETURNING id INTO new_family_id;
    UPDATE public.members SET family_id = new_family_id WHERE id = rec.id;
  END LOOP;
END;
$$;
