# DREAMengin

## Overview

DREAMengin is a personalized social dashboard platform where users can create their own digital space with customizable widgets, a social feed, and integrations with external services like music streaming and gaming platforms. The application features a modern glassmorphic UI design with dark mode styling, user authentication, and a widget-based dashboard system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS with CSS variables for theming, custom glassmorphic design system
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Animations**: Framer Motion for smooth transitions and 3D effects
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a component-based architecture with:
- Pages in `client/src/pages/` for route-level components
- Reusable UI components in `client/src/components/ui/` (shadcn/ui)
- Custom feature components in `client/src/components/`
- Widget components in `client/src/components/widgets/`
- Custom hooks in `client/src/hooks/`

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API with `/api` prefix
- **Session Management**: Express-session with PostgreSQL session store (connect-pg-simple)
- **Authentication**: Custom session-based auth with scrypt password hashing

The server follows a modular structure:
- `server/index.ts` - Express app setup and middleware
- `server/routes.ts` - API route definitions and auth logic
- `server/storage.ts` - Data access layer with storage interface pattern
- `server/db.ts` - Database connection setup
- `server/vite.ts` - Development server integration
- `server/static.ts` - Production static file serving

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between frontend and backend)
- **Migrations**: Drizzle-kit with migrations output to `./migrations`

Database tables include:
- `users` - Core user accounts with authentication
- `profiles` - Extended user profile information and service connections
- `feedItems` - Social feed posts with metadata
- `widgets` - User dashboard widget configurations
- `friends` - User relationships
- `savedItems` - Bookmarked content

### Authentication
- Session-based authentication stored in PostgreSQL
- Password hashing using Node.js crypto scrypt
- Session middleware with `SESSION_SECRET` environment variable (required in production)
- Auth endpoints: `/api/auth/login`, `/api/auth/signup`, `/api/auth/me`, `/api/auth/logout`

### Build System
- Development: Vite dev server with HMR proxied through Express
- Production: Custom build script using esbuild for server and Vite for client
- Output: `dist/` directory with `index.cjs` for server and `public/` for client assets

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management
- **connect-pg-simple**: Session storage in PostgreSQL

### UI Libraries
- **Radix UI**: Accessible, unstyled component primitives
- **shadcn/ui**: Pre-built component library using Radix UI
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library for React
- **Lucide React**: Icon library

### State & Data Fetching
- **TanStack React Query**: Server state management and caching
- **Zod**: Schema validation for forms and API data
- **drizzle-zod**: Automatic Zod schema generation from Drizzle schemas

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string (required)
- `SESSION_SECRET` - Session encryption secret (required in production)