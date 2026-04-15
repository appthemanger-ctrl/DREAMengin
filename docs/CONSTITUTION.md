CONSTITUTION markdown
# DREAMengin — Product Constitution

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-14 (Updated)

**Status: LOCKED — Phase 10 Final Authority + OS-Layer Naming Model**
Last updated: 2026-04-14

This document is the binding product constitution for DREAMengin.

These are **rules**, not suggestions. Every surface, module, system, and AI agent operating inside DREAMengin must comply with every rule in this document. There are no exceptions, no waivers, and no exemptions for convenience, commerce, AI features, or future systems.

Reviewers must use this document as an acceptance checklist against any new feature or implementation. If a proposed change violates one constitutional rule, the change must be rejected or revised until it conforms.

---

## Article I — Privacy and Visibility

### Rule 1: Nothing is public by default.

The default visibility state of every piece of content, every profile, every Dream Window, and every data object in DREAMengin is **private**. This default is enforced at the data layer, not just in the UI. A system that only shows private state visually while leaving data accessible is non-compliant.

### Rule 2: All creation starts private unless the user performs a real explicit public or shared action.

Creating a Dream Window, a post, a profile section, a project, or any other content object does not make that object visible to others. The system must not add the content to any public or shared visibility state until the user performs a real, explicit action that triggers a real state change.

"Implicit" sharing — caused by a default state, an automatic sync, a connected system assumption, or a convenience feature — is forbidden.

### Rule 3: Hidden posting, accidental sharing, and implied publication are forbidden.

No system component may post content, share data, or make anything visible to others without the user having explicitly initiated that specific action in the current session. Background posting, auto-publish, and implied-publish-on-save are constitutionally forbidden.

### Rule 4: No platform system may bypass privacy rules.

This rule applies without exception to:
- AI systems (Dr. Eams, IDARi, TheBoogieMan.Ai, or any future AI component)
- Commerce modules (DreamShop, DreamMarketplace)
- Messaging modules (DreamDM)
- Dream Window modules (Dream Windows)
- Advertising modules (DreamAds)
- Domain systems (all Daydream Surface / Engin runtime surfaces)
- Any future module, integration, or runtime extension

If a proposed feature requires bypassing privacy rules to function, that feature's design is non-compliant. The feature must be redesigned, not the privacy rules.

### Rule 5: Privacy-safe failure is better than silent exposure.

When the system is uncertain about a user's visibility intent — due to ambiguous state, incomplete data, or a system error — the system must default to showing nothing rather than showing potentially private content. Silent exposure is a system failure. Privacy-safe failure (showing nothing, returning an error, or requesting clarification) is the required default.

---

## Article II — Action Honesty

### Rule 6: Every visible action must do something real.

If a button, link, toggle, slider, or other interactive element is visible and enabled in the UI, it must trigger a real system action that produces a real, persisted outcome. There are no exceptions for polish, placeholder, or "coming soon" states.

### Rule 7: Fake buttons are forbidden.

A fake button is any interactive element that:
- Has an empty or stub handler
- Produces no real system outcome
- Changes visual state only (without persisting or routing)
- Routes to a placeholder or 404
- Is labeled as "coming soon" while remaining visually enabled and interactive

If a feature is not ready, the element must not be present as an active interactive element. It may be absent, visually disabled with a clear reason, or replaced by a real partial capability.

### Rule 8: Interface honesty is mandatory. Unsupported interactions must not be visually implied.

If the system cannot currently perform an action, the UI must not imply that it can. Showing a button for a capability that does not exist, showing a connected state for a system that is not connected, or showing a progress indicator for a process that is not running — all of these violate interface honesty.

The UI must represent real system state, not aspirational system state.

---

## Article III — User Intent and Ownership

### Rule 9: User intent is required for any action that changes visibility, projection, sharing, or publication.

An action that would change who can see a piece of content, move content from private to shared, publish content to external surfaces, or alter the user's projected public presentation must require an explicit, user-initiated, confirmed action in the current session.

No system may perform these actions automatically, speculatively, or as a side effect of another operation.

### Rule 10: Profile projection must require explicit user confirmation, not auto-sync from builder state.

Changes made in Edit ProfileDream do not automatically appear in View Profile. The user must explicitly confirm a save or publish action that produces an updated projection. Auto-sync — where saving in the builder automatically updates the public view — is forbidden.

The builder state and the projection state are separate. The projection state updates only when the user explicitly chooses to update it.

### Rule 11: Product convenience may not override ownership, visibility, or explicit user control.

No platform feature, module, or system may use user data, user content, or user visibility state in a way that circumvents explicit user control — even if the circumvention would be convenient, seamless, or beneficial to the user's experience as evaluated by the platform.

The platform does not decide for the user. The user decides.

---

## Article IV — Navigation and Context

### Rule 12: Navigation must preserve context rather than making the user feel like they left the product world.

When a user navigates between surfaces inside DREAMengin — from HomeDream Surface to a Daydream Surface, from a Daydream Surface to its Engin runtime, from any surface to Edit ProfileDream Surface — the experience must feel like movement within a single connected environment, not like leaving and returning to a separate product.

Navigation must not:
- Clear the user's active context without reason
- Return the user to a generic start state when traversing within the platform
- Break visual or state continuity in a way that suggests a full application restart

### Rule 13: Returning from a surface must restore valid prior state where technically feasible.

When a user returns from a surface they navigated away from (e.g., closing a Daydream Surface, returning from View Profile Surface to Edit ProfileDream Surface), the system must restore the prior surface to a valid, coherent state — not a blank or reset state — where the technical cost of doing so is reasonable.

This rule applies to Daydream navigation, profile builder navigation, and modal or overlay surfaces.

---

## Article V — Anti-Patterns

The following patterns are explicitly disallowed in DREAMengin. Any proposed feature, implementation, or code change that introduces one of these patterns must be rejected.

### AP-1: Fake UI Completion

Implementing UI that appears complete (all elements visible, all actions implied) when the underlying system does not support those actions. This includes screens built entirely of placeholder elements, non-functional buttons styled to match functional ones, and modal flows that accept user input but discard it.

### AP-2: Naming Drift

Using non-canonical names in any code, UI string, documentation, route file, or component name. This includes all rejected names listed in `docs/NAMING_AUTHORITY.md`, including OS-layer rejected terms (widget, page, dashboard, card, app, tab navigation). Naming drift is a residual class violation and must be corrected before the change is merged.

### AP-3: Public-by-Default Behavior

Designing any new content object, widget type, surface, or module with a default visibility state that is not private. Any system that requires an opt-out action from the user to stay private violates the constitution.

### AP-4: Detached Mini-App Behavior

Building a Daydream, module, or feature as an isolated product that does not share the platform's privacy rules, ownership model, naming conventions, or Dream system. A module that operates independently of the shared platform architecture is not a DREAMengin module.

### AP-5: Privacy-Bypassing Shortcuts

Implementing convenience paths, bulk actions, or automation features that skip the required user-intent confirmation for visibility or publication changes. This includes features like "publish all drafts," "auto-share on save," or "sync my builder to my profile" unless each such action is individually confirmed per item by the user.

---

## Article VI — Valid Proposals

### VI.1 Valid New Module Proposal

A proposed new platform module is valid if and only if:

1. **Naming fit:** The module can be named with canonical DREAMengin vocabulary. Its name follows the Dream-prefix convention for platform modules or can be clearly placed within the established naming system.
2. **Privacy fit:** The module can operate with private-by-default enforcement at the data layer without requiring a privacy bypass.
3. **Action honesty:** Every user-facing action in the module maps to a real system action with a real, persisted outcome.
4. **User-control compatibility:** The module does not require taking automated actions on the user's behalf for visibility, sharing, or publication without explicit confirmation.
5. **Constitutional compliance:** The module complies with every article of this constitution without requiring an exemption.

### VI.2 Valid New Surface Proposal

A proposed new surface is valid if and only if:

1. **Surface classification fit:** The surface clearly fits as one of:
   - A Core Surface (HomeDream Surface, Edit ProfileDream Surface, View Profile Surface type)
   - A Daydream Surface (user-facing lived creative space)
   - An Engin runtime (powered execution layer for a domain)
   - A platform module surface (accessible through DreamMenu or a module route)
2. **Not a detached runtime:** The surface shares platform privacy rules, uses canonical names, and connects to the platform's navigation model.
3. **Privacy fit:** The surface has a meaningful private-by-default context for user-generated content.
4. **Dream Window integration:** Content on the surface can be represented as Dream Windows (modular runtime containers) where structurally appropriate.
5. **Constitutional compliance:** The surface complies with every article of this constitution.

### VI.3 Valid New Dream Window Type Proposal

A proposed new Dream Window type is valid if and only if:

1. **Real data:** The Dream Window represents real data stored in the platform's data layer — not purely decorative or placeholder content.
2. **Real actions:** Any interactive element within the Dream Window triggers a real system action with a real, persisted outcome.
3. **Real visibility logic:** The Dream Window has a defined visibility state (private, shared, public) that is enforced at the data layer.
4. **Real ownership:** The Dream Window has a defined owner, and ownership determines what the owner can see and do that others cannot.
5. **Constitutional compliance:** The Dream Window type complies with every article of this constitution.

---

## Article VII — Review Paths

### VII.1 Rejecting Features That Use Correct Visual Style but Violate the Constitution

When a proposed feature or implementation uses the correct visual design language (correct colors, correct components, correct layout patterns) but violates one or more constitutional rules, the visual compliance does not excuse the constitutional violation.

**Review path:**
1. Identify the specific constitutional rule(s) violated.
2. Document the violation clearly — which rule, which behavior, which specific element or action.
3. Return the implementation for revision with explicit correction requirements.
4. Do not accept the implementation until the violation is resolved and revalidated.

Visual style conformance and constitutional conformance are separate requirements. Both are mandatory.

### VII.2 Rejecting Features That Use Correct Names but Violate Privacy, Publication, or Action-Honesty Rules

When a proposed feature or implementation uses canonical names (correct surface names, correct module names) but violates privacy rules, publication intent rules, or action-honesty rules, the naming compliance does not excuse the constitutional violation.

**Review path:**
1. Identify the specific constitutional rule(s) violated.
2. Document the violation clearly — which rule, which behavior, which specific action or state.
3. Return the implementation for revision with explicit correction requirements.
4. Do not accept the implementation until the violation is resolved and revalidated.

Naming conformance and constitutional conformance are separate requirements. Both are mandatory.

---

## Article VIII — AI Systems and the Constitution

All AI systems operating inside DREAMengin — including Dr. Eams, IDARi, TheBoogieMan.Ai, and any future AI component — are bound by this constitution in their behavior, output, and recommendations.

Specific constraints:
- No AI system may take an action that changes content visibility, publication state, or sharing state without explicit user confirmation.
- No AI recommendation may imply that a user should or can bypass privacy rules.
- No AI-generated UI element may violate action honesty rules (no fake buttons, no implied capabilities).
- No AI output may use non-canonical product names in user-facing text.
- AI systems that identify constitutional violations in generated code or proposed features must report them — not proceed with the non-compliant output.

---

## Acceptance Checklist

Use this checklist to evaluate any new feature, phase output, or implementation:

```
PRIVACY
[ ] Nothing new is public by default
[ ] All creation starts private
[ ] No hidden posting, accidental sharing, or implied publication
[ ] No privacy bypass in any module or AI system
[ ] Privacy-safe failure is the default when uncertain

ACTION HONESTY
[ ] Every visible action does something real
[ ] No fake buttons or stub handlers in enabled UI elements
[ ] No implied capabilities for unsupported interactions

USER INTENT AND OWNERSHIP
[ ] User intent is required for every visibility or publication change
[ ] Profile projection requires explicit confirmation, not auto-sync
[ ] Product convenience does not override user control

NAVIGATION
[ ] Navigation preserves context within the runtime
[ ] Returning from a surface restores valid prior state

ANTI-PATTERNS (none present)
[ ] No fake UI completion
[ ] No naming drift (including OS-layer rejected terms: widget, page, dashboard, card, app)
[ ] No public-by-default behavior
[ ] No detached mini-runtime behavior
[ ] No privacy-bypassing shortcuts

PROPOSAL VALIDITY (for new modules, surfaces, or Dream Windows)
[ ] Naming fit confirmed
[ ] Privacy fit confirmed
[ ] Action honesty confirmed
[ ] User-control compatibility confirmed
[ ] Constitutional compliance confirmed
```

If any item in this checklist fails, the feature or implementation is non-compliant. It must be revised before acceptance.

---

*This document is complete. Rules may not be weakened, waived, or made conditional. Additions to the constitution require Phase 10 authority review.*
```
