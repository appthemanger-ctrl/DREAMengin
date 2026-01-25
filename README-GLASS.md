# Glass Look Pack (DREAMengin)

This pack adds **glassmorphism** and a **slow, calm "charging" gradient** you can reuse anywhere.
Works with Tailwind + Next 16.x. No JS required.

## Install (one-liner)
Add this line next to your existing globals import:
```ts
// app/layout.tsx
import "@/styles/glass.css";
```

Or import inside your main CSS:
```css
/* styles/globals.css */
@import "./glass.css";
```

## Classes
- `glass` — frosted, semi-transparent panel (uses backdrop blur).
- `glass-header` — subtle translucent header background.
- `charge-bg` — animated gradient background (slowly shifts colors).
- `charge-border` — animated gradient border/glow wrapper.
- `btn-glass` — glassy button with animated overlay.
- `soft-glow` — soft text glow helper.

## Examples

**Header**
```tsx
<header className="sticky top-0 z-50 glass-header">
  ...
</header>
```

**Login Card**
```tsx
<div className="glass charge-border rounded-2xl p-6">
  // form fields
  <button className="btn-glass w-full">Login</button>
</div>
```

**Hero Section**
```tsx
<section className="charge-bg text-white">
  <div className="glass rounded-3xl p-10 max-w-xl mx-auto">
    <h1 className="text-4xl font-bold soft-glow">Welcome</h1>
    <p className="opacity-90">Private-by-default. Calm. Composable.</p>
  </div>
</section>
```

Tip: tweak colors globally by setting CSS variables on `:root`:
```css
:root {
  --brand-1: #ef4444; /* red-500 */
  --brand-2: #f97316; /* orange-500 */
}
```
