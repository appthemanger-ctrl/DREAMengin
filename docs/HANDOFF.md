# DREAMengin Handoff

Last updated: 2026-03-08 (IDARi alignment pass 3)

---

## What changed in this alignment pass (pass 3)

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

### Files changed
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

### Tests
- All 291 unit tests pass. Zero new type errors introduced.

---

## Current repo reality (after pass 3)

- Canonical routes exist for `/homedream`, `/edit-profiledream`, and `/view-profile`.
- Legacy support routes still exist for `/home`, `/edit-profile`, `/profile`, and `/u/[handle]`.
- The public/shared profile destination in the current repo is `/profile/[handle]`.
- The Dreams layer already exists in `components/dreams/*` while legacy widget material still exists in `components/widgets/*` (file names), but all visible UI labels now use "Dream" naming.
- Privacy enforcement in `ProfileWidgetGrid` now correctly hides Dreams that aren't explicitly set to public. Full DB-backed visibility load on the public profile page is the next step.

## Next repo steps

1. Wire `/profile/[handle]` to load widget visibility from Supabase `widget_instances` table, so the public profile respects the owner's saved visibility settings from EditProfileDream.
2. Continue renaming `components/widgets/` file names (low risk but thorough).
3. Repurpose extra legacy routes (`/daydream/analytics`, `/daydream/media-vault`, `/daydream/play`) under spec-defined module names.
4. Tighten SuperDreamWidget composition rules for profile output.

## Tracking doc

Use `docs/alignment/DOCS_CHANGE_TRACKER.md` as the ledger for this pass.
