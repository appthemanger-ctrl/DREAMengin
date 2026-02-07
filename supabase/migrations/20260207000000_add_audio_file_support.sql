-- Add audio file storage columns to music_releases table
ALTER TABLE music_releases
ADD COLUMN audio_url TEXT,
ADD COLUMN audio_storage_path TEXT,
ADD COLUMN file_size_bytes BIGINT,
ADD COLUMN duration_seconds INTEGER,
ADD COLUMN description TEXT,
ADD COLUMN genre TEXT,
ADD COLUMN cover_url TEXT,
ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_music_releases_user_id ON music_releases(user_id);
CREATE INDEX IF NOT EXISTS idx_music_releases_created_at ON music_releases(created_at DESC);

-- Add check constraint to ensure at least one audio source is provided
ALTER TABLE music_releases 
ADD CONSTRAINT at_least_one_audio_source 
CHECK (embed_url IS NOT NULL OR audio_url IS NOT NULL);
