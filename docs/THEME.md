# DREAMengin — Visual Theme

**Status:** Active  
**Last updated:** 2026-03-06

---

## Overview

DREAMengin uses a clean, light "Dream Ice" aesthetic — warm sky-blue transitioning to gold cream.

---

## Background Gradient

```css
background: linear-gradient(
  148deg,
  #c8dff5 0%,    /* light sky blue */
  #d8eaf8 55%,   /* soft ice */
  #f5e8c4 100%   /* warm gold cream */
);
```

CSS tokens: `--de-theme-from`, `--de-theme-mid`, `--de-theme-to`, `--de-theme-angle`  
User-overridable via Settings → Appearance → Theme.

---

## Cards & Surfaces

| Layer | Style |
|-------|-------|
| Page background | Gradient above, `background-attachment: fixed` |
| Cards / panels | `rgba(255,255,255,0.88–0.95)` + `border-radius: 16–20px` + subtle shadow |
| Glass panels (menus) | `rgba(255,255,255,0.82)` + `backdrop-filter: blur(28px)` |
| Input fields | `rgba(255,255,255,0.88)` + `border: 1px solid rgba(160,195,240,0.45)` |
| Headers | `rgba(255,255,255,0.85)` + `backdrop-filter: blur(20px)` |

---

## Colour Palette

| Token | Hex | Use |
|-------|-----|-----|
| `--de-heading` | `#0f2a5c` | Page titles, card headings |
| `--de-text` | `#1a3a6a` | Body copy |
| `--de-text-dim` | `rgba(60,100,160,0.55)` | Labels, secondary text |
| `--de-gold` | `#c8981a` | Gold accent, badges |
| `--de-gold-bright` | `#e8b830` | Highlights |
| `--de-accent` | `#2a8ab8` | Primary blue accent |
| `--de-border` | `rgba(160,195,240,0.45)` | Card borders |

---

## Typography

| Use | Font | Class / CSS |
|-----|------|-------------|
| App wordmark | Cormorant Garamond, italic | `.de-wordmark` |
| Body | Space Grotesk | `var(--font-space-grotesk)` |
| Code | JetBrains Mono | `.de-code` |

---

## The Gold Ball (Navigation Button)

The DREAMengin navigation button is a **3-D metallic gold sphere** fixed at the bottom-center of the screen.

```css
background: radial-gradient(
  circle at 36% 32%,
  #fffde0 0%,
  #f7e07a 12%,
  #d4a843 38%,
  #a16207 68%,
  #6b3c03 100%
);
box-shadow:
  inset 0 2px 4px rgba(255,255,220,0.85),
  inset -3px -3px 10px rgba(80,40,0,0.40),
  0 6px 24px rgba(100,58,4,0.55),
  0 2px 8px rgba(212,168,67,0.50),
  0 0 0 1.5px rgba(180,120,20,0.45);
```

Size: `64×64px`. Position: `bottom: 28px; left: 50%; transform: translateX(-50%)`.

- **Single tap** → Go Home
- **Double tap** → Open dual bottom menu (System + Daydreams)

---

## Dual Bottom Menu

When the gold ball is double-tapped, two frosted-glass panels slide up from the bottom:

- **Left panel**: System (Profiles, Settings, Marketplace, Feed Sources, Appearance, AI Triad)
- **Right panel**: Daydreams (Music/Release, Code/Preview, Create/Assets, Gaming Library, Lab/Test, Brand/Analytics)
- Animation: `de-dual-menu-up` (translateY from 48px → 0, 260ms spring)
- Background: `rgba(255,255,255,0.82)` + `backdrop-filter: blur(28px)`

---

## IDARi Chat Panel

IDARi's chat panel (`DrEamsPanel.tsx`) uses:
- Backdrop: `rgba(8,20,50,0.32)` + `backdrop-filter: blur(14px)`
- Panel: `rgba(255,255,255,0.94)` + matching border/shadow
- Slides up with `de-dual-menu-up` animation
- User bubbles: dark navy gradient `linear-gradient(135deg, #0f2a5c, #1a4a8a)`
- AI bubbles: `rgba(240,245,255,0.95)` with blue border
