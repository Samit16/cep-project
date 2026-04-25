-- ============================================
-- 005: Refined RLS — Members can update their OWN record
-- ============================================
-- Currently only admin/committee can update members via RLS.
-- This adds a policy allowing authenticated users to update
-- their own linked member row (profile.member_id == member.id).

-- Allow a member to update their own row
CREATE POLICY "Members can update own record"
  ON public.members FOR UPDATE
  TO authenticated
  USING (
    id = (SELECT member_id FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    id = (SELECT member_id FROM public.profiles WHERE id = auth.uid())
  );

-- Notify PostgREST to pick up changes
NOTIFY pgrst, 'reload schema';
