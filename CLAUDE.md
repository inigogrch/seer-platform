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

- **`/api/onboarding/save`** (POST) - Progressive onboarding persistence
  - Saves user progress at each onboarding step
  - Upserts to `onboarding_profiles` table by `client_id`
  - Enables resume capability if user refreshes/leaves

- **`/api/onboarding/complete`** (POST) - Final onboarding completion
  - Validates required fields (role, industry, tools)
  - Marks profile as completed with timestamps
  - **TODO placeholder**: Calls next agent (retrieval agent) for profile processing
  - See line 63 in route for agent integration point

- **`/api/onboarding/generate-options`** (POST) - Dynamic option generation with caching
  - Uses Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) for context-aware option generation
  - Implements intelligent caching via `options_cache` table (keyed by step + role + industry)
  - Streams options progressively to frontend for smooth UX
  - Fallback to hardcoded options on error
  - Steps: `team` (semi-dynamic), `tasks`/`tools`/`problems` (fully dynamic with LLM)

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

Key TypeScript interfaces:

**Story** (used across dashboard/saved pages):
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

**OnboardingState** (used in `/onboarding`):
```typescript
interface OnboardingState {
  clientId: string  // Generated via crypto.randomUUID()
  currentStep: 'role' | 'industry' | 'team' | 'tasks' | 'tools' | 'problems' | 'preferences' | 'complete'
  responses: {
    role?: string
    industry?: string | string[]  // Multi-select supported
    teamContext?: string | string[]
    tasks?: string[]
    tools?: string[]
    problems?: string[]
    preferences?: string
  }
  conversationHistory: Message[]
  startedAt: Date
}
```

**Database Tables**:
- `waitlist_emails` - Email captures from landing page
- `onboarding_profiles` - Anonymous user profiles with completed onboarding data
  - Fields: `client_id` (UUID), `role`, `industry` (jsonb), `team_context`, `tasks` (jsonb), `tools` (jsonb), `problems` (jsonb), `completed`, timestamps
  - RLS enabled with policies for anonymous access
  - See `migrations/001_onboarding_profiles.sql` for schema
- `options_cache` - LLM-generated option cache for onboarding
  - Keyed by `cache_key` (step-role-industry normalized)
  - Tracks `hit_count` and `last_used_at` for analytics

## Onboarding Agent Architecture

The `/onboarding` page implements a **dynamic elicitation flow** using progressive context-building:

**Flow**: Role → Industry → Team → Tasks → Tools → Problems → Preferences → Complete

**Key Features**:
1. **Progressive Elicitation**: Each step builds on previous answers to generate contextual options
2. **Anonymous Sessions**: Uses `crypto.randomUUID()` for client tracking (no auth required)
3. **Dual Persistence**:
   - LocalStorage for resume capability (survives refresh)
   - Supabase for persistent storage and analytics
4. **Smart Caching**: LLM-generated options cached in `options_cache` table
5. **Streaming UX**: Options stream in one-by-one (50ms delay for cached, 150ms for generated)
6. **Edit Capability**: Users can click previous answers to edit; triggers re-generation if needed
7. **Multi-select Support**: Industry, team, tasks, tools, problems allow multiple selections

**Option Generation Strategy**:
- **Static**: Role, Industry (predefined lists)
- **Semi-dynamic**: Team (role-based hardcoded options with LLM fallback)
- **Fully dynamic**: Tasks, Tools, Problems (Claude Haiku 4.5 generation with context)

**Security Note**: Top-right tooltip explains data storage (Postgres with RLS, encryption, audit logs)

## Important Configuration Notes

- **Next.js Config**: API routes are enabled (no static export). `trailingSlash: true` and `images.unoptimized: true`
- **pnpm Workspace**: Uses `onlyBuiltDependencies` for specific native modules (@tailwindcss/oxide, sharp, unrs-resolver)
- **Environment Variables**: Required in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
  - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role (server-side only)
  - `ANTHROPIC_API_KEY` - Claude API key for onboarding option generation

## Development Workflow

When adding new features:

1. **Client-side pages**: Use `'use client'` directive and import from `@/lib/supabase/client`
2. **API routes**: Import from `@/lib/supabase/admin` for elevated permissions
3. **Server components** (if added): Import from `@/lib/supabase/server`
4. **Styling**: Extend custom classes in `globals.css` or use Tailwind utilities inline
5. **Colors**: Use `seer-primary`, `seer-accent`, or Tailwind's slate palette

## Database Migrations

Migrations are stored in `/migrations/` and should be run via Supabase dashboard SQL editor or CLI:

```bash
# Run migration via Supabase dashboard
# Navigate to SQL Editor → Copy/paste migration content → Run

# Or via psql
psql $DATABASE_URL < migrations/001_onboarding_profiles.sql
```

**Existing Migrations**:
- `001_onboarding_profiles.sql` - Creates `onboarding_profiles` table with RLS policies

## Migration Path (Future)

The platform is designed to transition from mock data to real backend:
- Replace mock story arrays with API/database queries
- Implement user authentication (Supabase Auth patterns already configured)
- Add real-time features using Supabase subscriptions
- Store user preferences, saved stories, and collections in database tables
- **Next agent to build**: Retrieval agent that processes completed onboarding profiles (see TODO in `/api/onboarding/complete/route.ts:63`)
