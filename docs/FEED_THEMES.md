# Feed Themes

DREAMengin's Home Feed organises content into six **Daydream themes**. Each theme has a set of keywords, RSS/Atom feeds, social discovery modes, and rendering preferences. The same theme profiles are used by both the Home Feed and future Widget instances.

## Theme Overview

| Theme | Emoji | Label | Media |
|-------|-------|-------|-------|
| `analytics` | 📊 | Analytics | Mixed |
| `brand` | ✦ | Brand | Mixed |
| `games` | 🎮 | Games | Video-first |
| `media-vault` | 🎬 | Media Vault | Video-first |
| `music` | 🎵 | Music | Mixed |
| `play` | 🌟 | Play | Mixed |

---

## Theme Profile Shape

Each theme is defined by a `ThemeProfile` object in `lib/feed/themes.ts`:

```ts
interface ThemeProfile {
  id: FeedTheme;          // slug
  label: string;          // display name
  emoji: string;          // UI icon
  keywords: string[];     // 10–25 search keywords for GDELT + scoring
  rssFeeds: string[];     // 5–15 free RSS/Atom feed URLs
  socialModes: SocialDiscoveryMode[];   // 'trending' | 'public' | 'following'
  blockedWords: string[]; // words filtered in safe-mode
  mediaPreference: MediaPreference;    // 'video-first' | 'mixed'
  defaultSourceTypes: Array<SourceType | 'mixed'>;
}
```

---

## analytics

**Keywords (14):** data analytics, business intelligence, machine learning, big data, data science, predictive analytics, dashboard metrics, KPI tracking, data visualization, real-time analytics, AI insights, cloud data, data pipeline, statistical analysis.

**RSS Feeds:**
- O'Reilly Radar – `https://feeds.feedburner.com/oreilly/radar`
- Towards Data Science – `https://towardsdatascience.com/feed`
- InfoQ Analytics – `https://www.infoq.com/analytics/rss`
- Datanami – `https://datanami.com/feed/`
- KDnuggets – `https://feeds.feedburner.com/kdnuggets-data-mining-analytics`

**Social modes:** trending, public  
**Media preference:** mixed

---

## brand

**Keywords (14):** branding strategy, brand identity, marketing trends, social media marketing, content marketing, digital advertising, brand storytelling, brand design, logo design, campaign launch, influencer marketing, brand voice, product launch, brand awareness.

**RSS Feeds:**
- Fast Company – `https://feeds.feedburner.com/fastcompany/headlines`
- Marketing Week – `https://www.marketingweek.com/feed/`
- Digiday – `https://digiday.com/feed/`
- Think with Google – `https://www.thinkwithgoogle.com/rss`
- Sprout Social – `https://sproutsocial.com/insights/feed/`

**Social modes:** trending, public  
**Media preference:** mixed

---

## games

**Keywords (15):** video games, game development, indie games, gaming news, esports, game release, PC gaming, console gaming, mobile games, game review, game trailer, game studio, game update, speedrun, gaming culture.

**RSS Feeds:**
- GameSpot – `https://www.gamespot.com/feeds/mashup/`
- Kotaku – `https://kotaku.com/rss`
- Eurogamer – `https://www.eurogamer.net/?format=rss`
- Rock Paper Shotgun – `https://feeds.feedburner.com/rockpapershotgun/pc-gaming-news`
- Polygon – `https://www.polygon.com/rss/index.xml`

**Social modes:** trending, public  
**Media preference:** video-first

---

## media-vault

**Keywords (15):** film reviews, movie release, streaming shows, documentary, television series, podcast, audiobook, media production, cinematography, director, award season, animation, short film, media criticism, entertainment news.

**RSS Feeds:**
- Variety – `https://variety.com/feed/`
- IndieWire – `https://www.indiewire.com/feed/`
- The Hollywood Reporter – `https://feeds.feedburner.com/thr/news`
- Pitchfork – `https://pitchfork.com/rss/news/feed/r.xml`
- AV Club – `https://www.avclub.com/rss`

**Social modes:** trending, public  
**Media preference:** video-first

---

## music

**Keywords (14):** new music release, album review, music video, live concert, music production, independent artist, record label, music streaming, playlist, music festival, music industry, hip-hop, electronic music, singer-songwriter.

**RSS Feeds:**
- Pitchfork – `https://pitchfork.com/rss/news/feed/r.xml`
- Rolling Stone – `https://www.rollingstone.com/music/feed/`
- Consequence of Sound – `https://consequenceofsound.net/feed/`
- Stereogum – `https://feeds.feedburner.com/stereogum`
- NME – `https://www.nme.com/music/rss`

**Social modes:** trending, public  
**Media preference:** mixed

---

## play

**Keywords (13):** creativity, art project, design inspiration, fun projects, DIY build, generative art, interactive art, maker culture, creative coding, experimental design, play and learn, open source project, side project.

**RSS Feeds:**
- Wired – `https://www.wired.com/feed/rss`
- Codrops – `https://feeds.feedburner.com/codrops`
- Tympanus – `https://tympanus.net/codrops/feed/`
- Cool Tools – `https://cooltools.org/feed`
- MakeUseOf – `https://feeds.feedburner.com/makeuseof`

**Social modes:** trending, public  
**Media preference:** mixed

---

## Admin Config

Theme keyword lists and RSS feed URLs can be adjusted without code changes by editing the `ThemeProfile` objects in `lib/feed/themes.ts`. A future admin UI can read/write these values from a database config table; the shape is compatible.

## Sanity Check

Run `validateThemes()` (exported from `lib/feed/themes.ts`) to assert every theme has at least one source and 10+ keywords. This is also exercised in `tests/feed-assembler.test.ts`.
