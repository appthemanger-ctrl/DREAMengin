# DREAM ENGINE SECURITY & PRIVACY
Version: 1.0.0  
Status: Enforced Spec  
Scope: Supabase RLS + Auth boundaries + Server routes + Storage + API safety + Privacy defaults

This document operationalizes:
- AXIOM 4 — Security by Default
- AXIOM 5 — Privacy by Design

If implementation conflicts with this document, implementation must change.

---

## 1) Core Security Principles

1) Never trust the client.
- Client state is untrusted.
- Client inputs are hostile by default.
- All writes must be authenticated and authorized server-side or via RLS.

2) RLS is the enforcement layer.
- UI checks are not security.
- Queries must be safe even if called directly.

3) Least privilege.
- Only fetch what you need.
- Never ship secrets to the browser.

4) Privacy is default.
- Public data is explicitly public.
- Everything else is private unless the user opts in.

---

## 2) Required Supabase Setup

### 2.1 Enable RLS on all user-owned tables
RLS must be enabled on:
- profiles
- app_posts
- content / albums / album_content (if used)
- nav_logs (if used)
- any user-created data table

### 2.2 Ownership fields
All user-owned rows MUST have:
- `user_id uuid not null` referencing `auth.users(id)` (or be the row PK when appropriate)

Recommended convention:
- `profiles.id = auth.users.id` (id is the user id)
- all other tables: `user_id` column

---

## 3) Supabase RLS Policy Templates (Copy/Paste Patterns)

IMPORTANT: These are templates. Adjust table/column names to match your schema.

### 3.1 PROFILES
Assumptions:
- table: `public.profiles`
- pk: `id` (uuid) == auth user id
- fields: handle, display_name, avatar_url, etc.

Enable RLS:
- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

Policies:

1) Read public profiles
- Allow anyone (including anon) to read basic public profile fields.

Recommended: create a view for public profile fields (best), OR restrict columns at query layer.
At minimum, allow select:

- CREATE POLICY "profiles_select_public"
  ON public.profiles
  FOR SELECT
  USING (true);

2) Update own profile only
- CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

3) Insert own profile row only (if you allow inserts)
- CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

Notes:
- If you auto-create profiles via trigger, you may not need INSERT policy.

---

### 3.2 POSTS (Feed)
Assumptions:
- table: `public.app_posts`
- columns: id, user_id, visibility ('public'|'private'|'followers'), created_at, etc.

Enable RLS:
- ALTER TABLE public.app_posts ENABLE ROW LEVEL SECURITY;

Policies:

1) Read public posts
- CREATE POLICY "posts_select_public"
  ON public.app_posts
  FOR SELECT
  USING (visibility = 'public');

2) Read own posts (private included)
- CREATE POLICY "posts_select_own"
  ON public.app_posts
  FOR SELECT
  USING (auth.uid() = user_id);

3) Insert only as self
- CREATE POLICY "posts_insert_own"
  ON public.app_posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

4) Update only own posts
- CREATE POLICY "posts_update_own"
  ON public.app_posts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

5) Delete only own posts
- CREATE POLICY "posts_delete_own"
  ON public.app_posts
  FOR DELETE
  USING (auth.uid() = user_id);

Notes:
- Followers visibility requires a follower graph table + additional policy logic.
- Until that exists, do not ship "followers" visibility.

---

### 3.3 CONTENT / ALBUMS (Private library)
Assumptions:
- table: `public.content`
- table: `public.albums`
- join: `public.album_content` (album_id, content_id)
- content has `user_id`, `visibility` optional

Enable RLS on all three:
- ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
- ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
- ALTER TABLE public.album_content ENABLE ROW LEVEL SECURITY;

Policies:

CONTENT
1) Select own content
- CREATE POLICY "content_select_own"
  ON public.content
  FOR SELECT
  USING (auth.uid() = user_id);

2) Insert own
- CREATE POLICY "content_insert_own"
  ON public.content
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

3) Update own
- CREATE POLICY "content_update_own"
  ON public.content
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

4) Delete own
- CREATE POLICY "content_delete_own"
  ON public.content
  FOR DELETE
  USING (auth.uid() = user_id);

ALBUMS
Same 4 policies: select/insert/update/delete by `user_id`.

ALBUM_CONTENT (join table)
1) Select join rows only if both linked items belong to user
- CREATE POLICY "album_content_select_own"
  ON public.album_content
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.albums a WHERE a.id = album_id AND a.user_id = auth.uid())
    AND
    EXISTS (SELECT 1 FROM public.content c WHERE c.id = content_id AND c.user_id = auth.uid())
  );

2) Insert join rows only if user owns both
- CREATE POLICY "album_content_insert_own"
  ON public.album_content
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.albums a WHERE a.id = album_id AND a.user_id = auth.uid())
    AND
    EXISTS (SELECT 1 FROM public.content c WHERE c.id = content_id AND c.user_id = auth.uid())
  );

3) Delete join rows only if user owns album
- CREATE POLICY "album_content_delete_own"
  ON public.album_content
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.albums a WHERE a.id = album_id AND a.user_id = auth.uid())
  );

---

### 3.4 NAV LOGS (Optional, privacy sensitive)
If you store navigation logs, store minimal info. Prefer:
- depth, node, timestamp
Avoid raw text, raw prompts, or sensitive content.

Assumptions:
- table: `public.nav_logs`
- columns: id, user_id, node, depth, timestamp, maybe position/orientation vectors

Enable RLS and restrict:
- only select/insert/delete own.

---

## 4) Supabase Storage Policies (Uploads)

Rule:
Uploads are private by default. Public sharing is explicit and opt-in.

Suggested buckets:
- `avatars` (public read okay if user sets it, but writes restricted)
- `user_uploads` (private by default)
- `public_media` (explicitly published media only)

Storage policy pattern:
- Allow upload only to a user’s folder path: `${auth.uid()}/...`
- Allow read only for owner unless the object is in an explicitly public bucket

Minimum:
- INSERT/UPDATE/DELETE: require auth + path starts with auth.uid()
- SELECT: allow only owner for private buckets

Avoid:
- broad public read on any bucket that contains private content
- putting sensitive uploads in “public” buckets

---

## 5) Next.js Auth Boundaries (Must-Have)

Goal:
After sign-in, SSR pages must see the session immediately.
This requires setting cookies via server-side code.

### 5.1 Required server routes
Create:
- `app/auth/login/route.ts`  (POST)
- `app/auth/logout/route.ts` (POST)

Rules:
- Login route exchanges credentials and sets session cookies server-side.
- Logout route clears session cookies server-side.

Client UI should never handle session cookies manually.

### 5.2 Never expose service role keys
- Service role key must only exist server-side (env var).
- Never import admin clients into client components.

---

## 6) API Safety Rules

### 6.1 Validate all inputs server-side
Use schema validation for any server route:
- zod or equivalent
- reject unknown fields
- enforce size limits (strings, arrays)

### 6.2 Rate limit sensitive endpoints
At minimum rate-limit:
- auth endpoints
- AI endpoints
- upload endpoints

### 6.3 Return minimal data
Never return:
- full profile objects if not required
- private metadata
- internal ids if not needed

---

## 7) Client Safety Rules

1) Treat all client UI as “untrusted display layer”
- UI may hide features but does not enforce security.

2) No private secrets in client bundles
- no keys
- no server-only env vars

3) Don’t cache private data in localStorage by default
- prefer in-memory state
- if persisted, encrypt or store minimal identifiers

---

## 8) Privacy Defaults (Axiom 5)

### 8.1 Data minimization
Only collect:
- what the feature requires
Avoid:
- unnecessary logging
- hidden analytics
- tracking without explicit consent

### 8.2 Clear visibility controls
For user content:
- default: private
- user must opt-in to public visibility

### 8.3 Deletion
Users must be able to:
- delete posts
- delete uploads
- delete account data (eventually)

Minimum requirement:
All tables must support delete policies for the owner.

---

## 9) AI (Dr. Eams) Privacy & Security Rules

1) AI is optional; never blocks core UX.
2) AI prompts are private by default.
3) Do not train on user content without explicit opt-in.
4) If you do “memory”, require explicit toggle and clear UI.
5) Do not send private data to AI unless user is in that context and asked for it.

For retrieval:
- Only index user-provided docs
- Only retrieve within user scope
- Never cross-user retrieval

---

## 10) Deployment Checklist (Non-Negotiable)

Before shipping any environment:

- RLS enabled on all tables with user data
- Policies tested with:
  - anon user
  - logged-in user A
  - logged-in user B
- Storage buckets validated for:
  - upload restrictions
  - private read protections
- Login/logout server routes set cookies correctly
- No service role key in client bundles
- No endpoints accept unvalidated JSON payloads

---

## 11) “Fail Closed” Rule

If security policy is uncertain:
- default to deny
- ship later
- do not ship “temporary” insecure access

Security must fail closed, not open.

---
