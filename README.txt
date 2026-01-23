# Colorflow Glass Patch (Next 16.1.4 compatible)

This patch adds a soft "glass" look and a slowly-changing background gradient,
without clobbering your existing styles.

## Files in this patch
- styles/extra.css      ← new (safe to add)
- app/layout.tsx        ← updated sample (shows two tiny changes)

## What it does
- Defines an animated gradient that's **scoped to `html.colorflow`** so it won't
  override your current background unless you opt in.
- Provides a `.glass` utility class for cards/sections.
- Provides `.btn-brand` for red/brand buttons.

## How to apply

**Option A: Minimal (recommended)**
1) Copy `styles/extra.css` into your repo at `styles/extra.css`.
2) Edit your existing `app/layout.tsx`:
   - Add: `import "@/styles/extra.css";` below the globals.css import.
   - Add `" colorflow"` to the `<html ... className={...}>` so it becomes:
     `className={htmlClass + " colorflow"}`
   - Ensure you don't have a stray `@ts-expect-error` blocking render.

**Option B: Replace layout**
If your layout is small, you can just replace your `app/layout.tsx` with the
one in `app/layout.tsx` from this patch (then reinsert any custom bits).

## Notes
- Works on Next.js 16.1.4 and the App Router.
- Does not require Tailwind changes; it's plain CSS with keyframes.
- If you want the gradient slower/faster, tweak `42s` in `colorflow-pan` animation.
- To use the glass effect, add `className="glass"` on containers/cards.