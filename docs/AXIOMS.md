# DREAM ENGINE AXIOMS
Version: 1.0.0
Status: LOCKED

These axioms define the non-negotiable rules of Dream Engine.
All features, UI, navigation, and systems must satisfy ALL axioms.

If a feature violates an axiom, it must be redesigned or removed.

---

## AXIOM 1 — INSTANT UNDERSTANDING

The system must be usable immediately without instruction.

- No tutorials required
- No hidden interactions
- No learning phase

All actions must be discoverable through touch and feedback.

If a user hesitates, the system has failed.

---

## AXIOM 2 — USER-SHAPED SPACE

Users control position through direct manipulation.

- Drag to move
- Place to organize
- No configuration panels

Control must exist through movement, not settings.

If control requires a menu, it violates this axiom.

---

## AXIOM 3 — REAL CAPABILITY

Every interactive element must allow meaningful action.

Not just:
- viewing
- scrolling

But:
- creating
- editing
- producing

If an element does not enable action, it should not exist.

---

## AXIOM 4 — SECURITY BY DEFAULT

User data must be protected at all times.

- Never expose sensitive data to the client unnecessarily
- All writes must be authenticated
- Use Row Level Security (RLS) in Supabase
- Validate all inputs server-side
- Never trust client state

Principle:
The system must assume hostile input and protect against it.

---

## AXIOM 5 — PRIVACY BY DESIGN

Users own their data.

- Collect only what is necessary
- No hidden tracking
- No selling user data
- Clear boundaries between public and private content
- User can delete their data

Principle:
Privacy is not a feature. It is the default.

---

## ENFORCEMENT RULE

All features must satisfy ALL FIVE axioms.

If a feature fails ANY axiom:

→ Redesign it
→ Or remove it

No exceptions.

---

## DESIGN FILTER

Before adding anything, ask:

1. Is it instantly understandable?
2. Is it controlled by movement, not settings?
3. Does it enable real action?
4. Is it secure by default?
5. Does it respect user privacy?

If the answer is not YES to all five:

→ Do not add it

---

## FINAL NOTE

Dream Engine is not a collection of features.

It is a system governed by constraints.

These axioms exist to prevent complexity, inconsistency, and loss of control.

They must not be expanded or weakened.
