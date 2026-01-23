This patch ONLY updates your package.json to add the missing Tailwind/PostCSS devDependencies.
Nothing else is touched.

What this fixes:
- Vercel build error:
  "An error occurred in `next/font` ... Error: Cannot find module 'tailwindcss'"
  This happens because your postcss.config.js references 'tailwindcss' but it wasn't installed.

How to apply (Working Copy or GitHub web editor):
1) Replace the existing package.json in the repo root with the one inside this zip.
2) Commit the change.
3) Trigger a new Vercel deployment (it will run `npm install` and pick up devDependencies).

If you prefer commands (optional, not required if you use this zip):
npm i -D tailwindcss postcss autoprefixer
