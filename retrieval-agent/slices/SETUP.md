# 🚀 Setup Guide - Data Layer Implementation

## Installation

### 1. Install Python Dependencies

```bash
cd /Users/benjogerochi/seer-platform/retrieval-agent
pip install -r requirements.txt
```

**Key packages**:
- `supabase>=2.0.0` - Supabase Python client
- `pydantic>=2.0.0` - Data validation
- `python-dotenv>=1.0.0` - Environment variables

### 2. Configure Environment Variables

Ensure these are set in `/Users/benjogerochi/seer-platform/.env.local`:

```bash
# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Search API keys
EXA_API_KEY=your_exa_key
PERPLEXITY_SEARCH_API_KEY=your_perplexity_key
```

### 3. Deploy Database Schema

**Option A: Via Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy contents of `database/schema.sql`
4. Execute the SQL

**Option B: Via CLI**
```bash
psql $NEXT_PUBLIC_SUPABASE_URL < database/schema.sql
```

### 4. Verify Setup

```python
# Test connection
from database import SupabaseClient

client = SupabaseClient()
print("✅ Supabase client initialized successfully!")

# Test query
prefs = await client.get_user_preferences("test_user")
print(f"✅ Database query successful: {prefs}")
```

### 5. Run Tests

```bash
# Run all tests
pytest tests/test_database.py -v

# Run specific test class
pytest tests/test_database.py::TestDataTransformations -v

# Run with coverage
pytest tests/test_database.py --cov=database --cov-report=html
```

---

## Quick Start Example

```python
import asyncio
from datetime import datetime, date
from database import SupabaseClient
from database.utils import format_source_display_name, truncate_summary
from models.schemas import Story, BriefSection, DailyBrief, ContentType, SearchProvider

async def create_sample_brief():
    client = SupabaseClient()
    user_id = "your_user_id"
    
    # 1. Create stories
    story = Story(
        id="https://anthropic.com/news/claude-3-family",
        title="Introducing Claude 3",
        url="https://anthropic.com/news/claude-3-family",
        summary="Anthropic announces Claude 3 model family...",
        source_domain="anthropic.com",
        source_display_name=format_source_display_name("anthropic.com"),
        published_at=datetime.now(),
        content_type=ContentType.NEWS,
        ai_tags=["LLMs", "Claude", "Anthropic"],
        final_score=88.5,
        rank=1,
        provider=SearchProvider.PERPLEXITY,
        raw_score=0.82,
        user_id=user_id,
        retrieved_at=datetime.now(),
        added_to_brief_at=datetime.now()
    )
    
    story_id = await client.create_story(story)
    print(f"✅ Created story: {story_id}")
    
    # 2. Create daily brief
    brief = DailyBrief(
        id=str(uuid.uuid4()),
        user_id=user_id,
        date=date.today(),
        title=f"Your Daily AI Brief - {date.today().strftime('%B %d, %Y')}",
        summary="Today's brief focuses on LLM advancements...",
        section_ids=[],
        total_items=1,
        top_topics=["LLMs", "Claude"],
        top_sources=["Anthropic"],
        whats_next={
            "action_items": [
                "Review Claude 3 capabilities for your project"
            ],
            "rationale": "Based on your interest in LLMs"
        },
        status="generated"
    )
    
    brief_id = await client.create_daily_brief(brief)
    print(f"✅ Created brief: {brief_id}")
    
    # 3. Mark story as read
    await client.update_story_interaction(
        story_id=story.id,
        user_id=user_id,
        is_read=True
    )
    print(f"✅ Marked story as read")

asyncio.run(create_sample_brief())
```

---

## Troubleshooting

### Issue: `ModuleNotFoundError: No module named 'supabase'`
**Solution**: Install dependencies
```bash
pip install supabase>=2.0.0
```

### Issue: `ValueError: Supabase URL must be provided`
**Solution**: Check environment variables
```bash
echo $NEXT_PUBLIC_SUPABASE_URL
# Should output your Supabase URL
```

### Issue: Database schema errors
**Solution**: Drop and recreate tables
```sql
DROP TABLE IF EXISTS stories CASCADE;
DROP TABLE IF EXISTS brief_sections CASCADE;
DROP TABLE IF EXISTS daily_briefs CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS retrieval_logs CASCADE;

-- Then run schema.sql again
```

---

## Next Steps

1. **Install dependencies**: `pip install -r requirements.txt`
2. **Deploy schema**: Run `database/schema.sql` in Supabase
3. **Test connection**: Run verification script above
4. **Implement enrichment agent**: Add AI classification for `content_type` and `ai_tags`
5. **Implement "What's Next" generation**: Add LLM call to synthesize action items
6. **Build LangGraph workflow**: Connect all the pieces together

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────┐
│  API Layer (exa.py, perplexity.py)                     │
│  → SearchResult                                         │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│  Normalization Layer (normalize.py)                     │
│  → Document (dates parsed, domains extracted)           │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│  Ranking Layer (heuristics.py)                          │
│  → RankedDoc (scored, ranked)                           │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│  Enrichment Layer [TO IMPLEMENT - LLM Agent]            │
│  → Story (+ content_type, ai_tags)                      │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│  Organization Layer [TO IMPLEMENT - LLM Agent]          │
│  → BriefSection (personalized groupings)                │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│  Composition Layer [TO IMPLEMENT - LLM Agent]           │
│  → DailyBrief (complete with "What's Next")             │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│  Storage Layer (supabase_client.py) ✅ COMPLETE         │
│  → Supabase Database                                    │
└─────────────────────────────────────────────────────────┘
```

**Status**: ✅ Data layer complete, ready for agent integration!

