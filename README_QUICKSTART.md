# DREAMengin - World-Class Creator Platform 🚀

## Quick Start Guide

### 🎯 What's New in This Upgrade

1. **85/15 Revenue Split** - Industry-leading creator compensation
2. **Physics Laboratory** - CCC framework implementation for theoretical research
3. **Dr. Eams Enhanced** - Advanced AI assistant with personality and contextual awareness
4. **Profile Images** - Full avatar and cover image upload system
5. **Mobile-First Design** - Premium experience on all devices
6. **Content Engagement Tracking** - Detailed analytics for creators

---

## 📦 Installation

### Prerequisites

- Node.js 24.x
- Supabase account
- Vercel account (for deployment)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

#### A. Create Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note your project URL and anon key

#### B. Run Migrations

Execute these SQL files in order in your Supabase SQL Editor:

```sql
-- 1. Base schema
/supabase/migrations/20240120000000_initial_schema.sql

-- 2. Enable RLS
/supabase/migrations/20240120000001_enable_rls.sql

-- 3. Upgrade schema (NEW!)
/supabase/migrations/20260129000000_upgrade_schema.sql
```

#### C. Create Storage Buckets

In Supabase Dashboard → Storage:

1. **Create `avatars` bucket**
   - Public access: ON
   - File size limit: 5MB
   - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

2. **Create `covers` bucket**
   - Public access: ON
   - File size limit: 10MB
   - Allowed MIME types: image/jpeg, image/png, image/webp

3. **Create `experiment-data` bucket**
   - Public access: OFF (private)
   - File size limit: 50MB
   - Allowed MIME types: application/json, text/csv

#### D. Set Storage Policies

Execute in SQL Editor:

```sql
-- Avatars: authenticated users can upload their own
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Covers: same as avatars
CREATE POLICY "Users can upload own cover"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'covers');

-- Experiment data: private to owners
CREATE POLICY "Users can upload experiment data"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'experiment-data' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own experiment data"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'experiment-data' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### 3. Configure Environment

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 🚀 Deployment to Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Option 2: GitHub Integration

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import GitHub repository
4. Add environment variables
5. Deploy!

### Environment Variables (Vercel)

Add these in Vercel Dashboard → Project → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 🧪 Testing the Upgrade

### 1. Test Authentication
```bash
# Visit /login
# Sign up with email
# Verify magic link works
```

### 2. Test Profile Images
```bash
# Go to /edit-profile
# Click avatar camera icon
# Upload image (< 5MB)
# Verify image appears
# Repeat for cover image
```

### 3. Test Physics Lab
```bash
# Go to /lab
# Adjust CCC parameters
# Click "Run Experiment"
# Verify metrics update
# Check experiment history
```

### 4. Test Revenue System
```bash
# Go to /ads
# Create ad slot
# Set pricing
# Verify 85/15 split in database
```

### 5. Test Dr. Eams
```bash
# Click bot icon (bottom right)
# Type: "what can you do"
# Type: "tell me about the physics lab"
# Type: "navigate to analytics"
# Verify contextual responses
```

---

## 📁 File Structure

```
dreamengin-upgraded/
├── app/
│   ├── home/                 # Feed page
│   ├── lab/                  # Physics lab (NEW!)
│   ├── profile/              # User profiles
│   ├── edit-profile/         # Profile editor
│   ├── ads/                  # Monetization
│   └── analytics/            # Creator stats
├── components/
│   ├── AIAssistantEnhanced.tsx    # Dr. Eams (UPGRADED!)
│   ├── PhysicsLab.tsx             # Lab interface (NEW!)
│   ├── ProfileEditor.tsx          # Profile + images (NEW!)
│   ├── DashboardLayout.tsx        # Main layout
│   └── NavBar.tsx                 # Navigation
├── lib/
│   ├── supabase/            # DB client
│   └── agents/              # Dr. Eams logic
├── supabase/
│   └── migrations/
│       └── 20260129000000_upgrade_schema.sql  # NEW!
└── public/
    └── logo.png             # Dr. Eams mascot
```

---

## 🎨 Key Features

### 1. Revenue Sharing (85% to Creators)

**How it works:**
- Creators set up ad slots
- Buyers purchase slots
- Revenue auto-splits: 85% creator, 15% platform
- Tracked in `creator_earnings` table

**Implementation:**
```typescript
// Automatic via database trigger
-- When ad revenue recorded:
-- 1. Calculate split
-- 2. Update ad_orders
-- 3. Insert creator_earnings record
```

**Custom Splits:**
- High-volume creators can negotiate
- Set via `profiles.revenue_share_override`
- Applied automatically

### 2. Physics Laboratory

**CCC Parameters:**
- Layers (1-99): Transfer architecture depth
- Coherence Threshold (0-1): Unity requirement
- Entropy Budget: Information redistribution limit
- Boundary Condition: closed/open/periodic
- Transfer Coefficient: Layer interaction strength

**Features:**
- Real-time simulation
- Metrics: coherence, entropy, info flow, boundary record
- Experiment history
- Collaboration (coming soon)

**Educational Value:**
- Learn CCC framework
- Test theoretical predictions
- Share findings with community

### 3. Dr. Eams Enhanced

**Personality:**
- Warm and helpful
- Contextually aware
- Domain expertise (physics, revenue, content)
- Emotional intelligence

**Capabilities:**
- Navigate to any page
- Explain features
- Interpret analytics
- Physics lab guidance
- Revenue optimization tips

**Advanced:**
- Remembers conversation context
- Proactive suggestions
- InnerDreams integration (admin)

### 4. Profile System

**Avatar Upload:**
- Max 5MB
- Auto-resize to 300x300
- CDN delivery
- Fallback to initials

**Cover Images:**
- Max 10MB
- Recommended 1500x500
- Full-width banner
- Optional

**Additional:**
- Display name
- Bio (500 chars)
- Social links
- Theme customization (coming soon)

### 5. Mobile-First Design

**Touch Optimizations:**
- Large tap targets (48px min)
- Swipe gestures
- Bottom navigation
- Pull-to-refresh

**Performance:**
- Lazy loading
- Image optimization
- Skeleton loaders
- Progressive enhancement

**Responsive:**
- 320px → 2560px+
- Breakpoints: sm, md, lg, xl, 2xl
- Component-level responsiveness

---

## 🐛 Common Issues & Solutions

### Issue: "Storage bucket not found"

**Solution:**
```bash
# Create buckets in Supabase Dashboard
# Make sure names match exactly:
# - avatars
# - covers
# - experiment-data
```

### Issue: "Permission denied" on upload

**Solution:**
```sql
-- Run storage policies (see Setup section)
-- Verify authenticated users have INSERT permission
-- Check RLS is enabled on storage.objects
```

### Issue: Dr. Eams not responding

**Solution:**
```bash
# Check browser console for errors
# Verify component import in layout.tsx
# Make sure user is authenticated
```

### Issue: Revenue split not calculating

**Solution:**
```sql
-- Verify trigger exists:
SELECT * FROM pg_trigger WHERE tgname = 'calculate_ad_revenue';

-- If missing, re-run upgrade migration
-- Check revenue_config table has default row:
SELECT * FROM revenue_config;
```

### Issue: Physics lab not loading

**Solution:**
```bash
# Verify route exists: /app/lab/page.tsx
# Check component import
# Look for TypeScript errors
# Verify all dependencies installed
```

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

**User Engagement:**
- Daily active users
- Average session duration
- Content creation rate
- Physics lab usage

**Revenue:**
- Total creator earnings
- Platform revenue
- Average creator payout
- Revenue by source (ads, merch, music)

**Performance:**
- Page load times
- API response times
- Error rates
- Storage usage

### Recommended Tools

- **Vercel Analytics**: Built-in performance monitoring
- **Supabase Dashboard**: Database metrics
- **Google Analytics**: User behavior (optional)
- **Sentry**: Error tracking (optional)

---

## 🔐 Security Best Practices

### Authentication
- ✅ Magic link sign-in (no passwords to steal)
- ✅ Session-based auth with Supabase
- ✅ Refresh token rotation
- ✅ Secure httpOnly cookies

### Authorization
- ✅ Row Level Security (RLS) on all tables
- ✅ Owner-based policies
- ✅ Explicit permission checks
- ✅ No exposed admin endpoints

### Data Protection
- ✅ TLS/HTTPS everywhere
- ✅ Encrypted at rest (Supabase)
- ✅ Input validation
- ✅ SQL injection protection (parameterized queries)

### File Uploads
- ✅ File type validation
- ✅ Size limits enforced
- ✅ Unique filenames
- ✅ Virus scanning (optional, recommended for production)

---

## 🎓 Usage Examples

### Creating a Post
```typescript
const { data, error } = await supabase
  .from('app_posts')
  .insert({
    user_id: userId,
    content: 'My first post!',
    media_json: { images: ['url1.jpg'] },
    visibility: 'public'
  });
```

### Running a Physics Experiment
```typescript
const cccParams = {
  layers: 99,
  coherenceThreshold: 0.75,
  entropyBudget: 1.0,
  boundaryCondition: 'closed',
  transferCoefficient: 0.85
};

const { data } = await supabase
  .from('physics_experiments')
  .insert({
    creator_id: userId,
    title: 'Testing CCC coherence',
    parameters: cccParams,
    visibility: 'public'
  })
  .select()
  .single();
```

### Tracking Revenue
```typescript
// Automatically tracked via trigger
// Query creator earnings:
const { data: earnings } = await supabase
  .from('creator_earnings')
  .select('*')
  .eq('creator_id', userId)
  .order('created_at', { ascending: false });

// Calculate total:
const total = earnings.reduce((sum, e) => sum + e.net_amount, 0);
```

---

## 🤝 Contributing

### Development Workflow

1. **Fork repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Code Style

- TypeScript strict mode
- Prettier for formatting
- ESLint for linting
- Component-level error boundaries
- Comprehensive error handling

### Testing

```bash
# Run type check
npm run build

# Future: Unit tests
npm test

# Future: E2E tests
npm run test:e2e
```

---

## 📞 Support

### Documentation
- **Full Guide**: `/COMPREHENSIVE_UPGRADE_GUIDE.md`
- **API Reference**: Coming soon
- **Video Tutorials**: Coming soon

### Community
- **Discord**: [Join server]
- **GitHub Issues**: Report bugs
- **Email**: support@dreamengin.com

### For Developers
- **API Questions**: developers@dreamengin.com
- **Feature Requests**: GitHub Discussions
- **Security Issues**: security@dreamengin.com

---

## 📄 License

Proprietary - All rights reserved

**Important:** The 85/15 revenue split model is part of the platform's Terms of Service and is legally binding for all users.

---

## 🙏 Credits

**Created by:** Jose Mancilla
**Physics Framework:** CCC (Confirmed Connected Chaos)
**Mascot:** Dr. Eams

**Technologies:**
- Next.js 16.1.4
- React 18.2.0
- Supabase
- Tailwind CSS
- TypeScript

---

## 🚀 What's Next?

### Immediate (This Week)
- [ ] Deploy to production
- [ ] Onboard first creators
- [ ] Launch marketing campaign
- [ ] Set up monitoring

### Near-Term (Next Month)
- [ ] Mobile apps (iOS/Android)
- [ ] Live streaming feature
- [ ] Advanced physics visualizations
- [ ] Peer review system

### Long-Term (Q2-Q4 2026)
- [ ] Blockchain integration
- [ ] NFT marketplace
- [ ] DAO governance
- [ ] API for third-party apps

---

**Ready to revolutionize creator platforms and democratize theoretical physics? Let's build the future! 🚀**
