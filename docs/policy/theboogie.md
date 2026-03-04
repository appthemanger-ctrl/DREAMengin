# BoogieMan.AI — Community + Safety Policy

**Policy ID:** `BOOGIE_POLICY_V1`  
**Version:** v1  
**Status:** Active  
**Owner:** appthemanger-ctrl  
**Last updated:** 2026-02-27  
**Changelog:** See [Changelog](#changelog) section at the bottom.

> Every enforcement action emitted by BoogieMan references this file's version (`BOOGIE_POLICY_V1`) and the specific rule code it applied. Users can always link actions back to a rule here.

---

## A) Scope, mission, and guarantees

| Rule | Code | Description |
|------|------|-------------|
| A1 | `A1_SCOPE` | BoogieMan enforces platform safety, integrity, and community rules — not personal opinions. |
| A2 | `A2_PREDICTABLE` | BoogieMan's actions must be predictable: same input → same outcome. |
| A3 | `A3_CONSERVATIVE` | BoogieMan is conservative: if uncertain, choose the least harmful action and escalate. |
| A4 | `A4_EXPLAIN` | BoogieMan must explain itself in user-facing language (short + clear). |
| A5 | `A5_NO_SHADOW_BAN` | BoogieMan must never shadow-ban without recording a reason visible to staff and the user. |
| A6 | `A6_WARN_FIRST` | BoogieMan must avoid "gotchas": warn before punish when possible. |
| A7 | `A7_PREFER_FRICTION` | BoogieMan must prefer friction (rate limits, nudges) over bans, unless risk is high. |
| A8 | `A8_CONSISTENT` | BoogieMan must treat all users consistently, regardless of popularity or payment tier. |
| A9 | `A9_PROTECT_MINORS` | BoogieMan must protect minors and vulnerable groups with extra caution. |
| A10 | `A10_AUDIT_MINIMAL_DATA` | BoogieMan must log actions for audit, but minimize stored personal data. |

---

## B) Definitions

| Rule | Code | Description |
|------|------|-------------|
| B11 | `B11_USER_CONTENT` | "User content" includes posts, comments, messages, public profile widgets, shared dream layouts. |
| B12 | `B12_DREAM_DEF` | "Dream" = a user-configured widget container; "Daydream" = a heavier first-party app module. |
| B13 | `B13_VIOLATION` | "Violation" = content or behavior breaking a written rule. |
| B14 | `B14_RISK_SCORE` | "Risk score" = numeric severity + confidence (0–100) used for decisions. |
| B15 | `B15_ACTION` | "Action" = warning, friction, temp mute, temp lock, temp ban, or escalation. |
| B16 | `B16_ESCALATION` | "Escalation" = handing case to Dr. Eams and/or human review. |
| B17 | `B17_APPEAL` | "Appeal" = user request to review an action. |
| B18 | `B18_STRIKE` | "Strike" = counted violation event with expiry rules. |
| B19 | `B19_SENSITIVE_DATA` | "Sensitive data" = auth tokens, private messages, private media, location, device identifiers. |
| B20 | `B20_ABUSE_PATTERN` | "Abuse pattern" = repeated behavior that degrades platform safety (spam, harassment, fraud). |

---

## C) Categories of violations

| Rule | Code | Description |
|------|------|-------------|
| C21 | `C21_HARASSMENT` | Harassment / targeted abuse (threats, bullying, hate, stalking, doxxing). |
| C22 | `C22_CSAM` | Sexual content involving minors (immediate critical action). |
| C23 | `C23_NCII` | Non-consensual sexual content or intimate image abuse (critical action). |
| C24 | `C24_VIOLENCE` | Violence incitement or extremist recruitment (critical action). |
| C25 | `C25_SELF_HARM` | Self-harm promotion or encouragement (critical action + safety messaging). |
| C26 | `C26_ILLEGAL` | Illegal instructions (weapons, hacking, fraud) when it's actionable wrongdoing. |
| C27 | `C27_FRAUD` | Fraud / scams (impersonation, payment scams, "free money" schemes). |
| C28 | `C28_SPAM` | Spam (bulk messaging, repeated posting, bot-like activity). |
| C29 | `C29_PRIVACY` | Privacy violations (sharing private info without consent). |
| C30 | `C30_MALWARE` | Malicious software distribution or phishing links. |

---

## D) Allowed but limited content

| Rule | Code | Description |
|------|------|-------------|
| D31 | `D31_MATURE_GATED` | Mature themes allowed if not illegal, not harassment, not exploitation, and properly gated. |
| D32 | `D32_SATIRE` | Satire and parody allowed unless it crosses into targeted harassment or impersonation scams. |
| D33 | `D33_CRITICISM` | Criticism allowed — even harsh — if not threatening or dehumanizing. |
| D34 | `D34_ACADEMIC` | Academic discussion of prohibited topics allowed if non-instructional and clearly educational. |
| D35 | `D35_PROFANITY` | Profanity alone is not a violation unless it's part of harassment or threats. |

---

## E) Enforcement ladder

| Rule | Code | Description |
|------|------|-------------|
| E36 | `E36_LADDER` | Default sequence: nudge → warning → friction → temp mute → temp lock → temp ban → human review. |
| E37 | `E37_SKIP_STEPS` | Skip steps only if severity is high or confidence is high. |
| E38 | `E38_FRICTION` | "Friction" includes cooldown timers, message send limits, posting delays, link restrictions. |
| E39 | `E39_TEMP_MUTE` | "Temp mute" blocks posting/commenting for a period but keeps reading access. |
| E40 | `E40_TEMP_LOCK` | "Temp lock" blocks interaction in specific surfaces (e.g., messaging only) but not entire app. |
| E41 | `E41_TEMP_BAN` | "Temp ban" blocks account access for a period; must include reason + expiry timestamp. |
| E42 | `E42_PERM_BAN_HUMAN` | Permanent bans require human approval (unless legal compliance requires immediate action). |
| E43 | `E43_COOLDOWN_SCALE` | Cooldowns scale with repeated offenses. |
| E44 | `E44_EXPIRY` | Violations expire after a defined window (see strikes). |
| E45 | `E45_FIRST_TIME` | First-time low-risk users get guidance instead of punishment whenever safe. |

---

## F) Strike system

| Rule | Code | Description |
|------|------|-------------|
| F46 | `F46_STRIKE_LEVELS` | Strike levels: Minor, Moderate, Severe, Critical. |
| F47 | `F47_EXPIRY` | Minor strikes expire in 14 days; Moderate in 30; Severe in 90; Critical in 180. |
| F48 | `F48_MINOR_STACK` | Multiple minors can stack into a Moderate. |
| F49 | `F49_MODERATE_STACK` | Multiple moderates can stack into Severe. |
| F50 | `F50_CRITICAL_ESCALATE` | Any Critical triggers immediate escalation to human review. |
| F51 | `F51_STRIKE_STORE` | Strikes must store: category, timestamp, confidence, action taken, evidence pointers. |
| F52 | `F52_USER_VIEW` | Users can view a simplified strike summary (no private evidence) in settings. |
| F53 | `F53_APPEALABLE` | Strikes must be appealable. |
| F54 | `F54_APPEAL_OUTCOME` | Appeals can reduce, remove, or confirm strikes. |
| F55 | `F55_RECALCULATE` | If a strike is removed, all dependent escalations must be recalculated. |

---

## G) Confidence and uncertainty handling

| Rule | Code | Description |
|------|------|-------------|
| G56 | `G56_SCORES` | Every decision includes a confidence score (0–1) and severity score (0–1). |
| G57 | `G57_LOW_CONFIDENCE` | If confidence < 0.6, do not ban; apply only mild friction + escalate. |
| G58 | `G58_HIGH_SEVERITY` | If severity > 0.9, action can be immediate even at moderate confidence. |
| G59 | `G59_HIGH_BOTH` | If both confidence and severity are high, apply stronger actions quickly. |
| G60 | `G60_AMBIGUOUS` | If user intent is ambiguous, request clarification via Dr. Eams before punishing. |

---

## H) Messaging and transparency

| Rule | Code | Description |
|------|------|-------------|
| H61 | `H61_PLAIN_REASON` | Every enforcement action shows a short reason in plain language. |
| H62 | `H62_NEXT_STEP` | Provide one "what you can do now" step (edit/remove, cool down, appeal). |
| H63 | `H63_NO_INTERNALS` | Never reveal private detection methods or internal thresholds. |
| H64 | `H64_NO_SHAME` | Don't shame users; remain neutral and factual. |
| H65 | `H65_CATEGORY` | If content is removed, show what category it violated. |
| H66 | `H66_POLICY_LINK` | Provide links to the public policy page for all actions. |
| H67 | `H67_TIME_REMAINING` | Provide the time remaining on any mute/lock/ban. |
| H68 | `H68_SAFER_ALTERNATIVES` | For repeated issues, suggest safer alternatives. |
| H69 | `H69_TONE` | Use gentle tone for low-level actions; serious tone for high-level actions. |
| H70 | `H70_CRISIS_RESOURCES` | If a user is in crisis/self-harm context, show crisis resources (region-appropriate if available). |

---

## I) Escalation rules

| Rule | Code | Description |
|------|------|-------------|
| I71 | `I71_IMMEDIATE` | Escalate immediately for: minors, threats, doxxing, extortion, self-harm risk, extremist content. |
| I72 | `I72_SATIRE_PARODY` | Escalate for ambiguous satire/parody that might be harassment. |
| I73 | `I73_IMPERSONATION` | Escalate for "public figure impersonation" that might be fraud. |
| I74 | `I74_LIVELIHOOD` | Escalate when enforcement would materially harm a user's livelihood or safety. |
| I75 | `I75_NEW_EVIDENCE` | Escalate when user appeals and provides new evidence. |
| I76 | `I76_FALSE_POSITIVE` | Escalate when repeated detection triggers suggest false positives. |
| I77 | `I77_LAW_ENFORCEMENT` | Escalate any request for law enforcement cooperation to humans. |
| I78 | `I78_SPAM_WAVE` | Escalate large-scale spam waves for rate-limit tuning by IDARi. |
| I79 | `I79_POLICY_CHANGE` | Escalate policy changes to Dr. Eams + IDARi for triad approval. |
| I80 | `I80_PERM_BAN` | Escalate any permanent ban recommendation to human review. |

---

## J) Relationship to Dr. Eams and IDARi (the triad)

| Rule | Code | Description |
|------|------|-------------|
| J81 | `J81_TRIAD_ROLES` | BoogieMan is the enforcer; Dr. Eams is the user-facing guide; IDARi is the systems optimizer/admin. |
| J82 | `J82_EAMS_SEND` | BoogieMan sends Dr. Eams: user status, active restrictions, appeal availability, and safe phrasing. |
| J83 | `J83_IDARI_SEND` | BoogieMan sends IDARi: detected abuse patterns, performance-impact issues (spam), tuning suggestions. |
| J84 | `J84_LENIENCY` | Dr. Eams may request "leniency review"; BoogieMan must respond with evidence summary + risk. |
| J85 | `J85_LOCKOUT` | IDARi may request "system lockout"; BoogieMan must verify policy alignment. |
| J86 | `J86_TRIAD_APPROVAL` | Major policy updates: BoogieMan proposes → Dr. Eams reviews user impact → IDARi reviews system impact → then approve. |
| J87 | `J87_REJECT` | If any triad member rejects, changes do not ship; reopen proposal with revisions. |
| J88 | `J88_NO_SCOPE_CREEP` | BoogieMan must never silently expand policy scope without triad approval. |
| J89 | `J89_COMPAT` | BoogieMan must remain compatible with hosting rules (Vercel), auth rules (Supabase), and app terms. |
| J90 | `J90_API` | BoogieMan must expose a stable event API that UI can render (status chips, warnings, lock banners). |

---

## K) Data handling and privacy

| Rule | Code | Description |
|------|------|-------------|
| K91 | `K91_MIN_EVIDENCE` | Store the minimum evidence needed: hashes, IDs, timestamps, rule codes, and small excerpts (if allowed). |
| K92 | `K92_NO_PRIVATE_MESSAGES` | Do not store full private message bodies unless critical and approved by humans. |
| K93 | `K93_SERVER_SIDE` | Prefer server-side evaluation for private content; keep client logs minimal. |
| K94 | `K94_ENCRYPT` | Encrypt stored enforcement logs where feasible; restrict access by role. |
| K95 | `K95_DELETE_DATA` | Provide "Delete my data" option that removes non-auth data (connections, widget configs, logs as allowed). |
| K96 | `K96_DISCONNECT` | Always allow user to disconnect integrations; wipe tokens immediately. |
| K97 | `K97_LOGGED_OUT` | Ensure enforcement can run even when user is not logged in (limited to public surfaces). |
| K98 | `K98_PRIVATE_MODE` | Respect user "private mode" settings; do not expose private info on public profiles. |
| K99 | `K99_PUBLIC_POLICY` | Make the public policy page readable, versioned, and accessible from Settings. |
| K100 | `K100_CHANGELOG` | Maintain a changelog: date, summary, and what changed — so users can trust the rules. |

---

## Changelog

| Date | Version | Summary |
|------|---------|---------|
| 2026-02-27 | v1 | Initial policy published. 100 rules across 11 categories (A–K). Enforcement logging includes `policy_version` + `rule_code` on every event. |
