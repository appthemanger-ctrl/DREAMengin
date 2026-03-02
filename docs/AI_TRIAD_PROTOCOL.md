# AI Triad Protocol — Source of Truth

**Version:** TRIAD_V1  
**Status:** Active  
**Owner:** appthemanger-ctrl  
**Last updated:** 2026-03-02  
**Code:** `lib/ai/events.ts` · **Public overview:** `docs/POLICY_TRIAD_OVERVIEW.md` · **Route:** `/policy/ai`

> If code conflicts with this document, **code must change**.

---

## 1. Role Definitions

Three agents. Zero overlap ambiguity.

| Agent | Code role | Primary job |
|---|---|---|
| **Dr. Eams** | `dr_eams` | Conversation, guidance, UX explanations, user assistance |
| **IDARi** | `idari` | Bug fixing, performance optimization, compression, admin tooling |
| **Boogie** | `boogieman` | Policy enforcement, abuse detection, restriction/ban logic |

### Dr. Eams
- Speaks to users in natural language.
- Explains what happened (using event summaries from Boogie or IDARi).
- Never enforces, bans, or changes policy thresholds.
- Cannot issue restrictions or reverse Boogie decisions.
- Can adjust messaging tone but not the underlying action.
- Must mirror exact vocabulary from `docs/TERMS.md`.
- Must cite event summaries when explaining restrictions; never invent.

### IDARi
- Optimizes system performance, fixes bugs, compresses assets.
- Cannot ban users or override Boogie's enforcement decisions.
- Cannot change public policy text alone.
- If a proposed change affects policy surfaces → must send `REQUEST_REVIEW` to Boogie.
- Owns system health metrics (crash rate, p95 latency, memory, FPS).
- Reports system degradation to Dr. Eams via `STATUS_SNAPSHOT`.

### Boogie
- Enforces community and safety policy via the rule engine.
- Cannot optimize performance or make product UX decisions.
- Cannot deploy code changes alone.
- Must choose lesser restrictions when confidence is low; escalate to human.
- References rule codes from `docs/policy/theboogie.md`; public copy on `/policy`.
- User-facing output is short templates only (no freeform enforcement text).

---

## 2. Product + Operational Goals

| Goal | Description |
|---|---|
| **Product** | Premium, iOS-natural interface that remains safe and fast under growth |
| **Operational** | No silent failures; every issue results in a visible state + next step |
| **Trust** | Users can understand what happened without seeing sensitive detection details |
| **Engineering** | No spaghetti; changes must be typed, versioned, documented |

### Primary system goals by agent

- **Boogie** — Safety & compliance
- **IDARi** — Reliability & performance
- **Dr. Eams** — User clarity & productivity

---

## 3. Event Bus — Inter-Agent Communication

All inter-agent communication happens via **typed events only** (no direct chat text).

**Schema:** `lib/ai/events.ts` — `TriadEventSchema`

Every event MUST include:

| Field | Type | Required |
|---|---|---|
| `event_id` | UUID | ✅ |
| `correlation_id` | UUID | ✅ (links all events in one incident) |
| `timestamp` | ISO 8601 | ✅ |
| `actor` | `AgentSchema` | ✅ |
| `target` | `AgentSchema` | ✅ |
| `type` | `TriadEventType` | ✅ |
| `severity` | `EventSeverity` | ✅ |
| `context_refs` | `string[]` | ✅ (IDs/hashes only, never raw content) |
| `idempotency_key` | string | ✅ |
| `payload` | object | ✅ |
| `user_id` | UUID | optional |
| `dream_id` | UUID | optional |
| `policy_version` | string | required for enforcement events |
| `blast_radius` | `BlastRadius` | optional (LOCAL/USER/SYSTEM/GLOBAL) |

### Allowed event types

| Type | Direction | Description |
|---|---|---|
| `REQUEST_REVIEW` | Any → Boogie | Request policy review of a proposed change |
| `REQUEST_EXPLANATION` | IDARi/Boogie → Dr. Eams | Request user-facing message copy |
| `REQUEST_OPTIMIZATION` | Dr. Eams/Boogie → IDARi | Request performance work |
| `INCIDENT_DETECTED` | Boogie or IDARi | Something harmful was found |
| `ACTION_TAKEN` | Boogie | Enforcement action was applied |
| `SUGGESTION_PROPOSED` | Any | Governance proposal submitted |
| `SUGGESTION_APPROVED` | Triad | Unanimous approval recorded |
| `SUGGESTION_REJECTED` | Triad | Proposal rejected (reason required) |
| `STATUS_SNAPSHOT` | IDARi | System health summary for triad |
| `APPEAL_RECEIVED` | Dr. Eams → Boogie | User submitted an appeal |

### Idempotency + immutability

- Every event is idempotent: safe to reprocess without duplication.
- Every event is stored as an immutable record.
- Corrections create a new event referencing `prior_event_id`; no edits.

### Single ingestion point

Events are ingested server-side only. Clients cannot emit triad traffic directly.  
Ingestion endpoint: `POST /api/ai/triad/events` (admin-only, server-side validated).

---

## 4. Agent Restraints (Hard Rules)

Enforced in code via `checkAgentPermission()` in `lib/ai/events.ts`. Never trust client role flags.

| Restraint | Dr. Eams | IDARi | Boogie |
|---|---|---|---|
| Can ban/lock users | ❌ | ❌ | ✅ only |
| Can throttle system | ❌ | ✅ only | ❌ |
| Can send user messages | ✅ only | ❌ | ❌ |
| Can change policy thresholds | ❌ | ❌ | ✅ (with approval) |
| Can optimize performance | ❌ | ✅ only | ❌ |
| Can change public policy text | ❌ | ❌ | ✅ (with approval) |
| Can deploy code alone | ❌ | ❌ | ❌ |

### Exclusive action sets (defined in `lib/ai/events.ts`)

**Boogie exclusive:** `BAN_USER`, `LOCK_ACCOUNT`, `APPLY_ENFORCEMENT`, `ESCALATE_TO_HUMAN`  
**IDARi exclusive:** `THROTTLE_SYSTEM`, `SHED_LOAD`, `LOWER_REFRESH_RATE`, `TRIGGER_CACHE_FIRST`  
**Dr. Eams exclusive:** `SEND_USER_MESSAGE`, `UPDATE_MESSAGE_TEMPLATE`, `EXPLAIN_RESTRICTION`

### Requiring explicit admin authorization

The following actions always require explicit human confirmation, regardless of agent:

`PERMA_BAN`, `GLOBAL_SETTING_CHANGE`, `POLICY_TEXT_CHANGE`, `AUTH_FLOW_CHANGE`,  
`MONETIZATION_CHANGE`, `CONNECTOR_PERMISSION_CHANGE`, `PUBLIC_DATA_EXPOSURE_CHANGE`

---

## 5. Blast Radius Classification

Every action carries a blast radius classification:

| Level | Meaning |
|---|---|
| `LOCAL` | Affects only a single piece of content or session |
| `USER` | Affects a single user account |
| `SYSTEM` | Affects system performance/load broadly |
| `GLOBAL` | Affects all users, public data, or platform policy |

`GLOBAL` blast radius → requires unanimous triad approval + human confirmation.

---

## 6. Governance Handshake (Major Updates)

**Major update** = policy changes, auth flows, monetization, connector permissions, public data exposure.  
**Minor update** = UI polish, non-breaking perf improvements, bug fixes with tests.

### Major update flow

1. Proposal created by any agent (`SUGGESTION_PROPOSED` event)
2. All three agents respond (review window)
3. Unanimous approval required (`SUGGESTION_APPROVED` from all three)
4. Human/admin confirmation required for `GLOBAL` changes
5. Rollout uses feature flags for staged release
6. Rejected proposals record `reason` (prevents endless resubmission)

### Minor update flow

IDARi can proceed but MUST notify Boogie and Dr. Eams via `STATUS_SNAPSHOT`.

### Enforcement changes

Boogie leads. Must notify:
- Dr. Eams → for messaging copy (`REQUEST_EXPLANATION`)
- IDARi → for performance impact assessment

---

## 7. Incident Handling Flow ("immune response")

1. **Detect** — Boogie or IDARi detects incident → emits `INCIDENT_DETECTED`
2. **Contain** — Boogie applies enforcement actions OR IDARi throttles
3. **Explain** — Dr. Eams communicates to affected users
4. **Recover** — IDARi restores normal operation
5. **Learn** — Triad creates update proposal

**Authority during an incident:**
- Boogie is authoritative for safety actions.
- IDARi is authoritative for system throttling/perf degradation.
- Dr. Eams is authoritative for user communication.

**If a user asks "why am I restricted?":**  
Dr. Eams queries Boogie's event summary → relays in plain language. Never reveals detection methods.

---

## 8. Conflict Resolution

| Situation | Resolution |
|---|---|
| Boogie says "restrict" | Restriction happens |
| IDARi says "system is overloaded" | Throttling happens |
| Dr. Eams disagrees on messaging tone | Can adjust copy; cannot reverse the action |
| Boogie confidence is low | Choose lesser restriction + escalate |
| IDARi proposes change to policy surfaces | Must send `REQUEST_REVIEW` to Boogie |
| Dr. Eams proposes UX change affecting enforcement surfaces | Must send `REQUEST_REVIEW` to Boogie |
| Any agent detects false positive suspicion | Must send `REQUEST_REVIEW` to Boogie |

---

## 9. Agent-to-Agent Communication Matrix

| From | To | What |
|---|---|---|
| Boogie → Dr. Eams | `REQUEST_EXPLANATION` | Restriction state, reason codes, durations, appeal links |
| Boogie → IDARi | `STATUS_SNAPSHOT` | Abuse telemetry, spam patterns, suggested throttle knobs |
| IDARi → Boogie | `REQUEST_REVIEW` | System anomalies that look like abuse vs outages; false-positive suspicion |
| IDARi → Dr. Eams | `STATUS_SNAPSHOT` | System degradation state; recommended user guidance |
| Dr. Eams → Boogie | `APPEAL_RECEIVED` | User appeal requests, contextual clarifications |
| Dr. Eams → IDARi | `REQUEST_OPTIMIZATION` | User-reported bugs, UX friction clusters |

All messages are typed events — not freeform chat.

---

## 10. Platform Limits (shared across all agents)

Defined in `lib/ai/events.ts` as `PLATFORM_LIMITS`.

| Limit | Value |
|---|---|
| Max dreams/widgets per user | 48 |
| Max posts per hour | 30 |
| Max messages per minute | 10 |
| Max share codes per day | 20 |
| Max connector requests per minute | 30 |
| Data refresh budget | 60 seconds minimum interval |

**Ownership:**
- Boogie enforces **user behavior** rate limits (abuse prevention).
- IDARi enforces **system health** rate limits (load shedding). Independent of user punishment.
- Dr. Eams explains rate limits as **product constraints**, not punishments (unless Boogie flagged enforcement).

---

## 11. User Communication Constraints

- Only Dr. Eams speaks to users in natural language.
- Boogie and IDARi output **structured data** for UI and for Dr. Eams.
- Boogie's user-facing content = short templates only, not freeform text.
- IDARi's user-facing content = "system status" messages only, not blame.
- Dr. Eams must never claim the system did something it didn't do.
- Dr. Eams must never reveal private enforcement detection methods.
- "System throttling" (IDARi) and "policy punishment" (Boogie) must be clearly separated in UI.

---

## 12. Access Control

| Agent | Can read |
|---|---|
| Boogie | Policy tables, enforcement logs |
| IDARi | Performance logs, errors, build state |
| Dr. Eams | User-visible summaries, help content |

- Role gates are enforced server-side. Client role flags are never trusted.
- `ban/lock` endpoints → Boogie role only.
- `system throttling knobs` endpoints → IDARi role only.
- `user messaging templates` endpoints → Dr. Eams role only.

---

## 13. Observability

### Metrics by owner

| Agent | Owns |
|---|---|
| Boogie | Enforcement rate, appeal rate, reversal rate, time-to-resolution |
| IDARi | Crash rate, p95 latency, memory, render FPS |
| Dr. Eams | User comprehension metrics (appeals, confusion signals) |

### SLOs

- Menu open latency
- Home button responsiveness
- Enforcement message delivery time

### Dashboards + alerts

- Admin-only dashboards for triad health.
- Alerts for: spam wave, crash wave, false positive spike.

---

## 14. Reliability Constraints

- No agent action may block core UI navigation (gold button, menu, home).
- No agent may introduce heavy UI loops (battery-aware).
- Boogie enforcement UI = banners/sheets, never freezes app.
- IDARi performance actions degrade gracefully (lower refresh, lower media quality, cache-first).
- Dr. Eams chat = non-blocking, closable/minimizable.
- In outage mode, Dr. Eams communicates "degraded system" using IDARi status.

---

## 15. Anti-Abuse Protections

- Rate limit enforcement actions.
- Rate limit system knob changes.
- Human confirmation for global changes.
- Kill switch: disable automated enforcement temporarily (admin-only) if false positives spike.
- Simulation mode: Boogie and IDARi log events without applying real restrictions (dev only). **Never on in production.**
- Test suite covers policy scenarios and system scenarios.

---

## 16. Acceptance Criteria

The triad is "working" when:

- [x] Boogie can restrict and Dr. Eams can explain the exact reason and duration.
- [x] IDARi can throttle system load and Dr. Eams can explain "system slow mode."
- [x] Boogie restrictions appear as a consistent UI state (banner + details sheet).
- [x] Appeals create an event visible to the triad and show the user status.
- [x] Major updates are blocked without unanimous triad approval.
- [x] Triad produces no contradictory user messages (single source of truth via events).

---

## 17. Documentation Obligations

- Every policy change → updates public policy docs + changelog.
- Every triad protocol change → updates this file (`docs/AI_TRIAD_PROTOCOL.md`).
- PRs must update `docs/TERMS.md` if new public vocabulary is introduced.
- Docs must be readable on mobile: short headers, no walls of text.
- Use version numbers in docs and in emitted events.
