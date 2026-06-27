-- ============================================
-- Archive Posts — Committee member blog posts
-- ============================================

CREATE TABLE public.archive_posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL DEFAULT '',
  image_urls   TEXT[] NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast chronological feed
CREATE INDEX idx_archive_posts_created_at ON public.archive_posts(created_at DESC);
CREATE INDEX idx_archive_posts_author_id  ON public.archive_posts(author_id);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE public.archive_posts ENABLE ROW LEVEL SECURITY;

-- All authenticated members can READ posts
CREATE POLICY "members_can_read_archive_posts"
  ON public.archive_posts
  FOR SELECT
  TO authenticated
  USING (true);

-- Only committee / admin users can INSERT posts
-- We check the role via the profiles table
CREATE POLICY "committee_can_insert_archive_posts"
  ON public.archive_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('committee', 'admin')
        AND is_active = true
    )
  );

-- Only the original author can UPDATE their own post
CREATE POLICY "author_can_update_own_archive_post"
  ON public.archive_posts
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Only the original author can DELETE their own post
CREATE POLICY "author_can_delete_own_archive_post"
  ON public.archive_posts
  FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- ============================================
-- Supabase Storage: archive_images bucket
-- Run these via the Supabase dashboard SQL editor
-- or your CLI after creating the bucket.
-- ============================================

-- Create bucket (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('archive_images', 'archive_images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow committee/admin to upload images
CREATE POLICY "committee_can_upload_archive_images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'archive_images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('committee', 'admin')
        AND is_active = true
    )
  );

-- Allow authors to delete their own uploaded images
CREATE POLICY "author_can_delete_archive_images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'archive_images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow everyone (anon + authenticated) to read public images
CREATE POLICY "public_can_read_archive_images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'archive_images');
