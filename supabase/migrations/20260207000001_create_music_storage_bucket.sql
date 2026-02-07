-- Create storage bucket for music files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'music-files',
  'music-files',
  true,
  104857600, -- 100MB in bytes
  ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/flac', 'application/zip', 'application/x-zip-compressed']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload music files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'music-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access
CREATE POLICY "Anyone can read music files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'music-files');

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own music"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'music-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own files
CREATE POLICY "Users can update their own music"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'music-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
