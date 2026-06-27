-- ============================================================
-- Archive Post Views — track who has seen each post
-- ============================================================

CREATE TABLE public.archive_post_views (
  post_id    UUID NOT NULL REFERENCES public.archive_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)        -- one row per user per post
);

CREATE INDEX idx_archive_post_views_post_id ON public.archive_post_views(post_id);

ALTER TABLE public.archive_post_views ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can record their own view
CREATE POLICY "users_can_insert_own_view"
  ON public.archive_post_views
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Authors can read view counts for their own posts;
-- all authenticated users can read (needed for the aggregate count query)
CREATE POLICY "authenticated_can_read_views"
  ON public.archive_post_views
  FOR SELECT
  TO authenticated
  USING (true);
