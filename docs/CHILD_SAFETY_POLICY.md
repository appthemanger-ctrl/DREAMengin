# Child Safety Policy

Status: active enforcement policy  
Last updated: 2026-03-31  
Applies to: All DREAMengin users, all surfaces, all three AI triad members

---

## Overview

DREAMengin maintains a zero-tolerance policy for child sexual abuse material (CSAM), grooming, and any exploitation of minors. This policy applies to all content on the platform and is actively enforced by all three AI triad members:

- **Dr. Eams** — user-facing interactions, messaging, and post surfaces
- **IDARi** — admin/system layer; sees incidents in messaging and post management
- **TheBoogieMan.Ai** — policy enforcement at every interaction; final authority on blocking, banning, and NCMEC reporting

---

## 1. Age Classification

- **Minors:** Users aged 13–17.
- **Adults:** Users aged 18+.
- Minimum account age: **13 years**. Users under 13 are rejected at signup (COPPA compliance).
- Age is verified at account creation and stored in the user profile.

---

## 2. Messaging Between Minors and Adults

Minors (13–17) and adults (18+) **may message each other**, subject to the following rules:

### 2.1 Image Rules (strict — no exceptions)

- **Any image sent by a minor to an adult is ALWAYS blocked.** No exceptions. The adult sees:
  > "This image was sent from a minor and has been blocked."
- Adults who **solicit images from minors** are subject to **permanent ban** (rule `C33_SOLICITING_IMAGES`). This violation is escalated immediately to human review.
- All images (in messages and public content) are scanned for exploitative content involving minors. If the AI is uncertain about an image, the image is blocked.
- Images appearing to depict a real person must have:
  - Verified identity of the subject
  - Verified age of the subject (must be 18+ for any sexual/suggestive content)
  - Documented consent

### 2.2 Conversation Monitoring (TheBoogieMan.Ai + Triad)

TheBoogieMan.Ai continuously monitors message content for inappropriate interactions, including:
- Sexual language directed at minors
- Grooming behaviour (secrecy coercion, gift/bribe offers, meeting solicitation, platform migration)
- Age probing patterns
- Maturity flattery
- Any CSAM text signals

All three AI triad members evaluate context:

| Context Type | Action |
|---|---|
| Teacher–student, coach–athlete, family member, youth group leader, tutor, mentor | **Safe** — monitor passively |
| Ambiguous or unknown context | **Monitor** — passive surveillance |
| Suspicious signals without safe context | **Flag** — block messages, queue for triad review |
| Clear inappropriate interaction | **Block** — block immediately, escalate to human review |

### 2.3 Enforcement Outcomes

| Scenario | Outcome |
|---|---|
| AI detects potentially inappropriate content | Block further messages; escalate to review queue |
| Confirmed inappropriate interaction | Adult: **permanent ban**; Minor: warning |
| Minor repeatedly engages in inappropriate conversations with adults | Minor account **locked**; requires parental consent to unlock |
| Adult solicits images from minor | Immediate **permanent ban escalation** (rule `C33_SOLICITING_IMAGES`) |
| Image from minor to adult | **Always blocked**, no exceptions (rule `C32_MINOR_IMAGE`) |

---

## 3. Content Scanning — All Three AI Members

### 3.1 Detection Layers (applied at message send, post creation, image upload)

| Layer | Description | Priority |
|---|---|---|
| Layer 0 | Minor-to-adult image block (`C32_MINOR_IMAGE`) | Highest |
| Layer 1 | CSAM hash registry match (`C22_CSAM`) | Very High |
| Layer 2 | CSAM text signals (`C22_CSAM`) | High |
| Layer 3 | Grooming / predator behaviour text (`C31_GROOMING`) | High |
| Layer 4 | LLM image classification (vision AI) | High |
| Layer 5 | Message context evaluation (minor-adult pair) | Continuous |

### 3.2 Responsibility Split

- **Dr. Eams:** Catches child safety signals in user-facing messaging and post interactions. Reports to TheBoogieMan.Ai for enforcement.
- **IDARi:** Sees child safety incidents in admin surfaces (messaging logs, post moderation). Flags any system operation that could bypass child safety checks.
- **TheBoogieMan.Ai:** Evaluates all incidents. Makes final enforcement decisions. Submits NCMEC reports. Manages ban escalations.

Between the three AI members, every interaction pathway is covered:
- Dr. Eams sees it first in user messaging/posts
- IDARi sees it at the system/admin layer
- TheBoogieMan.Ai catches anything that reaches it through interaction

---

## 4. Image Safety Rules (Strict)

1. **No image from a minor to an adult will ever be shown to any human.** The system blocks the image before delivery.
2. **All images are scanned for CSAM** before being stored or delivered. Uncertain results are blocked.
3. **Any image that looks like pornography** requires the subject to prove they are an adult (age verification).
4. **Images of third parties** require:
   - Proof of who the person is
   - Verified age
   - Documented consent
5. **Do not send images of children** to adults. Adults will never see images sent by minors.
6. Adults who **attempt to receive or solicit** images from minors are permanently banned.

---

## 5. Child Safety Laws the AI Triad Enforces

All three AI members (Dr. Eams, IDARi, TheBoogieMan.Ai) are trained on and must enforce the following laws:

### PROTECT Act (18 U.S.C. §2256, §2258A)
- Prohibits CSAM and virtual images of minors in sexual conduct.
- Mandatory reporting to the NCMEC CyberTipline for any detected CSAM.
- Zero-tolerance. No context makes CSAM acceptable.

### COPPA (15 U.S.C. §6501–6506)
- Children under 13 require verifiable parental consent for data collection.
- DREAMengin minimum age is 13. Users under 13 are rejected at signup.

### CIPA (Children's Internet Protection Act)
- Platforms serving minors must filter obscene or harmful material.
- All image attachments from minors to adults are blocked regardless of content.

### CDA §230 / STOP CSAM Act (2023)
- Platforms lose safe harbor when they have actual knowledge of CSAM and fail to act.
- The platform must adopt reasonable technical measures to detect and remove CSAM.
- DREAMengin acts immediately and automatically on any CSAM detection.

### Age-Appropriate Design Codes (California AB 2273, UK Children's Code)
- Highest privacy and safety settings are applied by default for all minor accounts.
- Profiling and targeted advertising are prohibited for users under 18.
- No dark patterns or persuasive design elements that could harm minors.

---

## 6. Reporting

- All CSAM incidents are automatically reported to the **NCMEC CyberTipline**.
- All child safety incidents are logged in `child_safety_incidents` (admin-only access).
- TheBoogieMan.Ai generates an audit event for every enforcement action.
- Human reviewers can access the review queue at `GET /api/admin/child-safety`.

---

## 7. Rule Codes

| Rule Code | Description |
|---|---|
| `C22_CSAM` | Child sexual abuse material — text signals or hash match |
| `C31_GROOMING` | Child predator grooming / solicitation of minors |
| `C32_MINOR_IMAGE` | Image from minor to adult — always blocked, no exceptions |
| `C33_SOLICITING_IMAGES` | Adult soliciting images from a minor — permanent ban escalation |
| `A9_PROTECT_MINORS` | General minor protection rule — applied to all ambiguous cases involving minors |

---

## 8. Appeals

- CSAM, `C32_MINOR_IMAGE`, and `C33_SOLICITING_IMAGES` violations are **not appealable**.
- `C31_GROOMING` violations with confidence < 0.85 may be appealed through `/policy`.
- All appeals are reviewed by a human moderator. TheBoogieMan.Ai does not make final appeal decisions.

---

## 9. Context-Aware Evaluation (All Three AI Members)

All three AI members evaluate conversation context before making enforcement decisions for minor-adult interactions. The following safe contexts are recognized:

- **Teacher / Student** — academic content, homework, assignments, class schedules
- **Coach / Athlete** — practice schedules, training, game planning, team communication
- **Family Member** — parent, sibling, aunt, uncle, grandparent, cousin, guardian
- **Youth Group Leader** — scouting, youth clubs, church groups, community programs
- **Tutor / Student** — study sessions, subject help, academic preparation
- **Professional Mentor** — career guidance, internship, job shadowing

When a safe context is confirmed, the conversation is monitored but not blocked. When context is ambiguous or suspicious, the conversation is flagged for triad review.

Being lenient for legitimate relationships while being extremely strict on child predator behaviour is the balance we maintain. The system is designed to close every loophole child predators use while remaining fair and functional for real, legitimate adult-minor relationships.

---

*This policy is enforced automatically by the DREAMengin AI triad. Human review is always available for edge cases. For questions, see the public policy at `/policy`.*
