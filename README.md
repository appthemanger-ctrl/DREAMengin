# DREAMengin UI/UX Patch

This zip contains Tailwind + Next UI update (landing, login, home with draggable widgets),
providers, theme manager, and configs. Drop into your repo root and commit.

Env vars (Vercel > Settings > Environment Variables):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

Supabase table `widgets` suggested columns:
- id (uuid default uuid_generate_v4() primary key)
- owner (uuid references auth.users)
- title text, body text, url text, type text
- position int
