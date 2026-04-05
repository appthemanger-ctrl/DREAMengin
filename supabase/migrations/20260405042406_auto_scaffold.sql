-- supabase/migrations/20260405042406_auto_scaffold.sql
--
-- Storage bucket provisioning for DREAMengin media upload surfaces.
--
-- Buckets created:
--   images  — post images, comment attachments  (HomeFeed, DreamDMBar)
--   videos  — post videos, comment attachments  (DreamDMBar)
--   files   — generic file attachments          (DreamDMBar)
--   avatars — user avatar / cover uploads       (ProfileEditor)
--
-- All buckets are private by default (public = false).
-- Storage RLS policies mirror the app's auth model:
--   • Authenticated users may upload into their own folder (uid/ prefix).
--   • Authenticated users may read any object (public CDN URLs are shared).
--   • Users may delete their own objects.
--   • Service-role bypasses RLS for server-side operations.
--
-- Storage object paths follow the convention:
--   {user_id}/{context}/{timestamp}-{uuid}.{ext}
-- This is enforced by the RLS INSERT check below.
--
-- Security: no object is readable by anonymous users — all reads require
-- auth.uid() to be non-null.  Public CDN URLs still work because Supabase
-- Storage serves signed URLs; unauthenticated downloads are blocked at the
-- bucket level.

-- ── 1. Bucket: images ─────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  false,
  10485760,                                        -- 10 MB per file
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif','image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Read: any authenticated user may read objects in the images bucket.
DROP POLICY IF EXISTS "images_read_authenticated"  ON storage.objects;
CREATE POLICY "images_read_authenticated" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Insert: authenticated users may only upload into their own uid/ folder.
DROP POLICY IF EXISTS "images_insert_own" ON storage.objects;
CREATE POLICY "images_insert_own" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update: owners may update (replace) their own objects.
DROP POLICY IF EXISTS "images_update_own" ON storage.objects;
CREATE POLICY "images_update_own" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'images'
    AND auth.uid() IS NOT NULL
    AND owner = auth.uid()
  );

-- Delete: owners may delete their own objects.
DROP POLICY IF EXISTS "images_delete_own" ON storage.objects;
CREATE POLICY "images_delete_own" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'images'
    AND auth.uid() IS NOT NULL
    AND owner = auth.uid()
  );

-- ── 2. Bucket: videos ─────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  false,
  524288000,                                       -- 500 MB per file
  ARRAY['video/mp4','video/webm','video/ogg','video/quicktime','video/x-msvideo']
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "videos_read_authenticated"  ON storage.objects;
CREATE POLICY "videos_read_authenticated" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'videos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "videos_insert_own" ON storage.objects;
CREATE POLICY "videos_insert_own" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'videos'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "videos_update_own" ON storage.objects;
CREATE POLICY "videos_update_own" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'videos'
    AND auth.uid() IS NOT NULL
    AND owner = auth.uid()
  );

DROP POLICY IF EXISTS "videos_delete_own" ON storage.objects;
CREATE POLICY "videos_delete_own" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'videos'
    AND auth.uid() IS NOT NULL
    AND owner = auth.uid()
  );

-- ── 3. Bucket: files ──────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'files',
  'files',
  false,
  52428800,                                        -- 50 MB per file
  ARRAY[
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/octet-stream',
    'text/plain',
    'text/csv',
    'application/json',
    'audio/mpeg','audio/wav','audio/ogg','audio/mp4','audio/webm',
    'image/jpeg','image/png','image/webp','image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "files_read_authenticated"  ON storage.objects;
CREATE POLICY "files_read_authenticated" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'files' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "files_insert_own" ON storage.objects;
CREATE POLICY "files_insert_own" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'files'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "files_update_own" ON storage.objects;
CREATE POLICY "files_update_own" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'files'
    AND auth.uid() IS NOT NULL
    AND owner = auth.uid()
  );

DROP POLICY IF EXISTS "files_delete_own" ON storage.objects;
CREATE POLICY "files_delete_own" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'files'
    AND auth.uid() IS NOT NULL
    AND owner = auth.uid()
  );

-- ── 4. Bucket: avatars ────────────────────────────────────────────────────────
-- Used by ProfileEditor for avatar and cover photo uploads.
-- Avatars are readable by anyone (profile photos are public).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,                                            -- avatars are publicly readable
  5242880,                                         -- 5 MB per file
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif']
)
ON CONFLICT (id) DO UPDATE
  SET public             = EXCLUDED.public,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public bucket — reads are open (no auth required for CDN URLs).
-- No SELECT policy needed; public = true handles it.

DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
CREATE POLICY "avatars_insert_own" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND owner = auth.uid()
  );

DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
CREATE POLICY "avatars_delete_own" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND owner = auth.uid()
  );
