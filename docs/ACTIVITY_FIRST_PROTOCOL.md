# DREAMengin — Activity-First Protocol & Monetization

**Status:** Active — Canonical Platform Law  
**Author:** José Mancilla  
**Date:** 2026-03-25  
**Supersedes:** Engagement-based ranking, impression-based advertising, vanity metrics

---

## TABLE OF CONTENTS

1. Core Principles
2. Activity Reward System
3. Algorithm & Visibility
4. Metrics & Measurement
5. Ad System
6. Harmful Content Protocol
7. Monetization (Platform & User)
8. Implementation Requirements
9. Success Conditions

---

## I. CORE PRINCIPLES

These principles are non-negotiable and apply to every surface, algorithm, and system in DREAMengin.

### 1. Reward Actual Activity, Not Engagement
Algorithmic visibility is determined by **what users do**, not how long they stay. Feed placement, reach, and platform rewards are tied to real-world action, creation, and innovation — never to scroll depth, time spent, or passive consumption.

**Activity includes:**
- Things you do *outside* the platform (skate, build, explore, perform)
- Things you do *inside* the platform (code a game, compose music, run a lab experiment)

Both are valued equally.

### 2. We Post Real Shit Equally
The algorithm does not know or care about follower count, previous likes, or platform fame. Every post is evaluated on its own merits:
- Is there proof of activity?
- Is this original?
- Does it show effort, skill, courage, or curiosity?

If yes: visibility. If no: invisible. **Likes are secondary. Views are the primary metric.**

### 3. Views Are the Currency
The number that matters is how many people stopped to see what you did. View counts are displayed prominently. Views determine reach. Views are the metric users optimize for.

### 4. You Cannot Buy Higher Placement
No amount of DreamShop purchases, premium upgrades, or paid promotions can artificially boost algorithmic visibility. The only way to appear higher in feeds is to *do more*. The algorithm is blind to wallet size.

### 5. Ads Are Earned, Not Forced
Users choose to watch ads. Watching earns skip credits. Credits skip future ads. The user is always in control. Ads are clearly marked `AD`.

### 6. Harmful Content Is Never Promoted
Content depicting self-harm, serious injury, death, or dangerous stunts by non-professionals never appears in feeds, recommendations, or trending. Search-only with warnings. No engagement-based exceptions.

### 7. Nothing Is Public by Default
All creation starts private. Sharing is intentional. This applies to all content, including activity posts.

---

## II. ACTIVITY REWARD SYSTEM

### Activity Types and Tiers

| Tier | Activity Type | Examples | Reward Weight |
|------|---------------|----------|---------------|
| **Tier 0** | Passive / Low Effort | Posting a photo with no context, reposting, screenshot | Minimal (followers only) |
| **Tier 1** | Reflection / Documentation | Sharing about your day, describing a project, teaching something | Low |
| **Tier 2** | Skill Development | Documenting practice over time, learning a new trick, showing improvement | Medium |
| **Tier 3** | On-Platform Creation | Building a game, composing music, running experiments, designing art | High |
| **Tier 4** | Real-World Action | Skating a spot, performing live, building something physical, exploring | High |
| **Tier 5** | On-Platform Innovation | Discovering new physics, creating novel Engin combinations | Highest |
| **Tier 6** | Never Done Before (Anywhere) | A trick never landed, an original invention, a scientific discovery | Maximum |

### Points System

Each activity earns points based on its tier. Points:
- Unlock cosmetic skins and themes
- Unlock special DreamShop items (free)
- Award badges displayed on profile
- Increase algorithmic visibility

**Points cannot be purchased.** They are earned only through verified activity.

**Points decay over a 30-day rolling window.** Recent activity matters more.

### Verification

| Method | Weight | Notes |
|--------|--------|-------|
| Video evidence | Highest | Must show user performing the activity |
| On-platform project | Highest | Auto-verified via project ID |
| Audio recording | High | Original music, spoken documentation |
| Photo with timestamp/location | Medium | Multiple angles preferred |
| Text-only | Low | Requires additional verification |

**TheBoogieMan.Ai monitors for:** duplicate content, fake check-ins, manufactured activity, and passive use patterns.

---

## III. ALGORITHM & VISIBILITY

### Activity Quality Score (AQS)

The single metric that represents how much a user is actually *doing*:

```
AQS = (Activity Points × Views per Post) ÷ (Days Active)
```

- **High AQS** = you do things, people watch, you're contributing
- **Low AQS** = you're just watching

### Feed Ranking Formula

```
visibility = (AQS × tier_multiplier) + (verification_strength) + innovation_bonus
```

| Variable | Weight | Notes |
|----------|--------|-------|
| AQS | 1.0 | Core metric |
| Activity Tier | 2×–16× | Tier 5/6 get exponential boost |
| Verification Strength | 0–500 | Video=500, audio=300, photo=100, text=0 |
| Innovation Bonus | 0–1000 | First to do something new |

**The algorithm does NOT consider:**
- Time spent in app
- Scroll depth
- Likes, comments, shares
- Follower count
- Ad interactions

---

## IV. METRICS & MEASUREMENT

### User Metrics (Displayed on Profile)

```
👁️ Total Views: 12,847
⭐ Activity Points: 2,450 (last 30 days)
📈 Activity Quality Score: 847
🏆 Most Viewed: Kickflip at Main Park (3,204 views)
🔥 Real Shit Rate: 94% (23 of 24 posts verified)
```

**No follower count. No like count.**

### Platform Health Metrics (IDARi Dashboard)

| Metric | Target | Formula |
|--------|--------|---------|
| Real Shit Rate | > 90% | Verified Posts ÷ Total Posts |
| Creation-to-Consumption Ratio | > 0.5 | Time Creating ÷ Time Watching |
| Outside Activity Rate | > 50% | Physical activity posts ÷ Total Posts |
| Ad View Rate | > 40% | Ads Watched ÷ Total Ad Impressions |
| Harmful Content Rate | < 0.05% | Flagged Content ÷ Total Posts |
| Average AQS | > 500 | Sum AQS ÷ Active Users |

### What We Do NOT Track

- Time spent (as success metric)
- Scroll depth
- Like/follower counts
- Engagement rate
- Ad impressions (as revenue metric)

---

## V. AD SYSTEM

### Ad Units

| Unit | Placement | Length | User Control |
|------|-----------|--------|--------------|
| Pre-Roll | Before user content | 15–30 sec | Watch or skip; watching earns 1 credit |
| Post-Roll | After user content | 15–30 sec | Watch or skip; watching earns 1 credit |
| Rewarded Ad | User-initiated | 30 sec | Click to watch; earns 3 credits |

**No mid-roll interruptions.** Ads play at natural boundaries.

### Skip Reward System

- Watch 1 pre/post-roll ad = 1 skip credit
- Watch 1 rewarded ad = 3 skip credits
- Credits never expire
- Credits automatically skip future ads
- User sees: "You have 5 skips. Next 5 ads will be skipped."

**No ads are forced.** Users always have a path to skip.

### Ad Pricing — Cost Per View (CPV)

| Tier | CPV | Requirements |
|------|-----|--------------|
| Standard | $0.08 | Any verified view |
| Premium | $0.12 | View from user with AQS > 500 |
| Super Premium | $0.15 | View from user who watched full 30s and engaged |

**No impression pricing. No CPM. Only CPV.**

### Verification & Fraud Prevention

TheBoogieMan.Ai verifies each view:
- Unique human viewer
- Watched minimum duration (95% of ad)
- No bot patterns
- No duplicate views

**Advertisers only pay for verified views.**

---

## VI. HARMFUL CONTENT PROTOCOL

| Category | Treatment |
|----------|-----------|
| Self-harm / suicide | Blocked. Crisis resources offered. |
| Serious injury or death | Search only with warning screen. Not in feeds. |
| Dangerous stunts (non-professional) | No promotion. Earns no points. |
| "Car crash" content | Search only. Not in feeds. |

**Professional exceptions:** Verified professionals may post with safety disclaimers. Not promoted to minors.

**Enforcement:** TheBoogieMan.Ai monitors and flags. Repeat violations lead to account restrictions or bans.

**User control:** Users can block all harmful content categories. Minors are blocked by default.

---

## VII. MONETIZATION

### Platform Monetization (How DREAMengin Makes Money)

| Stream | Model | Platform Cut |
|--------|-------|--------------|
| DreamShop | Platform sells official items | 100% of sales |
| DreamMarketplace | Transaction fee on user sales | 10% of sale price |
| Ad Platform | External advertisers buy ads | 30% of CPV |
| User Ad Buys | Users buy ads (cash) | 30% of CPV |

### User Monetization (How Users Make Money)

| Method | How It Works | User Keeps |
|--------|--------------|------------|
| Sell Creations | List items on DreamMarketplace | 90% of sale price |
| Sell Ad Space | Ads run on user's content | 50% of CPV |
| Affiliate | Promote others' items | 100% of commission |

**No view payouts.** Users are paid when they *sell* — either their creations or their ad space.

### Activity Points as Currency

Points are earned by doing things. Points can be **spent** but not **cashed out**:

| Item | Point Cost |
|------|------------|
| Ad views (promote your content) | 100 points per view |
| DreamShop items | Varies (50–5,000) |
| Marketplace fee reduction | 1,000 points = 1% (max 5%) |

**Why no cash-out:** Prevents view-farming, keeps incentives aligned with activity, not attention.

### Ad Revenue Distribution

When an ad runs:
- Advertiser pays CPV
- Platform takes 30%
- Creator (content owner) takes 50%
- Activity Reward Pool takes 20% (distributed monthly to high-AQS users)

### Revenue Flow Diagram

```
PLATFORM REVENUE
├── DreamShop: 100% → Platform
├── Marketplace: 10% → Platform, 90% → Creator
├── External Ads: 30% → Platform, 50% → Creator, 20% → Reward Pool
└── User Ad Buys: 30% → Platform, 50% → Creator, 20% → Reward Pool

USER REVENUE
├── Marketplace Sales: 90% → Creator
├── Ad Space Sales: 50% of CPV → Creator
├── Affiliate: 100% → Creator
└── Tips: 100% → Creator
```

---

## VIII. IMPLEMENTATION REQUIREMENTS

### Database Tables
- `activity_points` — decaying 30-day sum
- `activity_verification` — evidence of activity
- `views` — verified human views
- `skip_credits` — user credit balance
- `ad_views` — verified ad views for billing
- `user_metrics` — AQS, Real Shit Rate, etc.

### Algorithm
- Replace engagement ranking with `visibility_score`
- Implement points decay
- Add AQS as core metric

### Moderation
- TheBoogieMan.Ai monitors fraud, harmful content, gaming attempts
- Human review queue
- Warning screens for search-only content

### UI Updates
- Profile: total views, activity points, AQS, Real Shit Rate
- Feed: view count prominently, no like count
- Ads: `AD` badge, skip credit balance, choice options

### Parental Controls
- Minors blocked from harmful content by default
- Parents can set time limits and activity goals
- Dashboard showing child's activity points and views

---

## IX. SUCCESS CONDITIONS

The Activity-First Protocol succeeds when:

1. **Real Shit Rate > 90%** — feed is filled with verified activity
2. **Creation-to-Consumption Ratio > 0.5** — users create more than they consume
3. **Outside Activity Rate > 50%** — half of all posts involve physical activity
4. **Ad View Rate > 40%** — users choose to watch ads
5. **Harmful Content Rate < 0.05%** — dangerous content is filtered
6. **Average AQS > 500** — users are doing things worth watching

**We measure success by whether users are doing things worth watching, and whether people are watching.**

---

## X. THE LAW

1. **Reward actual activity, not engagement.**
2. **We post real shit equally.**
3. **Views are the currency.**
4. **You cannot buy higher placement.**
5. **Ads are earned, not forced.**
6. **Harmful content is never promoted.**
7. **Nothing is public by default.**

**No exceptions. No engagement hacks. No addiction loops. No tragedy monetization.**

---

*This protocol is maintained by IDARi and enforced by TheBoogieMan.Ai.*

**We post real shit equally.**
