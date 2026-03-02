# Terms Glossary

**Version:** TRIAD_V1  
**Status:** Active — PRs must update this file if new public vocabulary is introduced.

All three AI agents (Dr. Eams, IDARi, Boogie) use exactly the vocabulary defined here.  
Dr. Eams mirrors these terms in user messages.  
Boogie references rule codes that match these definitions.

---

## Platform Concepts

| Term | Definition |
|---|---|
| **Dream** | A user-installed widget/app container. Users configure and arrange Dreams on their profile. Max 48 per user. |
| **Daydream** | One of 6 specialized first-party experiences. Heavier, full-powered mini-apps. Protected paths in the codebase. |
| **Home** | The core Dream layout — always conceptually node 0. The user is always "inside Home." |
| **Profile** | The user's public view. Includes their Home Dreams and bio. |
| **Share Code** | A config-only blueprint for a Dream layout. Contains no personal data — just widget settings. |
| **Dream Slot** | A single position in the user's Dream grid. Each slot holds one Dream instance. |
| **Widget** | The underlying component a Dream renders. Widgets are defined in the widget registry. |
| **Widget Instance** | A specific configured copy of a widget installed by a user as a Dream. |
| **Daydream Module** | The implementation of a Daydream feature (e.g., music player, social feed). |

---

## Navigation

| Term | Definition |
|---|---|
| **τ-navigation** | DREAMengin's state-transition navigation model. Not traditional URL-based routing — state transitions only. |
| **Golden Button** | The two floating buttons (Blue + Gold) that are the primary travel system. |
| **Blue Button** | Opens the Daydreams menu (right rail when unlocked). |
| **Gold Button** | Opens the System menu (left rail when unlocked). |
| **Home Anchor** | The button state controlling whether the user is anchored at Home (node 0). |
| **Rail** | The vertical edge of the screen where buttons snap when unlocked. |

---

## AI Agents

| Term | Definition |
|---|---|
| **Dr. Eams** | The user-facing AI assistant. Explains the platform, answers questions, and relays system/enforcement info. |
| **IDARi** | The admin-facing system optimizer AI. Handles performance, bugs, diagnostics. Never talks to users directly. |
| **Boogie / TheBoogieMan.AI** | The policy enforcement AI. Detects abuse, applies enforcement ladder, logs all actions with rule codes. |
| **Triad** | The three-agent system (Dr. Eams + IDARi + Boogie) operating as one coherent system. |
| **Triad Event** | A typed inter-agent message. The only allowed form of agent-to-agent communication. |
| **Correlation ID** | A UUID that links all triad events belonging to the same incident, end-to-end. |

---

## Enforcement

| Term | Definition |
|---|---|
| **Strike** | A counted policy violation event. Has a severity level and an expiry window. |
| **Strike Level** | LOW (14d) · MEDIUM (30d) · HIGH (90d) · CRITICAL (180d). |
| **Enforcement Ladder** | The ordered sequence of actions: NUDGE → WARN → THROTTLE → FEATURE_LOCK → QUARANTINE → TEMP_SUSPEND → TEMP_BAN → ESCALATE. |
| **Rule Code** | A short code (e.g. `C28_SPAM`) that uniquely identifies a policy rule in `docs/policy/theboogie.md`. |
| **Blast Radius** | The potential impact scope of an action: LOCAL · USER · SYSTEM · GLOBAL. |
| **Escalation** | Handing a case to human review. Required for all permanent bans and critical severity events. |
| **Appeal** | A user request to review a Boogie enforcement action. Creates a triad event and pauses escalation. |
| **Simulation Mode** | Dev-only mode where Boogie and IDARi log events but apply no real restrictions. **Never on in production.** |

---

## System Health

| Term | Definition |
|---|---|
| **System Slow Mode** | An IDARi-declared state where the platform is under heavy load. Means lower refresh rates, cache-first mode. Not a user punishment. |
| **Load Shedding** | IDARi reducing system load by temporarily lowering data refresh rates or media quality. |
| **Degraded** | A status indicating a subsystem is impaired but still running. |
| **Offline** | A status indicating a subsystem is unavailable. |

---

## Policy Concepts

| Term | Definition |
|---|---|
| **Policy Version** | The version string of the active policy (e.g. `BOOGIE_POLICY_V1`). Stamped on every enforcement event. |
| **Protocol Version** | The version string of the active triad protocol (e.g. `TRIAD_V1`). Stamped on every triad event. |
| **Major Update** | A change to policy, auth flows, monetization, connector permissions, or public data exposure. Requires unanimous triad approval + human confirmation for GLOBAL changes. |
| **Minor Update** | UI polish, non-breaking performance improvements, bug fixes with tests. IDARi can proceed; must notify others. |

---

_To add a new term: update this file in your PR and get it reviewed. The AI agents are automatically bound to this glossary._
