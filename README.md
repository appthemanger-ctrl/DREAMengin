# DREAMENGIN (Vite + React + Vercel)

This is a **Vite + React SPA** (not a static HTML site). Vite requires an `index.html` as the build entry,
but the UI is React (see `src/`).

## Routes
- `/` Landing (login/create)
- `/user` User home
- `/admin` Admin panel

## API (Vercel)
- `GET /api/health` -> ok
- `POST /api/innerdreams` -> admin actions (`ask`, `edit`, `pause`, `resume`, `autopilot`)

## Environment variables (Vercel Project Settings)
Required:
- `INNERDREAMS_PASSWORD`
- `OPENAI_API_KEY`
- `GITHUB_TOKEN`
- `GITHUB_OWNER`
- `GITHUB_REPO`
Optional:
- `OPENAI_MODEL` (default: gpt-5.2)
- `INNERDREAMS_BRANCH_PREFIX` (default: innerdreams)
- `INNERDREAMS_DAILY_LIMIT` (default: 1)

## Run locally
```bash
npm i
npm run dev
```

## Deploy
Push to GitHub, import repo in Vercel, set env vars, deploy.
