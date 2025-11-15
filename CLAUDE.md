# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Seer** is an AI news aggregation platform for tech professionals, built with Next.js 15.5, TypeScript, and Tailwind CSS. The platform features a modern landing page with waitlist functionality, onboarding flow, dashboard with story feeds, AI chat interface, saved stories collections, and profile management.

The current implementation uses **mock data** for all story feeds and user interactions. Backend integration with Supabase is configured for the waitlist feature only.

## Development Commands

### Frontend (Next.js)

```bash
# Package manager: pnpm (required - see package.json packageManager field)
pnpm install        # Install dependencies
pnpm dev            # Start development server on localhost:3000
pnpm build          # Build for production
pnpm start          # Start production server
pnpm lint           # Run ESLint
```

**Note**: No test commands are currently configured in package.json. Tests need to be set up.

### Python Retrieval Agent

Located in `retrieval-agent/` directory:

**Prerequisites**: Python 3.11+ (tested with 3.12.8)

```bash
# From retrieval-agent/ directory
pip install -r requirements.txt    # Install Python dependencies
pytest                              # Run all tests (111 tests)
pytest -v                           # Run tests with verbose output
pytest -m "not integration"         # Run only unit tests (skip integration)
pytest tests/test_exa.py            # Run specific test file
pytest tests/test_perplexity.py     # Run Perplexity tests
pytest tests/test_ranking.py        # Run ranking pipeline tests
pytest tests/test_database.py       # Run database tests

# Demo scripts
python demo_api_raw.py              # View raw API responses and field population
python demo_ranking.py              # Test ranking pipeline with real data
python run_e2e_test.py --query "AI news" --verbose  # End-to-end test
```

**Environment Setup**: Create `.env` file in `retrieval-agent/` with required API keys:
- `EXA_API_KEY` - Exa AI search API key
- `PERPLEXITY_API_KEY` - Perplexity AI search API key
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Supabase service role key

**Important**: The Perplexity package has different names for installation vs import:
- Install: `pip install perplexityai`
- Import: `from perplexity import Perplexity`

**IDE Setup**: VS Code is configured to use the miniforge3 Python interpreter:
`.vscode/settings.json` - Python interpreter path and analysis settings
`pyrightconfig.json` - Type checking configuration for basedpyright
Reload VS Code window after changes to resolve import errors

## Architecture & Key Patterns

### Monorepo Structure

This is a **monorepo** containing both frontend and Python backend with **clear separation of concerns**:

```
seer-platform/
├── src/                    # Next.js frontend (TypeScript)
│   ├── app/               # Next.js App Router pages
│   ├── lib/               # Frontend libraries (Supabase clients, utilities)
│   ├── data/              # Frontend data (SQL setup scripts for waitlist)
│   └── migrations/        # Frontend migrations (onboarding_profiles, options_cache)
└── retrieval-agent/       # Python LangGraph agent system
    ├── database/          # Backend database (schema.sql, Supabase client)
    ├── tools/             # Search tools (Exa, Perplexity, normalization)
    ├── models/            # Pydantic schemas (SearchResult, Document, Story, etc.)
    ├── ranking/           # Ranking pipeline (heuristics, domain authority)
    └── tests/             # Python tests (pytest, 111 tests)
```

**Key Separation**:
- **`src/data/` + `src/migrations/`**: Frontend-only tables (waitlist, onboarding profiles, options cache)
- **`retrieval-agent/database/`**: Backend tables for content retrieval (stories, briefs, sections, preferences, logs)

### App Structure (Next.js App Router)

All pages are client components (`'use client'`) located in `src/app/`:
- `/` - Landing page with waitlist form
- `/onboarding` - Multi-step personalization flow
- `/dashboard` - Main story feed with horizontal scrolling cards
- `/chat` - AI chat interface
- `/saved` - Saved stories with collections
- `/profile` - User settings

No shared component library exists; components are defined inline within page files.

### Python Retrieval Agent Architecture

Located in `retrieval-agent/`, this is a **LangGraph-based agent system** for news retrieval and personalization:

**Core Components**:
- **Models** (`models/schemas.py`): Pydantic models for `SearchResult`, `Document`, `RankedDoc`, `Story`, `BriefSection`, `DailyBrief`
- **Tools** (`tools/`): Search provider integrations (Exa and Perplexity both implemented)
- **Ranking** (`ranking/`): Multi-stage ranking pipeline with domain authority and recency scoring
- **Database** (`database/`): Supabase client with full CRUD operations for stories, briefs, and user preferences
- **Normalization** (`tools/normalize.py`): Converts SearchResults to Documents with parsed dates, extracted domains
- **Tests** (`tests/`): pytest-based testing with markers for `@pytest.mark.integration`, `@pytest.mark.unit`, `@pytest.mark.database`, `@pytest.mark.slow`

**Current Status**: Slices 1-3 complete (Search, Ranking, Database - 111 tests passing)

**Integration Point**: The `/api/onboarding/complete` route has a TODO at line 63 to call the retrieval agent when onboarding completes.

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

**Frontend Database Tables** (see `src/migrations/` and `src/data/sql/`):
- `waitlist_emails` - Email captures from landing page
  - Schema: `src/data/sql/waitlist_setup.sql`
- `onboarding_profiles` - Anonymous user profiles with completed onboarding data
  - Fields: `client_id` (UUID), `role`, `industry` (jsonb), `team_context`, `tasks` (jsonb), `tools` (jsonb), `problems` (jsonb), `completed`, timestamps
  - RLS enabled with policies for anonymous access
  - Schema: `src/migrations/001_onboarding_profiles.sql`
- `options_cache` - LLM-generated option cache for onboarding
  - Keyed by `cache_key` (step-role-industry normalized)
  - Tracks `hit_count` and `last_used_at` for analytics
  - Schema: `src/migrations/002_options_cache.sql`

**Backend Database Tables** (see `retrieval-agent/database/schema.sql`):
- `stories` - Individual content items with AI enrichment and user interaction state
- `daily_briefs` - Complete daily brief metadata with sections and statistics
- `brief_sections` - Thematic groupings of stories (featured, interest-based, topic-based, etc.)
- `user_preferences` - User profile and personalization settings from onboarding
- `retrieval_logs` - Audit trail for search operations and API calls

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
- **Environment Variables**:
  - **Frontend** (`.env.local` in root):
    - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
    - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role (server-side only)
    - `ANTHROPIC_API_KEY` - Claude API key for onboarding option generation
  - **Python Agent** (`.env` in `retrieval-agent/`):
    - `EXA_API_KEY` - Exa search API key
    - `PERPLEXITY_API_KEY` - Perplexity search API key
    - `SUPABASE_URL` - Supabase project URL
    - `SUPABASE_KEY` - Supabase anonymous key
    - `SUPABASE_SERVICE_KEY` - Supabase service role key (for elevated permissions)

## Development Workflow

When adding new features:

1. **Client-side pages**: Use `'use client'` directive and import from `@/lib/supabase/client`
2. **API routes**: Import from `@/lib/supabase/admin` for elevated permissions
3. **Server components** (if added): Import from `@/lib/supabase/server`
4. **Styling**: Extend custom classes in `globals.css` or use Tailwind utilities inline
5. **Colors**: Use `seer-primary`, `seer-accent`, or Tailwind's slate palette

## Test-Driven Development (TDD)

This project follows TDD principles. **Always write tests before implementing features.**

### TDD Workflow

Follow the Red-Green-Refactor cycle:

1. **Red**: Write a failing test that defines the desired behavior
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Clean up code while keeping tests green

### Testing Tools & Setup

**Frontend/API Testing (TypeScript):**
- **Unit/Integration**: Jest + React Testing Library (NOT YET CONFIGURED)
- **E2E**: Playwright (NOT YET CONFIGURED)
- **TODO**: Add test commands to package.json: `pnpm test` (unit), `pnpm test:e2e` (Playwright)

**Agent Testing (Python):**
- **Framework**: pytest with pytest-asyncio and pytest-mock
- **Configuration**: `retrieval-agent/pytest.ini` defines test markers
- **Test Markers**:
  - `@pytest.mark.integration` - Tests that call real APIs (skip with `-m "not integration"`)
  - `@pytest.mark.unit` - Unit tests with mocked dependencies
  - `@pytest.mark.database` - Tests that interact with the database
  - `@pytest.mark.slow` - Tests that take >1 second
- **Run**: `pytest` from `retrieval-agent/` directory
- **Current Coverage**: 111 tests passing (Slices 1-3 complete: Search, Ranking, Database)

### Test Organization

```
seer-platform/
├── src/
│   ├── app/
│   │   └── api/
│   │       └── waitlist/
│   │           ├── route.ts
│   │           └── route.test.ts       # Co-located API tests (TODO)
│   └── lib/
│       └── __tests__/                   # Shared library tests (TODO)
├── tests/                               # Frontend tests (TODO - not yet created)
│   ├── e2e/                             # Playwright E2E tests
│   │   ├── onboarding.spec.ts
│   │   ├── waitlist.spec.ts
│   │   └── dashboard.spec.ts
│   └── integration/                     # Integration tests
└── retrieval-agent/                     # Python agent (EXISTS)
    └── tests/                           # ✅ 111 tests currently passing
        ├── test_exa.py                  # Exa client tests
        ├── test_perplexity.py           # Perplexity client tests
        ├── test_normalization.py        # Normalization tests
        ├── test_ranking.py              # Ranking pipeline tests
        ├── test_database.py             # Database operations tests
        ├── test_supabase_integration.py # Supabase integration tests
        └── test_integration.py          # End-to-end integration tests
```

### Testing Patterns by Component Type

#### API Routes

```typescript
// src/app/api/waitlist/route.test.ts
import { POST } from './route'
import { NextRequest } from 'next/server'

describe('POST /api/waitlist', () => {
  it('should add email to waitlist', async () => {
    const request = new NextRequest('http://localhost:3000/api/waitlist', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should reject duplicate emails', async () => {
    // Test duplicate handling
  })

  it('should validate email format', async () => {
    // Test validation
  })
})
```

#### React Components (Future - when extracting components)

```typescript
// src/components/WaitlistForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import WaitlistForm from './WaitlistForm'

describe('WaitlistForm', () => {
  it('should submit valid email', async () => {
    render(<WaitlistForm />)

    const input = screen.getByLabelText('Email')
    const button = screen.getByRole('button', { name: /join/i })

    fireEvent.change(input, { target: { value: 'test@example.com' } })
    fireEvent.click(button)

    expect(await screen.findByText(/thanks/i)).toBeInTheDocument()
  })
})
```

#### E2E User Flows (Playwright)

```typescript
// tests/e2e/onboarding.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Onboarding Flow', () => {
  test('should complete full onboarding', async ({ page }) => {
    await page.goto('/onboarding')

    // Step 1: Role
    await page.getByRole('button', { name: /Software Engineer/i }).click()

    // Step 2: Industry
    await page.getByRole('button', { name: /Technology/i }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    // ... continue through all steps

    await expect(page).toHaveURL('/dashboard')
  })
})
```

#### Python Agent Tests (Current Implementation)

```python
# retrieval-agent/tests/test_exa.py
import pytest
from tools.exa import ExaClient

@pytest.mark.unit
def test_exa_client_initialization(mock_exa_client):
    """Test that Exa client initializes correctly"""
    client = ExaClient(api_key="test-key")
    assert client.api_key == "test-key"

@pytest.mark.integration
async def test_exa_search_real_api():
    """Integration test with real Exa API (requires EXA_API_KEY in .env)"""
    client = ExaClient()
    results = await client.search("AI news", num_results=5)

    assert len(results) <= 5
    assert all(isinstance(r, SearchResult) for r in results)

# retrieval-agent/tests/test_normalization.py
from tools.normalize import normalize_search_result
from models.schemas import SearchResult, Document, SearchProvider

def test_normalize_extracts_domain():
    """Test that normalization correctly extracts domain from URL"""
    search_result = SearchResult(
        id="1",
        title="Test",
        url="https://techcrunch.com/2025/article",
        text="Content",
        score=0.9,
        provider=SearchProvider.EXA
    )

    doc = normalize_search_result(search_result)
    assert doc.source_domain == "techcrunch.com"
```

**Key Testing Patterns for Python Agents**:
- Use `@pytest.mark.unit` for tests with mocked dependencies
- Use `@pytest.mark.integration` for tests requiring real API calls
- Use pytest fixtures in `conftest.py` for shared test setup
- Mock external APIs using `pytest-mock` and `mocker.patch()`

### TDD for New Features

**Example: Adding a new API endpoint**

1. **Write the test first** (Red):
```typescript
// src/app/api/stories/route.test.ts
describe('GET /api/stories', () => {
  it('should return personalized stories', async () => {
    const response = await GET(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.stories).toHaveLength(10)
    expect(data.stories[0]).toHaveProperty('title')
  })
})
```

2. **Implement minimal code** (Green):
```typescript
// src/app/api/stories/route.ts
export async function GET(request: NextRequest) {
  // Minimal implementation to pass test
  return NextResponse.json({
    stories: [] // Start with empty array
  })
}
```

3. **Refactor** while keeping tests green

### Testing with External Dependencies

**Mocking Supabase:**
```typescript
jest.mock('@/lib/supabase/admin', () => ({
  getAdminClient: () => ({
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue({ data: {}, error: null })
    })
  })
}))
```

**Mocking Anthropic API:**
```typescript
jest.mock('@anthropic-ai/sdk', () => ({
  Anthropic: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ text: 'Mock response' }]
      })
    }
  }))
}))
```

### Coverage Goals

- **API Routes**: 80%+ coverage (critical business logic)
- **Shared Libraries**: 90%+ coverage (reusable utilities)
- **Agent Logic**: 80%+ coverage (Python agents)
- **E2E**: Cover all critical user journeys

### When to Write Different Test Types

- **Unit tests**: Pure functions, utilities, business logic
- **Integration tests**: API routes, database operations, agent workflows
- **E2E tests**: Complete user flows, cross-page interactions

### CI/CD Integration

**TODO**: Set up CI/CD pipelines for:
- Pre-commit hooks (unit tests)
- Pull request checks (all tests)
- Pre-deployment (all tests + E2E)

```bash
# Run all tests before committing (once configured)
pnpm test && pnpm test:e2e              # Frontend tests (TODO)
cd retrieval-agent && pytest            # Python agent tests (WORKING)
```

### Best Practices

1. **Test behavior, not implementation** - Focus on user-facing outcomes
2. **Keep tests fast** - Mock external dependencies
3. **One assertion per test** - Makes failures easier to debug
4. **Descriptive test names** - Use "should" statements
5. **Arrange-Act-Assert** - Clear test structure
6. **Test error cases** - Don't just test the happy path
7. **Use factories/fixtures** - For consistent test data
8. **Clean up after tests** - Reset state between tests

## Database Migrations

### Frontend Migrations

Located in `src/migrations/` - these support the Next.js onboarding flow and waitlist:

```bash
# Run migrations via Supabase dashboard
# Navigate to SQL Editor → Copy/paste migration content → Run

# Or via psql
psql $DATABASE_URL < src/migrations/001_onboarding_profiles.sql
psql $DATABASE_URL < src/migrations/002_options_cache.sql

# Waitlist setup
psql $DATABASE_URL < src/data/sql/waitlist_setup.sql
```

**Frontend Migrations**:
- `001_onboarding_profiles.sql` - Creates `onboarding_profiles` table with RLS policies
- `002_options_cache.sql` - Creates `options_cache` table for LLM-generated options caching
- `003_onboarding_migrations_context` - Migration documentation and context

### Backend Database Schema

Located in `retrieval-agent/database/schema.sql` - complete schema for the retrieval agent:

```bash
# Complete database schema for retrieval agent (480 lines)
# Includes: stories, daily_briefs, brief_sections, user_preferences, retrieval_logs
psql $SUPABASE_URL < retrieval-agent/database/schema.sql
```

**Schema Features**:
- PostgreSQL with pgvector extension for embeddings
- Row-Level Security (RLS) enabled on all tables
- Optimized indexes for read-heavy workload
- JSONB columns for flexible metadata storage

## Migration Path & Roadmap

### Current State
- ✅ Frontend fully implemented with mock data
- ✅ Supabase integration for waitlist and onboarding profiles
- ✅ Python retrieval agent infrastructure complete:
  - ✅ Slice 1: Multi-provider search (Exa + Perplexity)
  - ✅ Slice 2: Ranking pipeline (domain authority, recency scoring, heuristics)
  - ✅ Slice 3: Database layer (Supabase client with full CRUD operations, 5 tables)
  - ⏳ Slice 4: LangGraph agent workflow (IN PROGRESS)
- ⏳ Agent integration pending at `/api/onboarding/complete/route.ts:63`

### Next Steps
1. **Complete Retrieval Agent Workflow** (Slice 4):
   - Implement LangGraph workflow for orchestrating search, ranking, and brief generation
   - Add LLM reranking with Claude
   - Implement MMR diversity selection
   - Add novelty filtering vs recent briefs

2. **Build FastAPI Service** (Slice 5):
   - Create FastAPI application to expose retrieval agent
   - Implement SSE streaming for real-time progress updates
   - Add job management and error handling

3. **Connect Python Agent to Frontend**:
   - Implement API endpoint to call Python retrieval agent
   - Pass onboarding profile data to agent for personalization
   - Return personalized news feed to dashboard

4. **Backend Integration**:
   - Replace mock story arrays with real agent-generated feeds
   - Implement user authentication (Supabase Auth)
   - Store user preferences, saved stories, and collections in database
   - Add real-time features using Supabase subscriptions

5. **Testing Infrastructure**:
   - Set up Jest + React Testing Library for frontend
   - Configure Playwright for E2E tests
   - Add CI/CD pipelines
