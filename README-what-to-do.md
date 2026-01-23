# CI Lockfile Fix (Vercel)

This forces Vercel to run **`npm install`** instead of **`npm ci`**, so you don't need
a `package-lock.json` right now.

## How to use

1) Drop **vercel.json** into your repo **root** (same folder as `package.json`).
2) Commit & push:

   ```bash
   git add vercel.json
   git commit -m "fix: use npm install on Vercel (no lockfile needed)"
   git push
   ```

## Optional (recommended later)

- Commit a real lockfile for reproducible builds:

  ```bash
  rm -rf node_modules
  npm install
  git add package-lock.json
  git commit -m "chore: add lockfile"
  git push
  ```

- Or switch to pnpm with frozen lockfile:

  - Run `pnpm i` locally to create `pnpm-lock.yaml`
  - In Vercel → Project Settings → General → Package Manager: **pnpm**
  - Then (optional) set this in vercel.json:
    ```json
    { "installCommand": "pnpm install --frozen-lockfile", "framework": "nextjs" }
    ```
