-- Add audio file storage columns to music_releases table
ALTER TABLE music_releases
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS audio_storage_path TEXT,
ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS genre TEXT,
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_music_releases_owner_id ON music_releases(owner_id);
CREATE INDEX IF NOT EXISTS idx_music_releases_created_at ON music_releases(created_at DESC);

-- Add check constraint to ensure at least one audio source is provided
ALTER TABLE music_releases 
ADD CONSTRAINT at_least_one_audio_source 
CHECK (embed_url IS NOT NULL OR audio_url IS NOT NULL);
