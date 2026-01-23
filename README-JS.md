
# JS Conversion Kit (for DREAMengin)

What this does
- Converts the project from TypeScript to pure JavaScript by renaming .ts/.tsx -> .js/.jsx and stripping simple type annotations.
- Disables `tsconfig.json` and `next-env.d.ts` (they are renamed with `.bak_disabled`).
- Keeps your code working with Next.js 14 App Router.

How to use (iOS / Working Copy friendly)
1) Copy the **scripts/convert-to-js.mjs** and **jsconfig.json** into the root of your repo.
2) Edit your package.json:
   - Add this to `scripts`:
     "prebuild": "node scripts/convert-to-js.mjs && node scripts/gen-mod-registry.mjs || true"
   - (optional) Remove TypeScript devDeps: typescript, @types/node, @types/react, @types/react-dom
3) Commit and push.
4) Trigger Vercel deploy. The prebuild step will convert TS->JS before building.
5) If you like the result, you can delete the `*.bak.ts-removed` backups in a later commit.

Revert
- Rename `tsconfig.json.bak_disabled` back to `tsconfig.json` and restore files from backups if needed.
