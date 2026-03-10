-- Add profile_dream_widgets column to store the saved Dream projection for ViewProfile.
-- This is the output of EditProfileDream, not HomeDream source state.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_dream_widgets JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN profiles.profile_dream_widgets IS
  'Saved projection — the ordered list of Dreams the user has chosen to show on ViewProfile.
   This is the output of EditProfileDream, not HomeDream source state.';
