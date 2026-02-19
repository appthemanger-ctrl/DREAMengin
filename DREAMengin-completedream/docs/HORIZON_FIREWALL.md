
This project now includes an **edge firewall** inspired by the ideas in your Archive:

- **Participation weight P**: authenticated users get more benefit of the doubt (lower risk).
- **Channel capacity C**: the more context we can see (auth + headers), the more confident we are.
- **Ledger tension L**: a divergence/entropy proxy measuring scan-like behavior (many unique paths quickly).
- **Quadratic risk**: `I = C * L^2` (boundary information grows superlinearly when behavior diverges).

## Files

- Optional env var:

## What it does today

- Blocks obvious exploit probes (path traversal, `.env` fishing, SQLi/XSS strings).
- Adds a **soft challenge** (delay) for high-entropy/bursty traffic.
- Keeps a small **signed** cookie ledger so decisions improve across requests *without* needing Redis.

## What to add later (when you’re ready)

- Redis/Upstash storage for stronger rate limiting (bots can delete cookies).
- Cloudflare WAF rules for bot mitigation + geo/IP reputation.
- A “challenge page” (CAPTCHA / proof-of-work) instead of delay.