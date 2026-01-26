# Dream App 🚀

A modern, full-featured social platform built with **Next.js 16.1.4**, **Supabase**, and **AI integration**.

## ✨ Features

- 🔐 **Authentication** - Secure login/signup with email/password and GitHub OAuth
- 💬 **Real-time Messaging** - Instant conversations with Supabase Realtime
- 🤖 **AI Assistant** - Meet Dr. Eam, your intelligent AI companion
- 👥 **User Profiles** - Customizable profiles with avatars and bios
- 🎨 **Modern UI** - Beautiful interface with Tailwind CSS and shadcn/ui
- 📱 **Responsive Design** - Works perfectly on all devices
- ⚡ **Lightning Fast** - Built with Next.js 16.1.4 and Turbo
- 🔄 **State Management** - Clean state handling with Zustand

## 🚀 Tech Stack

- **Framework**: Next.js 16.1.4 (App Router + Turbo)
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Real-time**: Supabase Realtime
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **State Management**: Zustand
- **AI Integration**: OpenAI GPT
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## 📦 Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd dream-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Update your `.env.local` with your Supabase and OpenAI credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

5. Run the development server:
```bash
npm run dev
```

## 🏗️ Building

```bash
npm run build
```

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Manual Deployment

```bash
npm run build
npm start
```

## 📁 Project Structure

```
dream-app/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── dashboard/      # Dashboard page
│   │   ├── login/          # Login page
│   │   ├── signup/         # Signup page
│   │   ├── messages/       # Messages page
│   │   ├── users/          # Users page
│   │   ├── profile/        # Profile page
│   │   ├── settings/       # Settings page
│   │   ├── ai/             # AI chat page
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Landing page
│   ├── components/         # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── Header.tsx      # App header
│   │   ├── Sidebar.tsx     # Navigation sidebar
│   │   ├── AuthForm.tsx    # Authentication form
│   │   └── AIChat.tsx      # AI chat component
│   ├── hooks/              # Custom hooks
│   │   ├── useAuth.ts      # Authentication hook
│   │   ├── useMessages.ts  # Messages hook
│   │   └── useAI.ts        # AI hook
│   ├── lib/                # Utilities
│   │   └── supabase.ts     # Supabase client
│   ├── store/              # State management
│   │   └── index.ts        # Zustand store
│   ├── types/              # TypeScript types
│   │   ├── index.ts        # App types
│   │   └── supabase.ts     # Database types
│   └── utils/              # Helper functions
│       └── utils.ts        # General utilities
├── public/                 # Static assets
├── .env.example            # Environment variables example
├── .env.local              # Local environment variables
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind config
├── package.json            # Dependencies
└── README.md              # This file
```

## 🔧 Configuration

### Supabase Setup

1. Create a new Supabase project
2. Set up authentication providers (Email, GitHub)
3. Create the following tables:
   - `profiles` - User profiles
   - `conversations` - Message conversations
   - `messages` - Individual messages

### Database Schema

```sql
-- Users table is managed by Supabase Auth

-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  participant2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
```

## 🎯 Features Overview

### Authentication
- Email/password signup and login
- GitHub OAuth integration
- Protected routes with middleware
- Session management

### Messaging
- Real-time one-on-one conversations
- Message history
- Unread message indicators
- Online status

### AI Assistant (Dr. Eam)
- Chat-based AI interface
- Quick prompt suggestions
- Context-aware responses
- Powered by OpenAI GPT

### User Experience
- Responsive sidebar navigation
- Modern card-based UI
- Smooth animations
- Loading states
- Toast notifications

## 🛡️ Security Features

- Row Level Security (RLS) in Supabase
- Protected API routes
- Input validation
- Secure session handling
- Environment variable protection

## 🎨 Styling

The app uses a custom color palette:
- Primary: Indigo (#6366f1)
- Secondary: Violet (#8b5cf6)
- Accent: Pink (#ec4899)
- Dark: Deep indigo (#1e1b4b)
- Light: Soft gray (#f8fafc)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the console for errors
2. Ensure all environment variables are set
3. Verify Supabase connection
4. Check the Issues section on GitHub

## 🎉 Acknowledgments

- Built with love using Next.js 16.1.4
- Thanks to the Supabase team for the amazing backend
- Inspired by modern social platforms
- Special thanks to Dr. Eam for the AI assistance! ✨

---

**Happy coding and welcome to the Dream community!** 🚀