# Next.js Detection Fix (Drop-in Patch)

1) Place these files in the **repo root** (same folder as your `src/` and `app/`).
   - package.json
   - next.config.mjs
   - jsconfig.json
   - vercel.json

2) Commit:
   git add package.json next.config.mjs jsconfig.json vercel.json
   git commit -m "chore: ensure Next.js detected by Vercel"
   git push

3) In Vercel Project → Settings → General:
   - Root Directory: `/` (repo root)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

That's it. Vercel will detect Next.js and build.
