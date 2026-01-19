# Deploy


## InnerDreams automation (free)

### Option A: Vercel Cron Jobs (recommended)
1. In Vercel project env vars, add `CRON_SECRET` (random 16+ chars).
2. Add `INNERDREAMS_PASSWORD` (same or different).
3. Deploy. Vercel will call `GET /api/innerdreams/cron` every 15 minutes.

Vercel automatically sends `Authorization: Bearer $CRON_SECRET` when invoking cron paths.

### Option B: GitHub Actions scheduler (fallback)
1. Add repo secrets:
   - `INNERDREAMS_URL` = `https://<your-domain>/api/innerdreams`
   - `INNERDREAMS_PASSWORD`
2. The workflow runs every 30 minutes.
