-- ============================================
-- 010: Update Members RLS for Family Management
-- ============================================

-- Drop the old policy that only allowed users to update their own individual record
DROP POLICY IF EXISTS "Members can update own record" ON public.members;

-- Allow authenticated users to update any member record in their family
CREATE POLICY "Members can update family records"
  ON public.members FOR UPDATE
  TO authenticated
  USING (
    id = (SELECT member_id FROM public.profiles WHERE id = auth.uid())
    OR
    (
      family_id IS NOT NULL 
      AND 
      family_id = (
        SELECT family_id FROM public.members 
        WHERE id = (SELECT member_id FROM public.profiles WHERE id = auth.uid())
      )
    )
  )
  WITH CHECK (
    id = (SELECT member_id FROM public.profiles WHERE id = auth.uid())
    OR
    (
      family_id IS NOT NULL 
      AND 
      family_id = (
        SELECT family_id FROM public.members 
        WHERE id = (SELECT member_id FROM public.profiles WHERE id = auth.uid())
      )
    )
  );

-- Allow authenticated users to insert new family members into their own family
CREATE POLICY "Members can insert family records"
  ON public.members FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id IS NOT NULL 
    AND 
    family_id = (
      SELECT family_id FROM public.members 
      WHERE id = (SELECT member_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Notify PostgREST to pick up changes
NOTIFY pgrst, 'reload schema';
