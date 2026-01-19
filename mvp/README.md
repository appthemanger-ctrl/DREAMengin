# Dreamengin (Full-Stack MVP)

This bundle is a working **full-stack** MVP scaffold for Dreamengin:

- **Auth** (register/login/logout + session cookies)
- **Profiles** (a flexible JSON “Dream Home” config per user)
- **Posts** (Mini Wall posts with `public | friends | private` visibility)
- **Following** (follow/unfollow + feed that only shows who you follow — no flooding)
- **Public pages** (`/u/:username`)

The front-end includes:
- Landing (`/`)
- Auth page (`/login`)
- Private Home (existing Dreamengin UI) (`/home`)
- Mini Wall MVP (`/wall`)
- Public page (`/u/:username`)

## Quick start

```bash
npm install
npm run dev
```

Open:
- `http://localhost:5000/` (or the port your dev script prints)

## Database

The app supports a Postgres database via `DATABASE_URL` (Drizzle).

If `DATABASE_URL` is **not** set, it will run in **in-memory mode** so you can prototype immediately.
In-memory data resets when the server restarts.

To use Postgres:

```bash
export DATABASE_URL="postgres://..."
npm run db:push
npm run dev
```

## Notes

- The “connect to everything” (TikTok/IG/YouTube/etc.) is intentionally stubbed at UI-level for now.
  Wiring those connectors typically needs OAuth + platform APIs.
- The Innerdreams admin endpoint exists as a controlled hook for the “AI updates the site” loop.
