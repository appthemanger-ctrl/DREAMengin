# DreamEngin - Enhanced Edition

A unified creator platform combining social feed, content aggregation, monetization, and scientific collaboration features with advanced AI assistance, analytics, and modern UX enhancements.

## 🆕 New Features in Enhanced Edition

### 🎨 Dark Mode Support
- System-wide dark mode toggle with localStorage persistence
- Respects system preferences (prefers-color-scheme)
- Smooth transitions between themes
- All components fully optimized for dark mode

### 🤖 Dr. Eams - AI Assistant
- Context-aware help system powered by Dr. Eams, your personal DREAMengin guide
- Interactive chatbot interface with conversation history
- Smart suggestions for navigation and feature discovery
- Minimizable floating widget accessible from anywhere
- Proactive guidance for new users with a friendly, knowledgeable personality

### 📊 Advanced Analytics Dashboard
- Real-time metrics tracking (views, likes, comments, followers, revenue)
- Trend visualization with percentage changes
- Top performing posts analysis
- Revenue breakdown by source
- Weekly growth trends chart
- Export capabilities for data analysis
- Recent follower activity tracking

### 🔔 Smart Notification Center
- Categorized notifications (likes, comments, follows, trending, revenue)
- Unread badge with count
- Real-time timestamp formatting
- Mark as read functionality
- Mark all as read option
- Click-to-navigate to relevant content
- Elegant dropdown interface

### 📅 Content Scheduler
- Schedule posts for automatic publishing
- Multi-platform targeting (Feed, Lab, Profile)
- Visual status tracking (scheduled, publishing, published, failed)
- Edit and delete scheduled content
- Calendar view for planning
- Batch scheduling support

### 🔍 Advanced Search
- Global search across all content types
- Filter by category (Users, Posts, Lab Projects, Music, Products)
- Real-time search results
- Rich result cards with metadata
- Keyboard shortcuts support
- AI-powered search suggestions
- Thumbnail preview support

### 🎯 Enhanced Navigation
- Quick create button for instant post creation
- Improved notification visibility
- Cleaner profile dropdown
- Better mobile responsiveness
- Gradient brand logo
- Smooth hover effects and transitions

## Original Features

### Core Platform Features
- **Customizable Dashboard**: Drag-and-drop widget system with react-dnd
- **Unified Feed**: In-app posts + follows + external connectors (YouTube, Spotify)
- **Profile System**: Public profiles with themes, links, music, merch, and lab projects
- **Ad Marketplace**: Buy and sell ad slots with revenue sharing
- **Shop**: User-sold merchandise listings
- **Music**: Upload and embed music releases
- **Lab**: Scientific project collaboration with markdown notebooks and physics widgets
- **Admin Panel**: AI-powered site updater (MVP stub)
- **Messages**: Direct messaging system
- **Discovery**: Explore trending content and users

## Tech Stack

### Frontend
- **Framework**: Next.js 16.1.4 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with dark mode support
- **UI Components**: Radix UI + Lucide Icons
- **Drag & Drop**: React DnD
- **State Management**: React Hooks

### Backend
- **Database**: Supabase (Postgres + Auth + Storage + Realtime)
- **Authentication**: Supabase Auth with magic links
- **Storage**: Supabase Storage for media files
- **Edge Functions**: Supabase Functions for serverless logic

### Testing & Deployment
- **Testing**: Playwright for E2E tests
- **Deployment**: Vercel (optimized for Next.js)
- **CI/CD**: GitHub Actions (optional)

## Getting Started

### Prerequisites

- Node.js 24.x (specified in package.json)
- Supabase account
- Vercel account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd dreamengin-enhanced
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
2. Run the migrations in `supabase/migrations/`:
   - `20240120000000_initial_schema.sql`
   - `20240120000001_enable_rls.sql`
3. Apply the seed script: `supabase/seed.sql`
4. Set up storage buckets for:
   - `avatars` (public)
   - `merch-images` (public)
   - `music-uploads` (public)
   - `attachments` (private)

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```
dreamengin-enhanced/
├── app/                    # Next.js App Router
│   ├── analytics/         # Analytics dashboard (NEW)
│   ├── api/               # API routes
│   ├── profile/[handle]/  # Dynamic profile pages
│   ├── lab/[id]/          # Lab project pages
│   └── ...
├── components/            # React components
│   ├── AIAssistant.tsx           # AI chat helper (NEW)
│   ├── AdvancedSearch.tsx        # Enhanced search (NEW)
│   ├── AnalyticsPanel.tsx        # Analytics widget (NEW)
│   ├── ContentScheduler.tsx      # Post scheduler (NEW)
│   ├── NotificationCenter.tsx    # Notification system (NEW)
│   ├── ThemeToggle.tsx           # Dark mode toggle (NEW)
│   ├── NavBar.tsx                # Enhanced navigation
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

### Dr. Eams - AI Assistant
Dr. Eams is your personal AI guide for DREAMengin, using a context-aware system to help users navigate the platform effectively. Dr. Eams provides intelligent, conversational responses based on user queries and can guide users through various platform features with a friendly and knowledgeable personality. The assistant is implemented as a floating widget that can be minimized and remembers conversation history during the session, making it feel like a continuous, helpful companion throughout your DREAMengin experience.

### Analytics Dashboard
The analytics system tracks multiple metrics including views, likes, comments, followers, and revenue. It provides real-time insights into content performance, audience growth, and monetization effectiveness. The dashboard includes interactive charts and can export data for further analysis.

### Dark Mode
Dark mode implementation uses Tailwind CSS dark mode classes with system preference detection. It persists user preference in localStorage and applies smooth transitions when toggling themes.

### Notification System
The notification center aggregates various notification types and presents them in an organized, easy-to-navigate interface. It supports real-time updates through Supabase Realtime and includes smart grouping and filtering.

### Content Scheduler
The scheduling system allows users to plan content in advance and automatically publish at specified times. It supports multiple platform targets and provides visual feedback on scheduling status.

### Advanced Search
The search implementation provides fast, filtered results across all content types. It includes type-ahead suggestions, category filtering, and rich result previews with metadata.

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
- HTTPS enforced in production
- Environment variable encryption
- XSS protection via React
- CSRF protection for forms

## Performance Optimizations

- Server-side rendering for initial page load
- Image optimization with Next.js Image component
- Code splitting and lazy loading
- CDN delivery via Vercel Edge Network
- Database query optimization with proper indexing
- Caching strategies for frequently accessed data
- Optimistic UI updates for better UX

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import the repository into Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

The platform is optimized for Vercel's Edge Network and includes:
- Automatic HTTPS
- Global CDN
- Serverless functions
- Edge caching
- Analytics integration

### Post-Deployment Checklist

- [ ] Configure custom domain
- [ ] Set up SSL certificate
- [ ] Enable error tracking (Sentry recommended)
- [ ] Configure analytics (Google Analytics, Plausible, or similar)
- [ ] Set up monitoring (Vercel Analytics, Uptime Robot)
- [ ] Test all authentication flows
- [ ] Verify file uploads work
- [ ] Test dark mode across devices
- [ ] Validate email notifications
- [ ] Check mobile responsiveness

## Feature Roadmap

### V2 Features (Planned)
- [ ] Real-time collaboration on Lab projects
- [ ] Video upload and streaming support
- [ ] Advanced AI chat with GPT-4 integration
- [ ] Mobile apps (iOS & Android)
- [ ] API for third-party integrations
- [ ] Advanced analytics with ML predictions
- [ ] Multi-language support (i18n)
- [ ] Advanced moderation tools
- [ ] NFT marketplace integration
- [ ] Live streaming capabilities
- [ ] Enhanced physics simulations with Three.js
- [ ] Team accounts and organizations
- [ ] Custom domain support for profiles
- [ ] Advanced SEO optimization
- [ ] Automated content recommendations

### V3 Features (Future)
- [ ] Blockchain integration for content verification
- [ ] Decentralized storage options
- [ ] Advanced AI content generation
- [ ] VR/AR support for Lab projects
- [ ] Automated translation service
- [ ] Advanced payment options (crypto, etc.)

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write or update tests
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Style

- Use TypeScript for type safety
- Follow the existing code structure
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation for new features
- Ensure accessibility (a11y) compliance

## Support

For issues, questions, or suggestions:

- Open an issue on GitHub
- Check existing issues for solutions
- Review documentation thoroughly
- Test in development before production

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Next.js team for the excellent framework
- Supabase for the backend infrastructure
- Tailwind CSS for the styling system
- Lucide for the beautiful icons
- Vercel for deployment platform
- Open source community for inspiration and tools

## Changes from Original

### Build Fixes
- ✅ Fixed lucide-react import error (Robot → Bot)
- ✅ Updated to Node.js 24.x as specified in package.json
- ✅ Verified all imports and dependencies
- ✅ Removed deprecated config options

### Enhancements
- ✅ Added dark mode with theme toggle
- ✅ Implemented AI assistant chatbot
- ✅ Created analytics dashboard
- ✅ Built notification center
- ✅ Added content scheduler
- ✅ Enhanced search functionality
- ✅ Improved navigation UX
- ✅ Added loading states and animations
- ✅ Improved error handling
- ✅ Enhanced accessibility features
- ✅ Optimized mobile responsiveness
- ✅ Added keyboard shortcuts
- ✅ Improved performance with lazy loading

---

Built with ❤️ for creators, scientists, and innovators
