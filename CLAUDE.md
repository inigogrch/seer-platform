# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Seer** is an AI news aggregation platform for tech professionals, built with Next.js 15.5, TypeScript, and Tailwind CSS. The platform features a modern landing page with waitlist functionality, onboarding flow, dashboard with story feeds, AI chat interface, saved stories collections, and profile management.

The current implementation uses **mock data** for all story feeds and user interactions. Backend integration with Supabase is configured for the waitlist feature only.

## Development Commands

```bash
# Package manager: pnpm (required - see package.json packageManager field)
pnpm install        # Install dependencies
pnpm dev            # Start development server on localhost:3000
pnpm build          # Build for production
pnpm start          # Start production server
pnpm lint           # Run ESLint
```

## Architecture & Key Patterns

### App Structure (Next.js App Router)

All pages are client components (`'use client'`) located in `src/app/`:
- `/` - Landing page with waitlist form
- `/onboarding` - Multi-step personalization flow
- `/dashboard` - Main story feed with horizontal scrolling cards
- `/chat` - AI chat interface
- `/saved` - Saved stories with collections
- `/profile` - User settings

No shared component library exists; components are defined inline within page files.

### Supabase Integration Pattern

Three distinct Supabase clients are configured in `src/lib/supabase/`:

1. **`client.ts`** - Browser client using `createBrowserClient` from `@supabase/ssr`
   - For client components
   - Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **`server.ts`** - Server client using `createServerClient` from `@supabase/ssr`
   - For server components and API routes
   - Manages cookies for session handling
   - Uses same public env vars

3. **`admin.ts`** - Admin client with service role key
   - **⚠️ NEVER import in client-side code**
   - Only for API routes and server-side operations
   - Uses `SUPABASE_SERVICE_ROLE_KEY` for elevated permissions
   - Currently used in `/api/waitlist/route.ts`

### Current API Routes

- **`/api/waitlist`** (GET/POST) - Handles waitlist email submissions
  - Stores emails in `waitlist_emails` table
  - Prevents duplicates via unique constraint on `LOWER(email)`
  - Returns appropriate status for duplicates (200 with message)

### Design System

**Brand Colors** (defined in `tailwind.config.js` and `globals.css`):
- Primary: `#4ECDC4` (seer-primary/seer-teal)
- Primary Hover: `#45B7B8`
- Accent: `#26D0CE` (seer-accent)
- Light: `#E8FFFE` (seer-primary-light)
- Dark: `#3A9B96` (seer-primary-dark)

**Custom Component Classes** (in `globals.css`):
- `seer-btn-primary` - Primary action buttons with gradient
- `seer-btn-secondary` - Secondary buttons
- `seer-btn-ghost` - Subtle buttons
- `seer-card` - Standard card with glass morphism
- `seer-card-interactive` - Hoverable cards
- `seer-input` - Form inputs
- `seer-nav-item` - Navigation items
- `story-card-horizontal` - Horizontal story layout used in dashboard/saved

**Typography**: Inter font with OpenType features enabled (`'cv02', 'cv03', 'cv04', 'cv11'`)

**Animations**: Custom keyframes defined for fadeInUp, fadeInLeft, fadeInRight, scaleIn, shimmer, floating effects, and bounce animations

### Data Models

Key TypeScript interface (used across dashboard/saved pages):

```typescript
interface Story {
  id: string
  title: string
  summary: string
  source: string
  publishedAt: string
  readTime: string
  category: string
  tags: string[]
  relevanceScore: number
  trending: boolean
  url: string
  image?: string
  saved?: boolean
}
```

## Important Configuration Notes

- **Next.js Config**: API routes are enabled (no static export). `trailingSlash: true` and `images.unoptimized: true`
- **pnpm Workspace**: Uses `onlyBuiltDependencies` for specific native modules (@tailwindcss/oxide, sharp, unrs-resolver)
- **Environment Variables**: All Supabase credentials are in `.env.local` (not committed to git)

## Development Workflow

When adding new features:

1. **Client-side pages**: Use `'use client'` directive and import from `@/lib/supabase/client`
2. **API routes**: Import from `@/lib/supabase/admin` for elevated permissions
3. **Server components** (if added): Import from `@/lib/supabase/server`
4. **Styling**: Extend custom classes in `globals.css` or use Tailwind utilities inline
5. **Colors**: Use `seer-primary`, `seer-accent`, or Tailwind's slate palette

## Migration Path (Future)

The platform is designed to transition from mock data to real backend:
- Replace mock story arrays with API/database queries
- Implement user authentication (Supabase Auth patterns already configured)
- Add real-time features using Supabase subscriptions
- Store user preferences, saved stories, and collections in database tables
