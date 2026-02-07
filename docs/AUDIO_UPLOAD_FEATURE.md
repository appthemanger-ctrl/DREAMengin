# Audio File Upload Feature

This document describes the audio file upload feature added to DREAMengin's music release system.

## Overview

Users can now upload actual audio files (MP3, WAV, OGG, FLAC, ZIP) in addition to embedding YouTube/Spotify URLs.

## Features

### 1. File Upload Support
- **Drag-and-drop** interface for easy file selection
- **Multiple format support**: MP3, WAV, OGG, FLAC, ZIP archives
- **File size limit**: 100MB per upload
- **Real-time validation**: Checks file type and size before upload
- **Upload progress indicator**: Shows upload status in real-time

### 2. Dual Upload Methods
Users can choose between:
- **File Upload**: Upload audio files directly to Supabase Storage
- **Embed URL**: Use YouTube or Spotify embed links (original functionality preserved)

### 3. Storage & Security
- Files stored in Supabase Storage bucket: `music-files`
- Organized by user: `{user_id}/{timestamp}_{filename}`
- **Public read access** for streaming
- **Authenticated upload/delete**: Only owners can manage their files
- **Row Level Security (RLS)** policies enforce access control

### 4. Enhanced Music Player
- **HTML5 audio player** for uploaded files
- **Embedded iframes** for YouTube/Spotify (existing functionality)
- **File metadata display**: Shows file size for uploaded tracks
- Seamless switching between playback methods

## Database Schema

New columns added to `music_releases` table:

```sql
- audio_url: TEXT              -- Public URL for uploaded audio file
- audio_storage_path: TEXT     -- Storage path for file cleanup
- file_size_bytes: BIGINT      -- File size for display/tracking
- duration_seconds: INTEGER    -- Track duration (for future use)
- description: TEXT            -- Track description
- genre: TEXT                  -- Music genre
- cover_url: TEXT              -- Cover art URL
- created_at: TIMESTAMPTZ      -- Creation timestamp
- user_id: UUID                -- User reference (indexed)
```

**Constraint**: At least one of `embed_url` OR `audio_url` must be provided.

## API Changes

### POST /api/music

**New Request Body Fields:**
```typescript
{
  title: string;              // Required
  audio_url?: string;         // Optional - from file upload
  audio_storage_path?: string; // Optional - for file cleanup
  file_size_bytes?: number;   // Optional - file size in bytes
  duration_seconds?: number;  // Optional - track duration
  embed_url?: string;         // Optional - YouTube/Spotify URL
  visibility?: 'public' | 'private'; // Default: 'public'
  description?: string;       // Optional
  genre?: string;             // Optional
  cover_url?: string;         // Optional
}
```

**Validation:**
- At least one of `audio_url` or `embed_url` must be provided
- Title is required

### DELETE /api/music?id={release_id}

**Enhanced behavior:**
- Automatically deletes associated audio file from storage
- Only owner can delete their releases
- Removes database record after storage cleanup

## Frontend Components

### Upload Page (`app/music/upload/page.tsx`)

**New UI Elements:**
1. **Upload Method Selector**: Toggle between file upload and URL embed
2. **Drag & Drop Zone**: 
   - Visual feedback on drag over
   - Click to browse files
   - File preview with metadata
   - Remove file option
3. **File Validation**:
   - Real-time type checking
   - Size limit enforcement
   - User-friendly error messages
4. **Upload Progress**:
   - Progress bar during upload
   - Percentage indicator
   - Loading states

### Music Listing Page (`app/music/page.tsx`)

**Enhanced Display:**
- HTML5 `<audio>` player for uploaded files
- Embedded iframes for YouTube/Spotify
- File size badge for uploaded tracks
- Consistent card layout for all music types

## Storage Policies

### Upload Policy
```sql
CREATE POLICY "Users can upload music files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'music-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Read Policy
```sql
CREATE POLICY "Anyone can read music files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'music-files');
```

### Delete Policy
```sql
CREATE POLICY "Users can delete their own music"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'music-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## Setup Instructions

### 1. Run Database Migrations

```bash
# Start local Supabase (if using local development)
npm run db:start

# Apply migrations
npx supabase db reset

# Or apply specific migrations
npx supabase migration up
```

### 2. Configure Storage (Production)

In Supabase Dashboard:
1. Go to **Storage** → **Create bucket**
2. Name: `music-files`
3. Public: **Yes**
4. File size limit: **100 MB**
5. Allowed MIME types:
   - `audio/mpeg`
   - `audio/wav`
   - `audio/mp3`
   - `audio/ogg`
   - `audio/flac`
   - `application/zip`
   - `application/x-zip-compressed`

### 3. Apply Storage Policies

Run the SQL from migration `20260207000001_create_music_storage_bucket.sql` in Supabase SQL Editor.

## Usage Examples

### Uploading a File

1. Navigate to `/music/upload`
2. Click "Upload File" method
3. Drag an MP3 file or click to browse
4. Enter track title (auto-filled from filename)
5. Choose visibility (public/private)
6. Click "Upload Track"
7. Wait for upload progress to complete
8. Redirected to music listing

### Using Embed URL (Existing Functionality)

1. Navigate to `/music/upload`
2. Click "Embed URL" method
3. Paste YouTube or Spotify URL
4. Enter track title
5. Choose visibility
6. See live preview
7. Click "Upload Track"

## File Structure

```
app/
├── music/
│   ├── upload/
│   │   └── page.tsx          # Enhanced upload form
│   └── page.tsx               # Enhanced music listing
└── api/
    └── music/
        └── route.ts           # Enhanced API with file support

supabase/
└── migrations/
    ├── 20260207000000_add_audio_file_support.sql
    └── 20260207000001_create_music_storage_bucket.sql
```

## Testing

### Manual Testing Checklist

- [ ] Upload MP3 file < 100MB
- [ ] Upload WAV file
- [ ] Upload ZIP archive
- [ ] Try to upload file > 100MB (should fail with error)
- [ ] Try to upload unsupported format (should fail with error)
- [ ] Drag and drop file (should work)
- [ ] Remove selected file before upload
- [ ] Upload with YouTube URL (backward compatibility)
- [ ] Upload with Spotify URL (backward compatibility)
- [ ] Verify audio player appears for uploaded files
- [ ] Verify iframe appears for embedded URLs
- [ ] Delete release with uploaded file (verify storage cleanup)
- [ ] Check file size display
- [ ] Test upload progress indicator

### Security Testing

- [ ] Verify only authenticated users can upload
- [ ] Verify users can only delete their own files
- [ ] Verify public can read/stream files
- [ ] Verify RLS policies prevent unauthorized access
- [ ] Test file path sanitization
- [ ] Verify at least one audio source is required

## Future Enhancements

1. **Audio Duration Detection**: Extract and store duration_seconds from uploaded files
2. **Cover Art Upload**: Allow users to upload custom cover art
3. **Waveform Visualization**: Display audio waveforms
4. **Batch Upload**: Support multiple file uploads at once
5. **Download Option**: Allow users to download uploaded tracks
6. **Playlist Support**: Create and manage playlists
7. **Analytics**: Track play counts and listening time
8. **Transcoding**: Convert uploaded files to optimized formats
9. **Metadata Extraction**: Read ID3 tags from MP3 files
10. **Collaborative Playlists**: Share and collaborate on playlists

## Known Limitations

1. No audio duration detection implemented yet (database field exists)
2. ZIP files are accepted but not extracted (user-managed)
3. No file format conversion/optimization
4. Upload progress doesn't show exact percentage (simulated)
5. No waveform visualization
6. No download functionality for uploaded files

## Troubleshooting

### Upload Fails with "Unauthorized"
- Ensure user is logged in
- Check Supabase authentication status
- Verify storage policies are applied

### Upload Fails with "Bucket Not Found"
- Create `music-files` bucket in Supabase
- Run storage migration SQL
- Check bucket name matches exactly

### File Not Playing
- Verify `audio_url` is set correctly
- Check browser console for CORS errors
- Ensure storage bucket is public
- Try accessing the URL directly

### Storage Cleanup Not Working
- Check `audio_storage_path` is saved correctly
- Verify delete policy is applied
- Check Supabase logs for errors

## Support

For issues or questions:
1. Check Supabase logs in dashboard
2. Review browser console for errors
3. Verify all migrations are applied
4. Check storage policies in Supabase dashboard
