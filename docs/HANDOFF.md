# DREAMengin Handoff

Last updated: 2026-03-10 (IDARi alignment pass 4)

---

## What changed in this alignment pass (pass 4)

This pass focuses on the highest-priority open item from Pass 3: wiring the public profile (ViewProfile) to load Dream configuration — including visibility tiers — from Supabase, making privacy enforcement durable and server-side, not just client-side.

### Primary outcomes

#### 1. DB-backed Dream configuration for ViewProfile (Pass 4 core goal)

**Before:** EditProfileDream saved widget order and visibility to `localStorage` only. The public profile (`/profile/[handle]`) received no `initialWidgets`, so `ProfileWidgetGrid` used `DEFAULT_WIDGETS` with `visibilityTier: undefined` (defaulting to `'hidden'`). Every visitor saw the locked empty state regardless of what the owner configured.

**After:** End-to-end DB wiring is complete:

- **New SQL migration** (`supabase/migrations/20260310000001_profiles_dream_config.sql`):
  Adds `profile_dreams JSONB NOT NULL DEFAULT '[]'` column to the `profiles` table.
  Stores `Widget[]` JSON exactly matching `ProfileWidgetGrid`'s `Widget` type (id, type, size, config, visibilityTier, instanceId). Default is empty array — nothing public by default (LAW.md §2 / AXIOM 5).

- **`/api/profile` PUT** now accepts a `dreams` field (array of Widget JSON).
  If `Array.isArray(body.dreams)`, saves it as `profile_dreams` on the profiles row.

- **`EditProfileDream` `handleSave`** now includes `dreams: widgets` in the API PUT body.
  localStorage is retained as a fast-load cache but the DB is the source of truth.

- **`/profile/[handle]/page.tsx`** now reads `profile.profile_dreams` from the Supabase query result.
  If present and non-empty, passes it as `initialWidgets` to `ProfileWidgetGrid`.
  `ProfileWidgetGrid` then filters in-component to only render Dreams with `visibilityTier === 'everyone'` for the public view. Privacy guarantee is now end-to-end server-backed.

#### 2. Legacy daydream route Engin naming fixed

- `/daydream/media-vault/page.tsx`: `enginName` corrected from `"MediaEngin"` → `"ContentEngin"` (canonical spec name). "MediaEngin" is not in the product spec; ContentEngin is the Create Daydream pair.

### Files changed
- `supabase/migrations/20260310000001_profiles_dream_config.sql` *(new)*
- `app/api/profile/route.ts`
- `app/edit-profiledream/page.tsx`
- `app/profile/[handle]/page.tsx`
- `app/daydream/media-vault/page.tsx`
- `docs/FEATURE_STATUS.md`
- `docs/HANDOFF.md`

### Tests
- All 291 unit tests pass. Zero new type errors introduced.

---

## What changed in pass 3

This handoff reflects the IDARi-run daily improvement cycle focused on making spec names real in the UI and enforcing privacy boundaries in code.

### Primary outcomes

#### 1. ViewProfile spec name now appears in the actual UI
- `/profile/[handle]` page now shows "ViewProfile" as the heading for the owner (not "My Profile")
- Subtitle added: "Public output — built in Edit ProfileDream"
- Edit button now links to `/edit-profiledream` (canonical) and says "Edit ProfileDream" (not just a pencil icon)

#### 2. EditProfileDream privacy boundary is now explicit
- Header subtitle updated: "Private builder — set visibility per Dream before saving to ViewProfile"
- View Profile preview button fixed from `/u/[handle]` (legacy URL) to `/profile/[handle]` (canonical destination)

#### 3. "Nothing public by default" enforced in code
- `ProfileWidgetGrid` now filters Dreams by `visibilityTier` when `isEditing=false`
- Public ViewProfile only renders Dreams explicitly set to `'everyone'`
- When no Dreams are public, shows locked empty state: "Nothing is public yet. Open Edit ProfileDream to choose what's visible."
- This makes LAW.md §2 / AXIOM 5 enforceable at the component level

#### 4. DreamAds naming and separation cleaned up
- `/ads/page.tsx` header renamed from "Ads Marketplace" → "DreamAds"
- "My DreamAds Slots" section now tagged: "User-owned — you control placement & pricing"
- Buyer section renamed: "Buy Ad Space — Slots published by other creators — not platform ads"
- Create page updated: button and header say "DreamAds Slot"; info copy explains user ownership

#### 5. DreamMenu naming now spec-first
- `SystemRadialMenu`: panel title "System" → "DreamMenu"; "Account" → "Edit ProfileDream"; "Go Home" → "HomeDream"
- `DualBottomMenu`: right panel "Menu" → "DreamMenu"; "Profiles" → "ViewProfile"; "Marketplace" → "DreamMarketplace"

#### 6. Legacy widget naming → Dreams naming in UI labels
- `AddDreamCTA`: "+ Add Widget" → "+ Add Dream"; description uses "Dream" not "widget"
- `ConnectWidgetPrompt`: "Add {Service} as a widget?" → "Add {Service} as a Dream?"
- `ConnectorWidgetPicker`: "Tap to add as a widget" → "Tap to add as a Dream"
- `ProfileWidgetGrid`: aria-labels, profile strength bar, edit-mode controls all use "Dream"

#### 7. AI assistant responses use spec names
- All Dr. Eams responses updated: "Edit Profile" → "Edit ProfileDream"
- All Dr. Eams responses updated: "Ad Marketplace" → "DreamAds"; adds clarification that DreamAds are user-owned, not platform ads
- Affects: `AIAssistant.tsx`, `AIAssistantEnhanced.tsx`, `AIAssistant-voice-enhanced.tsx`, `DrEamsVoiceAssistant.tsx`

#### 8. Onboarding + settings use spec names
- `/onboarding/page.tsx`: "widgets" → "Dreams"; "Home Dream" → "HomeDream"; Golden Button description matches spec §4.2; ViewProfile step updated
- `/settings/account/page.tsx`: "Edit Profile" button → "Edit ProfileDream"
- `HomeRadialNav.tsx`: AI nav copy uses HomeDream, DreamShop, DreamDM spec names

#### 9. CoreDream ProfileFace gets spec-first quick-links
- Added "Edit ProfileDream" and "ViewProfile" shortcut buttons in the profile flip face inside HomeDream

### Files changed (pass 3)
- `app/ads/create/page.tsx`
- `app/ads/page.tsx`
- `app/edit-profiledream/page.tsx`
- `app/onboarding/page.tsx`
- `app/profile/[handle]/page.tsx`
- `app/settings/account/page.tsx`
- `components/AIAssistant-voice-enhanced.tsx`
- `components/AIAssistant.tsx`
- `components/AIAssistantEnhanced.tsx`
- `components/DrEamsVoiceAssistant.tsx`
- `components/HomeRadialNav.tsx`
- `components/connectors/ConnectWidgetPrompt.tsx`
- `components/connectors/ConnectorWidgetPicker.tsx`
- `components/core/CoreDream.tsx`
- `components/menus/DualBottomMenu.tsx`
- `components/menus/SystemRadialMenu.tsx`
- `components/profile/ProfileWidgetGrid.tsx`
- `components/widgets/AddDreamCTA.tsx`

### Tests (pass 3)
- All 291 unit tests pass. Zero new type errors introduced.

---

## Current repo reality (after pass 4)

- Canonical routes exist for `/homedream`, `/edit-profiledream`, and `/view-profile`.
- Legacy support routes still exist for `/home`, `/edit-profile`, `/profile`, and `/u/[handle]`.
- The public/shared profile destination is `/profile/[handle]`.
- **Privacy is now end-to-end DB-backed**: EditProfileDream saves Dream config (including visibility tiers) to `profiles.profile_dreams`. The public profile page loads this from Supabase and passes it to `ProfileWidgetGrid`, which renders only `visibilityTier === 'everyone'` Dreams.
- The Dreams layer exists in `components/dreams/*`; legacy widget material still exists in `components/widgets/*` (file names), but all visible UI labels use "Dream" naming.
- All 6 canonical Daydream/Engin pairs exist. Legacy routes (`analytics`, `media-vault`, `play`) now use correct canonical Engin names.

## Next repo steps

1. Build depth in each Daydream mini-app — routes exist but functionality depth varies.
2. Continue renaming `components/widgets/` file names into Dreams namespace.
3. Wire real feed content from real connectors (Instagram, Spotify, YouTube, etc.).
4. Tighten SuperDreamWidget composition rules for profile output.
5. Build end-to-end TheBoogieMan policy enforcement with audit logs.

## Tracking doc

Use `docs/alignment/DOCS_CHANGE_TRACKER.md` as the ledger for this pass.
