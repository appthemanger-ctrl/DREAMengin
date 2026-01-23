# Dreampage (Ignition)

Next.js App Router + Supabase SSR starter.

## Env
Create `.env.local` (and on Vercel Environment Variables):
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_anon
```

## Scripts
- `npm run dev`
- `npm run build`

The registry generator scans `modules/widgets/*` and `modules/connectors/*` and writes `modules/registry.generated.ts`.
