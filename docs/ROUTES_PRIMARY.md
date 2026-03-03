# Routes — Primary, Lab, Admin

> **Single Source of Truth** — lists every route by category and defines linking rules.

---

## 1. Primary Routes (user-facing, always linked)

These routes are part of the public product. They are reachable from Home and/or the menu.

| Route | Description |
|---|---|
| `/` | Landing — `LandingHero` (unauthenticated) |
| `/login` | Sign-in page |
| `/join` | Sign-up / onboarding entry |
| `/onboarding` | New-user onboarding flow |
| `/home` | **Canonical Home** — TV feed experience (`HomeSystem`) |
| `/profile` | Authenticated user profile |
| `/profile/[handle]` | Public profile page |
| `/settings` | User settings |
| `/discover` | Discover / explore |
| `/messages` | Messages |
| `/connectors` | Connectors management |
| `/feed-settings` | Feed preference settings |
| `/about` | About page (`AboutHero`) |
| `/policy` | Privacy / terms policy (always accessible, no login required) |

## 2. Lab Routes (WIP, NOT linked from Home or menu)

Lab routes remain in the codebase for development but must not be linked from Home or the menu. They must display a **Lab/WIP banner**.

| Route | Description |
|---|---|
| `/lab` | Lab landing |
| `/physics-lab` | Physics experiments |
| `/codespace` | Code sandbox |
| `/anchor-demo` | Anchor widget demo |
| `/dreamengin` | DREAMengin engine lab |
| `/daydream` | Daydream experiments |
| `/analytics` | Internal analytics |
| `/ads` | Advertising lab |

## 3. Admin Routes (protected, never public)

| Route | Description |
|---|---|
| `/admin` | Admin dashboard |

## 4. Linking Rules

- The **menu** (radial / system) must only link to **Primary routes**.
- The **Home feed** must not contain links to Lab routes.
- Lab routes must show a `Lab/WIP` banner component.
- The **policy page** must always be reachable (linked from global footer — see `app/layout.tsx`).

## 5. "DO NOT" Rules

- ❌ Do NOT add Lab routes to the radial/system menu.
- ❌ Do NOT link Lab routes from Home.
- ❌ Do NOT remove the persistent `/policy` footer link from `app/layout.tsx`.

## 6. Acceptance Criteria

- [ ] All primary routes are reachable from Home or menu.
- [ ] No lab route is linked from Home or the radial/system menu.
- [ ] `/policy` is always reachable without login.
- [ ] `/about` exists and uses `AboutHero`.
- [ ] Every lab route shows a Lab/WIP banner.
- [ ] Admin routes require authentication.
