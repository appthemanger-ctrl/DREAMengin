# DreamEngin

A unified creator platform combining social feed, content aggregation, monetization, and scientific collaboration features.

## Features

- **Customizable Dashboard**: Drag-and-drop widget system with react-dnd
- **Unified Feed**: In-app posts + follows + external connectors (YouTube, Demo)
- **Profile System**: Public profiles with themes, links, music, merch, and lab projects
- **Ad Marketplace**: Buy and sell ad slots with revenue sharing
- **Shop**: User-sold merchandise listings
- **Music**: Upload and embed music releases
- **Lab**: Scientific project collaboration with markdown notebooks and physics widgets
- **Admin**: AI-powered site updater (MVP stub)

## Tech Stack

- **Framework**: Next.js 16.1.4 with App Router
- **Database**: Supabase (Postgres + Auth + Storage + Realtime)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Lucide Icons
- **Drag & Drop**: React DnD
- **Testing**: Playwright

## Getting Started

### Prerequisites

- Node.js 20.9+ (required by Next.js 16)
- Supabase account
- Vercel account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd dreamengin
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.local.example .env.local
```

4. Set up your environment variables in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Database Setup

1. Create a new Supabase project
2. Run the migrations in `supabase/migrations/`:`
   - `20240120000000_initial_schema.sql`
   - `20240120000001_enable_rls.sql`
3. Apply the seed script: `supabase/seed.sql`

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Deployment

### Supabase Setup

1. Create a new Supabase project
2. Run all SQL migrations in order
3. Enable RLS on all tables
4. Set up storage buckets for:
   - `avatars` (public)
   - `merch-images` (public)
   - `music-uploads` (public)
   - `attachments` (private)

### Vercel Deployment

1. Push your code to GitHub
2. Import the repository into Vercel
3. **Important:** In Vercel Project Settings → General, keep **Root Directory** blank (repo root) unless you intentionally moved the Next.js app into a subfolder.
   - If you see: **"No Next.js version detected"**, it almost always means Vercel is looking at the wrong folder or a `package.json` that doesn't include `next`.
4. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Deploy

#### Auth redirect note

Magic-link login redirects to `/auth/callback` (implemented in this repo) so the app can exchange the PKCE `code` for a Supabase session cookie before sending the user to `/home`.

#### If Vercel says: "No Next.js version detected"

This happens when Vercel is pointed at a directory that doesn't contain your **Next.js** `package.json`.

- In **Project Settings → General → Root Directory**, set it to **the repo root** (blank) or to the folder that contains this app's `package.json`.
- Confirm `package.json` contains `"next": "16.1.4"`.

See common fixes in the Vercel community + StackOverflow threads. citeturn0search2turn0search7

### Edge Functions (Optional)

For connector polling, deploy the Edge Function:

```bash
supabase functions deploy poll-connectors
```

Set up a cron job to run the polling function every 15 minutes.

## Project Structure

```
dreamengin/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── profile/[handle]/  # Dynamic profile pages
│   ├── lab/[id]/          # Lab project pages
│   └── ...
├── components/            # React components
│   ├── NavBar.tsx
│   ├── FeedCard.tsx
│   ├── DashboardLayout.tsx
│   └── ...
├── lib/                   # Utility functions
│   ├── supabase/          # Supabase clients
│   ├── connectors/        # External service connectors
│   └── utils.ts
├── types/                 # TypeScript types
│   └── supabase.ts        # Generated types
├── supabase/              # Supabase configuration
│   ├── migrations/        # Database migrations
│   └── seed.sql           # Demo data
├── tests/                 # Playwright tests
└── public/                # Static assets
```

## Key Features Implementation

### Authentication
- Supabase Auth with magic links (callback route at `/auth/callback`)
- Private route protection with middleware
- RLS policies for data access control

### Feed System
- Unified feed from multiple sources
- Feed rules (mute/boost/digest/budget)
- Deduplication using hash keys
- Real-time updates with Supabase Realtime

### Widget System
- Drag-and-drop interface with react-dnd
- Persistent layout per user
- Multiple widget types (notifications, promo, etc.)

### Ad Marketplace
- Slot creation and management
- Listing calendar system
- Order tracking and reporting
- Revenue sharing stub

### Lab Projects
- Markdown notebook editor
- File attachments via Supabase Storage
- Physics simulation widgets (PhET embeds)
- Project collaboration with members

## Testing

Run tests with Playwright:

```bash
npm run test
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `NEXT_PUBLIC_SITE_URL` | Production site URL |
| `STRIPE_SECRET_KEY` | Stripe secret key (V2) |
| `OPENAI_API_KEY` | OpenAI API key (V2 AI updater) |

## Security

- Row Level Security (RLS) on all tables
- Rate limiting via Supabase and Vercel middleware
- File upload validation
- Audit logging for admin actions
- Threat model includes spam, ad fraud, and data leakage protection

## MVP vs V2

### MVP (Current)
- Core functionality with stub implementations
- YouTube connector (polling)
- Stripe stub for payments
- AI updater stub (logs only)

### V2 (Future)
- Full AI updater with OpenAI integration
- Spotify connector
- Real Stripe payouts
- Advanced physics lab with three.js
- ML-based friend recommendations
- Admin analytics dashboard

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.