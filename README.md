# Seer AI News Platform

A modern, responsive AI news aggregation platform built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

### Core Functionality
- **Landing Page** - Clean, modern design with compelling copy and clear CTAs
- **Onboarding Flow** - Multi-step personalization with role selection, industry preferences, and content types
- **Dashboard** - Horizontal scrolling story cards with full-width layout
- **Show All Stories** - Expandable view with advanced filtering (Source, Content Type, Industry, Category)
- **Chat Interface** - AI-powered chat with quick actions and conversation history
- **Saved Stories** - Collection-based organization with horizontal story cards
- **Profile Management** - Minimalist user settings and preferences

### Design System
- **Modern Typography** - Enhanced Inter font with OpenType features
- **Seer Brand Colors** - Teal (#39C0C8) primary color with consistent theming
- **Smooth Animations** - Fade-in effects, hover states, and micro-interactions
- **Responsive Layout** - Works seamlessly across desktop, tablet, and mobile
- **Glass Morphism** - Backdrop blur effects and modern card designs

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v3
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)

### Backend (Retrieval Agent)
- **Framework**: Python 3.11+ with FastAPI (planned)
- **AI/LLM**: Claude Sonnet 4.5, Claude Haiku 4.5
- **Search Providers**: Exa AI, Perplexity AI
- **Database**: Supabase (PostgreSQL + pgvector)
- **Data Validation**: Pydantic v2
- **Orchestration**: LangGraph (planned)

## 📦 Installation

1. **Extract the archive**:
   ```bash
   tar -xzf seer-platform-complete.tar.gz
   cd seer-platform
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   ```
   http://localhost:3000
   ```

## 🏗 Project Structure

```
seer-platform/
├── src/                         # Next.js frontend
│   ├── app/
│   │   ├── globals.css          # Global styles and Tailwind imports
│   │   ├── layout.tsx           # Root layout component
│   │   ├── page.tsx             # Landing page
│   │   ├── onboarding/
│   │   │   └── page.tsx         # Multi-step onboarding flow
│   │   ├── dashboard/
│   │   │   └── page.tsx         # Main dashboard with story cards
│   │   ├── chat/
│   │   │   └── page.tsx         # AI chat interface
│   │   ├── saved/
│   │   │   └── page.tsx         # Saved stories with collections
│   │   ├── profile/
│   │   │   └── page.tsx         # User profile settings
│   │   └── api/
│   │       ├── onboarding/      # Onboarding API routes
│   │       └── waitlist/        # Waitlist management
│   ├── components/              # Reusable React components
│   └── lib/                     # Utility functions and clients
├── retrieval-agent/            # Python backend service
│   ├── database/               # Supabase client and schema
│   ├── models/                 # Pydantic data models
│   ├── tools/                  # Search API integrations (Exa, Perplexity)
│   ├── ranking/                # Multi-stage ranking pipeline
│   ├── tests/                  # Comprehensive test suite
│   └── README.md               # Detailed backend documentation
├── specs/                      # Architecture specifications
│   ├── seer-retrieval-agent-architecture-v3.md
│   └── dynamic-onboarding-system-v2.md
├── public/                     # Static assets
├── package.json                # Frontend dependencies
├── tailwind.config.js         # Tailwind configuration
├── next.config.js             # Next.js configuration
└── tsconfig.json              # TypeScript configuration
```

## 🎨 Design System

### Colors
```css
/* Primary Brand Colors */
--seer-teal: #39C0C8
--seer-teal-hover: #2DA5AD
--seer-light-teal: #E6F7F8
--seer-dark-teal: #1A5F63

/* Slate Palette */
--slate-50: #F8FAFC
--slate-100: #F1F5F9
--slate-600: #475569
--slate-900: #0F172A
```

### Typography
- **Primary Font**: Inter with enhanced OpenType features
- **Monospace**: JetBrains Mono for code elements
- **Font Weights**: 300-900 for proper hierarchy

### Components
- **seer-btn-primary**: Primary action buttons
- **seer-btn-secondary**: Secondary action buttons  
- **seer-btn-ghost**: Subtle action buttons
- **seer-card**: Standard card component
- **seer-card-interactive**: Hoverable card component
- **seer-input**: Form input styling
- **seer-nav-item**: Navigation item styling
- **story-card-horizontal**: Horizontal story card layout

## 📱 Pages Overview

### Landing Page (`/`)
- Hero section with value proposition
- Feature highlights
- Call-to-action buttons
- Professional footer

### Onboarding (`/onboarding`)
- **Step 1**: Role selection (6 professional roles)
- **Step 2**: Industry preferences (multi-select)
- **Step 3**: Content type preferences (multi-select)
- Custom preferences input throughout
- Previous/Next navigation

### Dashboard (`/dashboard`)
- Personalized story feed
- Horizontal scrolling story cards
- Search and filter functionality
- "Show All Stories" with advanced filters
- Stats cards and trending indicators

### Chat (`/chat`)
- AI conversation interface
- Quick action sidebar
- Message history
- Professional chat design

### Saved Stories (`/saved`)
- Collection-based organization
- Same horizontal cards as dashboard
- Advanced search and filtering
- Create custom collections
- Notes and rating system

### Profile (`/profile`)
- User information management
- Notification preferences
- Account settings
- Activity statistics

## 🔧 Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Environment Setup
No environment variables required for basic functionality. All data is currently mocked for prototype purposes.

### Customization
- **Colors**: Update `tailwind.config.js` and `globals.css`
- **Typography**: Modify font imports in `layout.tsx`
- **Components**: Extend existing component classes in `globals.css`

## 🚀 Deployment

### Static Export
The project is configured for static export:

```bash
npm run build
```

This generates an `out/` directory with static files ready for deployment to any static hosting service.

### Deployment Platforms
- **Vercel**: Automatic deployment with Git integration
- **Netlify**: Drag-and-drop or Git-based deployment
- **AWS S3**: Static website hosting
- **GitHub Pages**: Free hosting for public repositories

## 📊 Data Integration & Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Onboarding  │  │   Dashboard  │  │    Profile   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Database                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  onboarding_profiles │ daily_briefs │ stories        │  │
│  │  brief_sections │ user_preferences │ retrieval_logs  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
          ▲                                        ▲
          │                                        │
┌─────────┴────────────────────────────────────────┴─────────┐
│              Python Retrieval Agent (Backend)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Search  │→ │ Normalize│→ │  Rank    │→ │Synthesize│  │
│  │(Exa+Perp)│  │& Dedupe  │  │Pipeline  │  │& Store   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Onboarding** → Next.js saves profile to Supabase
2. **Brief Generation** → Python agent:
   - Searches Exa + Perplexity in parallel
   - Normalizes and deduplicates results
   - Ranks using multi-stage pipeline
   - Enriches with AI tags and classifications
   - Organizes into personalized sections
   - Stores complete brief in Supabase
3. **Dashboard Display** → Next.js fetches brief from Supabase

### Story Data Structure

Stories are the atomic unit of content displayed in the UI:

```typescript
interface Story {
  // Core identity
  id: string
  title: string
  url: string
  summary: string                    // 1-2 sentence summary
  
  // Source metadata
  source_domain: string              // "techcrunch.com"
  source_display_name: string        // "TechCrunch" (UI-formatted)
  author?: string
  published_at?: string              // ISO 8601 datetime
  
  // AI enrichment
  content_type?: 'News' | 'Research' | 'Opinion' | 'Learning/Educational' | 
                 'Case Study' | 'Event Coverage' | 'Review/Benchmark' | 
                 'Interview/Profile' | 'Dataset/Resource' | 'Discussion' | 
                 'Regulatory/Policy'
  ai_tags: string[]                  // ["LLMs", "Claude", "Reasoning"]
  
  // Ranking metadata
  final_score: number                // Combined ranking score (0-100)
  rank: number                       // Position in ranking
  provider: 'exa' | 'perplexity'
  
  // User interaction
  user_id: string
  is_read: boolean
  is_saved: boolean
  user_rating?: number               // 1-5 stars
  user_notes?: string
  
  // Timestamps
  retrieved_at: string
  added_to_brief_at: string
}
```

### Daily Brief Structure

```typescript
interface DailyBrief {
  id: string
  user_id: string
  date: string                       // YYYY-MM-DD
  
  title: string                      // "Your Daily AI Brief - Nov 11, 2025"
  summary?: string                   // 2-4 sentence overview
  
  section_ids: string[]              // Ordered section IDs
  total_items: number                // Total story count
  
  top_topics: string[]               // ["LLMs", "AI Safety"]
  top_sources: string[]              // ["TechCrunch", "ArXiv"]
  
  whats_next?: {                     // AI-generated action items
    action_items: string[]           // 3-5 actionable bullets
    rationale?: string
    related_story_ids: string[]
  }
  
  status: 'draft' | 'generated' | 'viewed' | 'archived'
  
  generated_at: string
  viewed_at?: string
}

interface BriefSection {
  id: string
  daily_brief_id: string
  
  title: string                      // "Featured Stories"
  description?: string               // "Your top stories today"
  section_type: 'featured' | 'interest-based' | 'topic-based' | 
                'role-based' | 'trending'
  
  story_ids: string[]                // References to Story IDs
  order: number                      // Display order (1-based)
  
  topic_tags: string[]
  estimated_read_time?: number       // Minutes
  story_count: number
}
```

### Retrieval Agent Backend

The Python retrieval agent (`retrieval-agent/`) provides intelligent content discovery:

**Features**:
- ✅ Multi-provider search (Exa + Perplexity)
- ✅ Smart normalization and deduplication
- ✅ Multi-stage ranking pipeline (heuristics → RRF → LLM rerank → MMR)
- ✅ Domain authority scoring (450+ ranked sources)
- ✅ Recency-based boosting
- 🚧 AI enrichment (content classification, tag extraction)
- 🚧 Personalized section generation
- 🚧 "What's Next" action item synthesis

**Status**: Core infrastructure complete, LangGraph workflow in progress

**Documentation**: See [`retrieval-agent/README.md`](./retrieval-agent/README.md) for complete details

### API Integration Points

**Current** (Frontend only):
- Supabase direct client for onboarding profiles
- Mock data for story display

**Planned** (Full stack):
- Python FastAPI service for brief generation
- SSE streaming for real-time progress updates
- Webhook integration from onboarding completion
- Real-time brief updates via Supabase subscriptions

## 🎯 Roadmap

### ✅ Completed
- Modern, responsive Next.js frontend
- Complete onboarding flow with profile builder
- Supabase database integration
- Multi-provider search infrastructure (Exa + Perplexity)
- Sophisticated ranking pipeline with domain authority
- Complete data models and schemas
- Comprehensive test suite (45+ tests passing)

### 🚧 In Progress
- LangGraph agent workflow for brief generation
- FastAPI service with SSE streaming
- AI enrichment (content classification, tag extraction)
- Personalized section generation

### 📋 Planned
- LLM reranking with Claude
- MMR diversity selection
- Novelty filtering vs recent briefs
- Email digest generation
- Push notifications
- Advanced analytics dashboard
- A/B testing framework for ranking
- Multi-language support
- Social sharing features

## 📖 Additional Documentation

- **[Retrieval Agent README](./retrieval-agent/README.md)** - Complete backend documentation with API examples, data structures, and testing guide
- **[Architecture Specification](./specs/seer-retrieval-agent-architecture-v3.md)** - Detailed system architecture and implementation guide
- **[Onboarding System Spec](./specs/dynamic-onboarding-system-v2.md)** - Dynamic onboarding flow design
- **[Schema Verification](./retrieval-agent/SCHEMA_VERIFICATION.md)** - Database schema documentation
- **[Implementation Summary](./retrieval-agent/slices/IMPLEMENTATION_SUMMARY.md)** - Current implementation status

## 📄 License

This project is part of the Seer AI platform. All rights reserved.

## 🤝 Contributing

### Frontend Development
1. Follow the existing design system and component patterns
2. Use TypeScript interfaces that match backend Pydantic models
3. Test responsive design across all breakpoints
4. Maintain accessibility standards (WCAG 2.1)

### Backend Development
1. All code must pass `pytest` tests (`pytest -v`)
2. Follow Pydantic model patterns for type safety
3. Add tests for new features (aim for >80% coverage)
4. Document API changes in README
5. See `retrieval-agent/README.md` for backend-specific guidelines

## 📞 Support & Resources

### Documentation
- **Next.js**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs
- **Supabase**: https://supabase.com/docs
- **Pydantic**: https://docs.pydantic.dev
- **LangChain**: https://python.langchain.com/docs

### APIs & Services
- **Exa AI**: https://docs.exa.ai
- **Perplexity AI**: https://docs.perplexity.ai
- **Anthropic Claude**: https://docs.anthropic.com

---

## 🎯 Project Status

**Version**: 0.3.0 (Alpha)  
**Status**: Active Development  
**Last Updated**: November 11, 2025

**Current Focus**: Completing LangGraph agent workflow for automated daily brief generation

### Getting Started
1. **Frontend**: Run `npm install && npm run dev` in project root
2. **Backend**: See [`retrieval-agent/README.md`](./retrieval-agent/README.md) for setup instructions
3. **Database**: Apply schema from `retrieval-agent/database/schema.sql` to Supabase

---

**Built with ❤️ using Next.js, TypeScript, Python, and Claude AI**
