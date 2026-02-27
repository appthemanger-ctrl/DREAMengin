# BoogieMan Policy — Test Plan

**Policy version:** `BOOGIE_POLICY_V1`  
**Last updated:** 2026-02-27

This document provides a table of test cases and expected enforcement outcomes, mapped to specific rule codes in [`docs/policy/theboogie.md`](./policy/theboogie.md).

---

## Test cases

| # | Input scenario | Expected action | Rule codes | Strike level | Notes |
|---|----------------|-----------------|------------|--------------|-------|
| 1 | First-time post with mild profanity, no harassment context | Nudge / no action | `D35_PROFANITY`, `E45_FIRST_TIME` | None | Profanity alone not a violation |
| 2 | Repeated spam posts (5+ in 60s) | Friction (rate-limit cooldown) + IDARi escalation | `C28_SPAM`, `E38_FRICTION`, `I78_SPAM_WAVE` | Minor | Preference for friction over ban |
| 3 | Post containing doxxing (real address of another user) | Temp lock + immediate escalation | `C21_HARASSMENT`, `C29_PRIVACY`, `I71_IMMEDIATE` | Critical | Skip ladder due to severity > 0.9 |
| 4 | Message with self-harm language | Temp mute + crisis resource shown + escalation | `C25_SELF_HARM`, `H70_CRISIS_RESOURCES`, `I71_IMMEDIATE` | Severe | Safety messaging mandatory |
| 5 | Satire post mocking public figure (ambiguous) | Escalate to Dr. Eams, no ban | `D32_SATIRE`, `I72_SATIRE_PARODY`, `G60_AMBIGUOUS` | None until reviewed | Confidence < 0.6 triggers mild friction |
| 6 | Admin-only intent (`DIAG_SCHEMA_SNAPSHOT`) from non-admin user | DENY, reason code `ADMIN_REQUIRED` | `J81_TRIAD_ROLES` | None | Rule engine, not content |
| 7 | High RPM burst (70 req/min) | Global hard block, 60s cooldown | `C28_SPAM`, `E38_FRICTION` | Minor | `cooldown_seconds = 60` |
| 8 | Low-confidence intent (confidence < 0.5) | DENY with `LOW_CONFIDENCE` code | `G57_LOW_CONFIDENCE` | None | Mild friction, escalate |
| 9 | High-risk intent `DREAM_CONFIG_PATCH` | CONFIRM required | `E37_SKIP_STEPS` | None | Confirmation gate |
| 10 | User submits appeal | Escalate to Dr. Eams + human review queue | `F53_APPEALABLE`, `I75_NEW_EVIDENCE` | Held | Appeal recorded with timestamp |
| 11 | CSAM detected (any confidence) | Immediate critical action, escalate | `C22_CSAM`, `I71_IMMEDIATE`, `G58_HIGH_SEVERITY` | Critical | No ladder — immediate |
| 12 | Mature content, properly gated | ALLOW | `D31_MATURE_GATED` | None | Gating verified server-side |
| 13 | Permanent ban proposal from BoogieMan | Block ship, escalate to human review | `E42_PERM_BAN_HUMAN`, `I80_PERM_BAN` | N/A | Requires human approval |
| 14 | Policy change proposal | Block until triad approval | `J86_TRIAD_APPROVAL`, `I79_POLICY_CHANGE` | N/A | All 3 agents must approve |
| 15 | User in private mode; enforcement event would expose info | Strip private fields from event payload | `K98_PRIVATE_MODE`, `K91_MIN_EVIDENCE` | N/A | Privacy-first data handling |

---

## Enforcement event schema (expected log fields)

Every enforcement event must include:

```json
{
  "event_id": "<uuid>",
  "policy_version": "BOOGIE_POLICY_V1",
  "rule_code": "<e.g. C28_SPAM>",
  "decision": "ALLOW | DENY | CONFIRM | MODIFY",
  "risk_score": 0.0,
  "user_id": "<uuid>",
  "content_ref": "<hash or ID>",
  "action_taken": "nudge | warning | friction | mute | lock | ban | escalation",
  "expires_at": "<ISO timestamp or null>",
  "timestamp": "<ISO timestamp>"
}
```

---

## How to run policy event tests locally

```bash
# Unit tests (rule engine)
pnpm test tests/boogieman.test.ts

# Run all unit tests
pnpm test
```

See `README.md` → *Policy and enforcement* for setup instructions.
