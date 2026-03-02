# AI Triad — Public Overview

**Version:** TRIAD_V1  
**Route:** `/policy/ai`  
**Full spec:** `docs/AI_TRIAD_PROTOCOL.md`

DREAMengin uses three specialized AI agents that work together as one coherent system.

---

## The Three Agents

### Dr. Eams — Your assistant
- Helps you navigate and use DREAMengin.
- Explains what happened when something changes on your account.
- Opens from the System menu (tap the Gold button → Dr. Eams).
- Only Dr. Eams speaks to you directly in natural language.

### IDARi — System optimizer
- Keeps the platform fast and reliable.
- Handles performance tuning, error detection, and system health.
- Admin-facing only; IDARi never directly messages users.
- Reports system slow modes to Dr. Eams, who explains them to you.

### Boogie (TheBoogieMan.AI) — Safety overwatch
- Enforces community and safety rules.
- Every action references a specific rule code from the [public policy page](/policy).
- Never bans permanently without human review.
- Boogie output is always structured data — Dr. Eams translates it for you.

---

## What each agent can and cannot do

| Capability | Dr. Eams | IDARi | Boogie |
|---|---|---|---|
| Talk to users | ✅ | ❌ | ❌ |
| Enforce / ban | ❌ | ❌ | ✅ |
| Throttle system performance | ❌ | ✅ | ❌ |
| Change policy thresholds | ❌ | ❌ | ✅ (approval required) |
| Issue permanent bans | ❌ | ❌ | ❌ (human only) |
| Deploy code | ❌ | ❌ | ❌ (human only) |

---

## How they communicate

All three agents communicate via typed events — not freeform chat.  
Events are logged in an audit trail for transparency.

**Boogie → Dr. Eams:** restriction reason, duration, appeal link  
**IDARi → Dr. Eams:** system status (slow mode, outage)  
**Dr. Eams → Boogie:** appeal requests from users

You only ever see Dr. Eams. The other two operate behind the scenes.

---

## Separation of concerns

- **"System slow"** (IDARi) = platform is under load. Not a punishment.
- **"Account restricted"** (Boogie) = a policy rule was triggered. Traceable to a rule code.
- These are never mixed up in messages — Dr. Eams always explains which is which.

---

## Platform limits

These apply to all users and are enforced consistently:

| Limit | Value |
|---|---|
| Max dreams/widgets | 48 |
| Max posts per hour | 30 |
| Max messages per minute | 10 |
| Max share codes per day | 20 |

---

## Appeals

If you believe a Boogie action was made in error, you can always [submit an appeal](/settings/safety).  
Appeals create a triad event and pause escalation.

---

## Transparency

- Raw triad logs are never publicly exposed.
- This page describes behavior, not internal telemetry.
- Internal detection methods are never revealed to users.
- Dr. Eams cites event summaries when explaining; it never invents explanations.

---

## See also

- [Community + Safety Policy](/policy) — full rule set, versioned
- [Terms Glossary](/policy/ai#glossary) — what "Dream", "Daydream", and other terms mean
- [Submit an Appeal](/settings/safety)

---

## Glossary {#glossary}

| Term | Definition |
|---|---|
| **Dream** | A user-installed widget/app container on your profile |
| **Daydream** | One of 6 specialized first-party experiences (heavier, full-powered) |
| **Home** | Your main Dream layout — always node 0 |
| **Profile** | Your public view — includes your Home Dreams |
| **Share Code** | A config-only blueprint for sharing a Dream layout (no personal data) |
| **Dr. Eams** | The user-facing AI assistant |
| **IDARi** | The admin-facing system optimizer AI |
| **Boogie** | The policy enforcement AI (TheBoogieMan.AI) |
| **Strike** | A counted policy violation event with an expiry window |
| **Appeal** | A user request to review a Boogie enforcement action |
