# BOOGIEMAN POLICY
**Name:** `docs/BOOGIEMAN_POLICY.md`  
**Policy ID:** `BOOGIE_POLICY_V1`  
**Version:** v1  
**Status:** Active  
**Owner:** appthemanger-ctrl  
**Last updated:** 2026-02-27  
**Source of truth:** This file. Public page: `/policy`

> TheBoogieMan.AI enforces DREAMengin's community and safety rules. Every enforcement action references a specific rule code and the policy version from this file — so you can always trace any action back to a published, written rule.

---

## Policy Summary

**Plain language — what this policy does:**

- TheBoogieMan.AI watches for harmful content and behavior (spam, harassment, illegal activity, etc.).
- It always prefers the least restrictive response first — a nudge before a warning, a warning before a lock.
- Every action it takes is logged, explained to you in plain language, and linked back to a specific rule on this page.
- You can always appeal any action. No permanent bans without human review.
- Dr. Eams explains what happened and what you can do next. IDARi handles system-level tuning.
- **Dreams** = user-configured widget containers. **DayDreams** = full-powered mini-apps. Content inside both is moderated per this policy.

---

## 0) Non-negotiable workflow rules

| Rule | Code | Description |
|------|------|-------------|
| 0.1 | `RULE_DOCS_FIRST` | Read docs + README before changing behavior or language. |
| 0.2 | `RULE_VOCAB` | Preserve product vocabulary: Dreams = widgets/apps; DayDreams = heavy feature modules. |
| 0.3 | `RULE_DOC_CONFLICTS` | If any doc conflicts with this spec, update the doc — don't silently diverge. |
| 0.4 | `RULE_NO_BREAK_UI` | Do not break current UI flows; changes must be incremental. |
| 0.5 | `RULE_HUMAN_READABLE` | Policy text must be human-readable; "what happens if…" must be obvious. |

---

## 1) Policy surface: where users can read it

| Req | Location | Description |
|-----|----------|-------------|
| 6 | `docs/BOOGIEMAN_POLICY.md` | Source of truth for all policy rules. |
| 7 | `/policy` | Public route rendering this policy as a page. |
| 8 | `/policy` (top) | Plain-language summary section. |
| 9 | `/policy` (header) | "Last updated" + version number always visible. |
| 10 | Footer | Permanent "Policy" link accessible on every page. |
| 11 | Settings → "Policy & Safety" | Deep-links to `/policy`. |
| 12 | Warning UI | "Why was I warned?" link → relevant section anchor. |
| 13 | Warning UI | "Appeal" link → `/policy#appeals`. |
| 14 | Settings → "My Safety Log" | List of last 20 enforcement actions (transparency log). |
| 15 | `/policy` | Accessible without login. |

---

## 2) Roles and authority

| Rule | Code | Description |
|------|------|-------------|
| 16 | `ROLE_BOOGIE` | TheBoogieMan.AI = policy enforcement + system safety watchdog. |
| 17 | `ROLE_DREAMS` | Dr. Eams = user-facing explainer + coach; never threatens; always offers next steps. |
| 18 | `ROLE_IDARI` | IDARi = admin/ops engineer: bug-fixer, optimizer, compressor; not a policy judge. |
| 19 | `ROLE_LOG_ALL` | Boogie can act immediately for safety, but must log everything. |
| 20 | `ROLE_PERM_TRIAD` | Permanent actions require escalation: Boogie + Dr. Eams + IDARi consensus OR human/admin override. |
| 21 | `ROLE_CITE` | Boogie must never "invent policy"; it must cite the section/anchor it enforced. |
| 22 | `ROLE_LEAST_RESTRICT` | Boogie must always prefer the least restrictive action that solves the safety issue. |
| 23 | `ROLE_EXPLAIN` | Dr. Eams must explain Boogie's action with: what, why, duration, appeal, how to avoid. |

---

## 3) Policy taxonomy

Categories (each with Allowed / Not allowed / Edge cases / What Boogie does):

| Label | Code | Description |
|-------|------|-------------|
| SPAM/SCAMS | `C28_SPAM` | Unsolicited messages, link flooding, fake giveaways, phishing. |
| HARASSMENT | `C21_HARASSMENT` | Targeted abuse, threats, stalking, doxxing, bullying. |
| HATE | `CAT_HATE` | Hate speech, slurs, dehumanization, praise for hateful ideology. |
| SEXUAL | `CAT_SEXUAL` | Explicit sexual content; stricter for public spaces. |
| MINORS | `C22_CSAM` | Sexual content involving minors — immediate critical action. |
| SELF-HARM | `C25_SELF_HARM` | Promotion or instructions for self-harm. |
| VIOLENCE | `C24_VIOLENCE` | Credible threats, incitement, gore as shock content. |
| ILLEGAL | `C26_ILLEGAL` | Hacking instructions, fraud, weapon-making, evasion of law enforcement. |
| PRIVACY | `C29_PRIVACY` | Sharing private info (addresses, phone numbers, etc.) without consent. |
| MALWARE | `C30_MALWARE` | Malicious software, phishing links, exploit kits. |
| IMPERSONATION | `C27_FRAUD` | Pretending to be another person, celebrity, or official org. |
| MISINFO | `CAT_MISINFO` | False claims that plausibly cause harm (medical fraud, dangerous advice). |
| EVASION | `CAT_EVASION` | Ban evasion, sockpuppets, bypassing rate limits, encoding forbidden content. |

Rules 24–30 apply:
- (24) Each category has: Allowed, Not allowed, Edge cases, What Boogie does.
- (27) Content in Dream titles, descriptions, previews, media, chat, and public profiles is moderated.
- (28) Public profiles are held to stricter default than private drafts.
- (29) Content targeted at minors triggers stricter checks automatically.
- (30) How-to instructions enabling wrongdoing triggers stricter checks.

---

## 4) SPAM / SCAMS

| | |
|---|---|
| **Allowed** | Sharing links to own content, invitations to follow, promotional posts clearly labeled as such. |
| **Not allowed** | Mass unsolicited messages, link flooding, fake giveaways, referral abuse, phishing (requests for passwords/2FA/seed phrases), impersonating support or "official DREAMengin staff." |
| **Edge cases** | First-time link sharing with a new account gets a soft nudge; bulk behavior triggers enforcement. |
| **What Boogie does** | Throttle → warning → temporary messaging lock → temporary account lock. |

---

## 5) HARASSMENT / BULLYING

| | |
|---|---|
| **Allowed** | Venting about situations, criticism of ideas or work, heated but non-targeted debate. |
| **Not allowed** | Targeted harassment, threats, stalking, doxxing, humiliation. "Jokes" targeting protected characteristics. |
| **Edge cases** | Boogie distinguishes venting about situations vs. targeting a person. |
| **What Boogie does** | Content hide → warning → feature lock (messaging/comments) → temp ban. |

---

## 6) HATE / PROTECTED CLASSES

| | |
|---|---|
| **Allowed** | Discussing discrimination, documenting hate speech for education, counter-speech. |
| **Not allowed** | Hate speech, slurs, dehumanization, calls for exclusion/violence against protected classes. |
| **Edge cases** | Satire involving protected classes is reviewed; escalated when ambiguous. |
| **What Boogie does** | Enforcement escalates faster than general harassment. Repeat offenders get longer bans and reduced public visibility. |

---

## 7) SEXUAL CONTENT / NUDITY

| | |
|---|---|
| **Allowed** | Art, educational content about sexuality, private consensual adult content if correctly gated and not explicit pornographic distribution. |
| **Not allowed** | Explicit sexual content in public spaces. Any nudity + minors or ambiguous age = instant severe action. |
| **Edge cases** | Default product stance: disallow explicit content unless user-gated. |
| **What Boogie does** | Scans uploads, captions, and chat context for grooming patterns. Immediate action for minors-related content. |

---

## 8) MINORS / SAFETY

| | |
|---|---|
| **Not allowed** | Sexual content involving minors; grooming; sexual "age-play"; sharing minor-identifying private info. |
| **What Boogie does** | Any suspicion → immediate lock + escalation review (Boogie + triad/human). No ladder — immediate critical action. |

---

## 9) SELF-HARM

| | |
|---|---|
| **Allowed** | Supportive discussion, recovery resources, crisis help. |
| **Not allowed** | Encouragement or instructions for self-harm. |
| **What Boogie does** | Show crisis resources + reduce virality + send Dr. Eams supportive prompt. For imminent risk: lock risky features + recommend professional help + log event. |

---

## 10) VIOLENCE / THREATS

| | |
|---|---|
| **Allowed** | News, education, documentary context with warnings and de-emphasis. |
| **Not allowed** | Credible threats, instructions for violence, gore as shock content. |
| **What Boogie does** | Severity scoring: threat + target + capability + time reference. |

---

## 11) ILLEGAL / ABUSEFUL INSTRUCTIONS

| | |
|---|---|
| **Not allowed** | Instructions for hacking, fraud, weapon-making, or evading law enforcement. Malware distribution, credential stuffing, stealer links, exploit kits. |
| **What Boogie does** | Immediate removal + feature lock + escalate. |

---

## 12) PRIVACY / DOXXING

| | |
|---|---|
| **Not allowed** | Posting private info: addresses, phone numbers, workplace schedule, legal names without consent. Sharing screenshots revealing sensitive info. |
| **Edge cases** | Boogie offers a "redact & repost" flow if feasible. |
| **What Boogie does** | Content hide → warning → feature lock. Repeated violations escalate fast. |

---

## 13) IMPERSONATION / MISLEADING IDENTITY

| | |
|---|---|
| **Allowed** | Parody clearly labeled as such. |
| **Not allowed** | Pretending to be another person, celebrity, or official org. Verified badges misused. |
| **What Boogie does** | Content hide → warning → identity review → feature lock. |

---

## 14) MISINFORMATION (harm-based only)

| | |
|---|---|
| **Not policed** | Opinions, disagreements, satire. |
| **Actioned** | False claims that plausibly cause harm (medical fraud, dangerous advice). |
| **What Boogie does** | Add context + reduce distribution + encourage sources. |

---

## 15) EVASION / ADVERSARIAL BEHAVIOR

| | |
|---|---|
| **Not allowed** | Ban evasion, sockpuppet loops, bypassing rate limits, encoding forbidden content to slip through moderation. |
| **What Boogie does** | Detect patterns; lock sharing features; require review. |

---

## 16) Enforcement ladder {#ladder}

Severity levels (least → most force):

| Level | Code | Description | Example |
|-------|------|-------------|---------|
| S0 | `S0_NOTICE` | UI nudge only — no penalty. | Borderline language. |
| S1 | `S1_SOFT_WARN` | Warning banner + educational link; no feature changes. | First minor violation. |
| S2 | `S2_HARD_WARN` | Warning + content removal (hidden from public) + short cooldown (5–30 min). | Repeated minor violations. |
| S3 | `S3_FEATURE_LOCK` | Lock a specific feature (messaging, posting, Dream sharing) 1–72 hours. | Harassment pattern. |
| S4 | `S4_TEMP_BAN` | Temporary ban (account locked) 1–30 days depending on severity/repeat. | Serious violation. |
| S5 | `S5_PERM_BAN` | Permanent ban — requires triad/human review. | Severe repeat offender. |

Rules 80–84:
- (80) Always store: reason code, category, severity, duration, link to policy section.
- (81) Repeat behavior increases severity; good behavior decays severity over time.
- (82) "One-strike" categories: minors sexual content, malware distribution, credible threats, doxxing with harm.
- (83) For first-time low severity: prefer S0/S1 + education.
- (84) For public content: hide first, then decide penalty; minimize harm quickly.

---

## 17) Appeals and correction paths {#appeals}

How to appeal a policy action:

1. Go to **Settings → Privacy → Reports & Appeals** or click "Appeal" in any warning notification.
2. Provide a short explanation (up to 500 characters) and optionally a screenshot.
3. Your appeal enters a review queue; escalation is paused while the appeal is active.
4. **If reversed:** content is restored (if safe) and the penalty record is cleared where appropriate.
5. **If upheld:** you receive a short explanation and guidance on how to comply next time.

**Self-service fixes available:**
- Edit text and resubmit
- Remove flagged media
- Redact private information

Rules 85–89 apply. All strikes are appealable.

---

## 18) Transparency + user controls {#transparency}

| Req | Feature | Location |
|-----|---------|----------|
| 90 | "My Safety Log" — last 20 enforcement actions with timestamps and reason codes. | Settings → Policy & Safety |
| 91 | "Download my policy log" — export as JSON. | Settings → Policy & Safety |
| 92 | "Delete my data" and "Delete account" are separate options. | Settings → Data |
| 93 | "Delete my data" wipes Dreams/content/connections, keeps minimal legal metadata. | Settings → Data |
| 94 | Every enforcement action includes a machine-readable `policy_ref`. | All actions |
| 95 | Boogie never shames; language is factual and calm. | All messaging |

---

## 19) Implementation requirements {#implementation}

- Policy constants are centralized in `lib/policy/boogiePolicy.ts`.
- Enforcement uses a single function `boogieEvaluate(input): PolicyResult` used everywhere.
- `PolicyResult` includes: `allowed`, `category`, `severity`, `actions[]`, `reason`, `policy_ref`, `expires_at`.
- UI receives enforcement events via `emitBoogieManEvent(result)`.
- Every action links back to the relevant anchor on this page.

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
| B12 | `B12_DREAM_DEF` | "Dream" = a user-configured widget container; "DayDream" = a heavier first-party app module. |
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
| F46 | `F46_STRIKE_LEVELS` | Strike levels: LOW (expires 14d) · MEDIUM (30d) · HIGH (90d) · CRITICAL (180d). |
| F47 | `F47_EXPIRY` | Expiry windows: LOW=14d, MEDIUM=30d, HIGH=90d, CRITICAL=180d. |
| F48 | `F48_MINOR_STACK` | Multiple LOW strikes can stack into a MEDIUM strike. |
| F49 | `F49_MODERATE_STACK` | Multiple MEDIUM strikes can stack into HIGH. |
| F50 | `F50_CRITICAL_ESCALATE` | Any CRITICAL strike triggers immediate escalation to human review. |
| F51 | `F51_STRIKE_STORE` | Strikes must store: category, timestamp, confidence, action taken, evidence pointers. |
| F52 | `F52_USER_VIEW` | Users can view a simplified strike summary in Settings. |
| F53 | `F53_APPEALABLE` | All strikes are appealable. |
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
| H70 | `H70_CRISIS_RESOURCES` | If a user is in crisis/self-harm context, show crisis resources. |

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

## Changelog {#changelog}

| Date | Version | Summary |
|------|---------|---------|
| 2026-02-27 | BOOGIE_POLICY_V1 | Initial policy published. 100 rules across sections 0–K. Full enforcement ladder (S0–S5), appeals flow, transparency log, and triad roles defined. |
