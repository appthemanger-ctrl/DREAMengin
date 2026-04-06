# DREAMengin — Pull Request

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-06


> **For AI-generated PRs:** Every section below is mandatory. Do not delete or skip headings. Replace every placeholder with a real answer. One-liners are acceptable only where genuinely nothing more applies — do not pad, do not summarise.

---

## 1. My Interpretation of the Request

_What did I understand the user's request to mean? Quote the original instruction if available, then state your interpretation in your own words. If the instruction was ambiguous, state which reading you chose and why._

> **Original instruction / issue:**
> <!-- paste the original request here -->

> **How I read it:**
> <!-- your interpretation -->

> **Any scope I excluded on purpose:**
> <!-- things you could have done but chose not to, and why -->

---

## 2. Before vs. After

_Describe the concrete state change introduced by this PR. Use two-column phrasing so a reviewer can quickly verify the delta._

| Aspect | Before this PR | After this PR |
|--------|---------------|--------------|
| **Behaviour** | <!-- what happened --> | <!-- what happens now --> |
| **UI / surface** | <!-- what the user saw --> | <!-- what the user sees now --> |
| **Data / state** | <!-- what was stored/returned --> | <!-- what is stored/returned now --> |
| **Navigation / routing** | <!-- unchanged / describe --> | <!-- unchanged / describe --> |

---

## 3. Architecture, Navigation & Identity Preserved

_DREAMengin has locked architecture and identity layers. Explicitly confirm that each item below is untouched, or explain any intentional deviation._

- [ ] **Golden Button** — the only travel system; no new routing mechanism introduced
- [ ] **DreamState / StructureLedger** — no new nodes, transitions, or state shapes added without a spec update
- [ ] **HomeDream / EditProfileDream / ViewProfile** — source/output separation maintained
- [ ] **Daydream ↔ Engin pairing** — existing pairs unchanged; new pairs follow the spec naming in `lib/identity/canonical-names.ts`
- [ ] **Privacy defaults** — everything created is private by default; no implicit sharing introduced
- [ ] **Action honesty** — no fake-wired or ghost actions introduced or left unwired
- [ ] **AI agent names** — Dr. Eams, IDARi, TheBoogieMan.Ai — only correct canonical names used
- [ ] **RLS / Supabase** — no Row Level Security bypasses or new unauthenticated data paths

_If any box is unchecked, explain why the deviation is intentional and constitutionally compliant:_
<!-- explanation -->

---

## 4. Files & Systems Touched

_List every file changed and the system it belongs to. Delete-only files count._

| File | System / Layer | Change type |
|------|---------------|-------------|
| <!-- path --> | <!-- e.g. Dreams, Navigation, Auth, UI, API, Tests, Docs --> | <!-- Add / Modify / Delete / Rename --> |

**External systems affected** (Supabase tables, env vars, third-party APIs, GitHub Actions):
<!-- list or "none" -->

---

## 5. Assumptions & Biggest Risk of Misunderstanding

_State every assumption you made while building this. Then call out the single highest-risk place where your interpretation of the request could be wrong._

**Assumptions:**
1. <!-- assumption -->

**Biggest risk:**
> <!-- In one or two sentences: what is the most likely way a human reviewer will read the original request differently than I did, and what would they find wrong as a result? -->

---

## 6. Verification

_Describe exactly how to verify this PR is correct. Then paste evidence._

**Steps to verify manually:**
1. <!-- step -->

**Automated checks passing:**
- [ ] `pnpm run build` exits 0
- [ ] `pnpm exec vitest run` — all tests pass (state count: ___ passing, ___ failing)
- [ ] Build memory drift: `pnpm build-memory:check` exits 0 (or explain why skip)
- [ ] No new TypeScript errors introduced in changed files

**Screenshots / recordings / artifacts:**
<!-- Drag and drop screenshots here. For PRs that change visible UI, at least one before and one after screenshot is required. For PRs with no UI change, write "no UI change" and explain. -->

---

## 7. Checklist

- [ ] I have read `docs/AGENT_PLAYBOOK.md` this session
- [ ] I have read `docs/CONSTITUTION.md` and this PR complies with every article
- [ ] I have read `docs/GENERATION_LAW.md` and selected a generation mode (χ = confidence score computed per the law; determines which generation pass to run)
- [ ] Changed files follow naming conventions in `lib/identity/canonical-names.ts`
- [ ] No secrets, tokens, or private keys are committed
- [ ] All new Dream / Engin / route names are consistent with `docs/NAMING_AUTHORITY.md`
- [ ] `.github/agents/` directory was not read or modified (protected agent configuration — off-limits to all PRs)
