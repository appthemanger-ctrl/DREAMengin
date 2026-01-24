# Build Fix Patch

This patch pins React to 18.2.0, adds `react-hook-form`, provides a Supabase client,
and forces Vercel to use `npm install` instead of `npm ci` (so a lockfile is not required).

## Files included
- package.json
- vercel.json
- lib/supabase/client.js
- components/AccentPicker.js (placeholder component so imports don't break build)

## Next steps
1) Copy these files into your repo (merge/overwrite).
2) Commit and push:
   ```bash
   git add package.json vercel.json lib/supabase/client.js components/AccentPicker.js
   git commit -m "build: pin react 18, add react-hook-form, add supabase client, force npm install"
   git push
   ```
3) Ensure Vercel has the env vars set:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY

(Optional) If you prefer keeping `npm ci`, generate and commit a lockfile locally:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   git add package-lock.json
   git commit -m "chore: add package-lock"
   git push
   ```
