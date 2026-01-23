
# Soft Red Accent UI (keep-original-look)

This patch keeps your original glass/gradient look and only adds **a bit of red** for
CTA buttons and small accents.

**Changed files**
- `styles/globals.css` – background & glass styles, `--brand` red for buttons only
- `app/page.tsx` – hero card with red primary button and outlined secondary
- `components/NavBar.tsx` – glassy navbar, brand dot, no heavy red

Drop these files into your repo (same paths). It works with Next 16.1.4.
