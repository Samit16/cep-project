-- ============================================
-- Migration 015: Notifications table
-- Run this in the Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL DEFAULT 'general',
  title      TEXT NOT NULL DEFAULT '',
  message    TEXT NOT NULL DEFAULT '',
  link       TEXT NOT NULL DEFAULT '',
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id   ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read    ON public.notifications(user_id, is_read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
DROP POLICY IF EXISTS "users_can_read_own_notifications" ON public.notifications;
CREATE POLICY "users_can_read_own_notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update (mark as read) their own notifications
DROP POLICY IF EXISTS "users_can_update_own_notifications" ON public.notifications;
CREATE POLICY "users_can_update_own_notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Users can delete their own notifications
DROP POLICY IF EXISTS "users_can_delete_own_notifications" ON public.notifications;
CREATE POLICY "users_can_delete_own_notifications"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Service role (server-side API) can insert notifications for any user
-- This is handled via the service role key which bypasses RLS.
-- No INSERT policy needed for authenticated role since inserts are done server-side.
