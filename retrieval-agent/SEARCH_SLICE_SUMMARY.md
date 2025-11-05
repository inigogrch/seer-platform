# Search API Integration - Complete Summary

**Status**: All tests passing (45/45) ✅  
**Approach**: Test-Driven Development (TDD)  
**Last Updated**: January 5, 2025

---

## Overview

A production-ready dual-provider search integration for the Seer retrieval agent:

1. **Exa Search Client** - Neural semantic search
2. **Perplexity Search Client** - Ranked search from continuously refreshed index
3. **Data Models** - Pydantic schemas for SearchResult and Document
4. **Result Normalization** - Transform raw API responses into standardized documents
5. **Logging System** - Structured logging for debugging API calls
6. **Multi-Provider Pipeline** - Parallel execution with graceful degradation
7. **Complete Test Suite** - 45 comprehensive tests (+ 7 integration tests)

---

## Test Results Summary

```
✅ 45/45 unit tests passing (1.12s)
✅ 7 integration tests available (require API keys)
✅ 0 failures
✅ 52 total tests
```

### Test Breakdown by Component:

| Component | Tests | Status | Notes |
|-----------|-------|--------|-------|
| **Exa Client** | 10 | ✅ | Initialization, search, error handling |
| **Perplexity Client** | 12 | ✅ | Initialization, search, filters, scoring |
| **Normalization** | 15 | ✅ | Date parsing, domain extraction, truncation |
| **Integration Pipeline** | 8 | ✅ | Single/multi-provider, parallel, error handling |
| **Real API Tests** | 7 | ⚡ | Require API keys, run separately |

**Performance:**
- Unit tests: ~1.12s (25ms average)
- Test-to-code ratio: 1.7:1
- Normalization: 100 docs in <1s
- Parallel search: ~2x speedup vs sequential

---

## Project Structure

```
retrieval-agent/
├── models/
│   └── schemas.py              # SearchResult, Document, SearchProvider
├── tools/
│   ├── exa.py                  # Exa client (165 lines)
│   ├── perplexity.py           # Perplexity client (165 lines)
│   ├── normalize.py            # Normalization utilities (140 lines)
│   └── logger.py               # Logging utilities (75 lines)
├── tests/
│   ├── test_exa.py             # Exa tests (10)
│   ├── test_perplexity.py      # Perplexity tests (12)
│   ├── test_normalization.py   # Normalization tests (15)
│   └── test_integration.py     # Integration tests (8 + 7)
├── requirements.txt
├── pytest.ini
└── README.md
```

**Total:** ~545 lines of implementation, ~1,100 lines of tests

---

## Search Provider Comparison

| Feature | Exa | Perplexity |
|---------|-----|------------|
| **Search Type** | Neural semantic search | Ranked search from index |
| **Scores Provided** | ✅ Yes (0-1) | ❌ No (we assign rank-based) |
| **Recency Filter** | ✅ Days-based | ❌ Not in Search API |
| **Country Filter** | ❌ Not available | ✅ ISO 3166-1 alpha-2 |
| **Domain Filter** | ❌ Not available | ✅ Up to 20 domains |
| **Author Info** | ✅ Sometimes | ❌ Not provided |
| **Auto-prompt** | ✅ Available | N/A |
| **Content Field** | `text` | `snippet` |
| **Strengths** | Semantic understanding | Fresh content, broad coverage |

**Why Both?**
- **Diversity**: Different sources and perspectives
- **Redundancy**: Fallback if one provider fails
- **Speed**: Parallel execution reduces latency
- **Flexibility**: Use provider-specific features

---

## Key Features Implemented

### 1. Exa Search Client (`tools/exa.py`)

**Capabilities:**
- ✅ Initialize with API key (from env or parameter)
- ✅ Neural semantic search via Exa API
- ✅ Configurable result count (default: 10)
- ✅ Recency filtering (default: 7 days)
- ✅ Auto-prompt enhancement
- ✅ Error handling and graceful failures
- ✅ Async/await support

**Example:**
```python
from tools.exa import ExaClient

client = ExaClient()  # Loads EXA_API_KEY from env
results = await client.search(
    query="AI breakthroughs",
    num_results=10,
    days=7
)
```

### 2. Perplexity Search Client (`tools/perplexity.py`)

**Capabilities:**
- ✅ Initialize with API key (from env or parameter)
- ✅ Ranked search from Perplexity's index
- ✅ Configurable result count (1-20, default: 10)
- ✅ Country filtering (ISO codes)
- ✅ Domain filtering (up to 20 domains)
- ✅ Content extraction control (`max_tokens_per_page`)
- ✅ Rank-based scoring assignment
- ✅ Error handling and graceful failures
- ✅ Async/await support

**Example:**
```python
from tools.perplexity import PerplexityClient

client = PerplexityClient()  # Loads PERPLEXITY_SEARCH_API_KEY
results = await client.search(
    query="technology news",
    num_results=5,
    country="US",
    search_domain_filter=["techcrunch.com", "theverge.com"]
)
```

**Score Assignment:**
Since Perplexity doesn't provide relevance scores, we assign them based on rank:
```python
score = math.exp(-0.2 * (rank - 1))
# Results: 1.0, 0.82, 0.67, 0.55, 0.45, ...
```

### 3. Data Models (`models/schemas.py`)

**SearchResult** - Raw API response:
- `id`, `title`, `url`, `text`, `score`
- `published_date` (string), `author`
- `provider` (enum: EXA, PERPLEXITY)

**Document** - Normalized internal format:
- All SearchResult fields
- `published_at` (parsed datetime)
- `source_domain` (extracted string)
- `snippet` (≤1000 chars, optimized for embeddings)
- `embedding` (optional, for future ranking)

### 4. Normalization (`tools/normalize.py`)

**Functions:**
- `normalize_search_result()` - Convert single result
- `normalize_batch()` - Process list of results
- `extract_domain()` - Parse domain from URL
- `_parse_date()` - Handle multiple date formats
- `_truncate_text()` - Smart truncation at word boundaries

**Handles Edge Cases:**
- ✅ Missing dates → None
- ✅ Invalid URLs → "unknown" domain
- ✅ Long text → Truncate to 1000 chars with "..."
- ✅ Subdomains → Extract primary domain (blog.example.com → example.com)
- ✅ Multiple date formats (ISO 8601, simple dates, with/without time)

### 5. Logging System (`tools/logger.py`)

**Features:**
- ✅ Structured logging for all API calls
- ✅ Request parameter logging (DEBUG level)
- ✅ Response summary with timing
- ✅ Sample result preview
- ✅ Error context logging

**Example Output:**
```
2025-01-05 10:30:15 - INFO - 🔵 Perplexity API Request: search.create
2025-01-05 10:30:15 - DEBUG -    Parameters: {
  "query": "AI breakthroughs",
  "max_results": 5
}
2025-01-05 10:30:16 - INFO - 🟢 Perplexity API Response: search.create (847ms)
2025-01-05 10:30:16 - DEBUG -    Result count: 5
2025-01-05 10:30:16 - DEBUG -    Sample result:
2025-01-05 10:30:16 - DEBUG -       Title: AI Breakthrough 2024...
```

---

## Multi-Provider Integration

### Parallel Search Pattern

```python
import asyncio
from tools.exa import ExaClient
from tools.perplexity import PerplexityClient
from tools.normalize import normalize_batch

# Initialize clients
exa_client = ExaClient()
perplexity_client = PerplexityClient()

# Execute in parallel
query = "AI breakthroughs"
exa_task = exa_client.search(query=query, num_results=5, days=7)
perplexity_task = perplexity_client.search(query=query, num_results=5)

exa_results, perplexity_results = await asyncio.gather(
    exa_task,
    perplexity_task,
    return_exceptions=True  # Graceful degradation
)

# Handle errors
all_results = []
if not isinstance(exa_results, Exception):
    all_results.extend(exa_results)
if not isinstance(perplexity_results, Exception):
    all_results.extend(perplexity_results)

# Normalize combined results
documents = normalize_batch(all_results)
# Now have up to 10 documents from 2 providers!
```

**Benefits:**
- ⚡ **~2x faster** than sequential execution
- 🛡️ **Resilient** to single provider failures
- 🎯 **Diverse** content from different sources
- 📊 **Richer** results with complementary strengths

---

## Running Tests

### Quick Summary
```bash
cd retrieval-agent
pytest -m "not integration" -q
# 45 passed in 1.12s
```

### Verbose Output
```bash
pytest -m "not integration" -v
# Shows all test names and status
```

### Specific Components
```bash
pytest tests/test_exa.py -v           # Exa client (10 tests)
pytest tests/test_perplexity.py -v    # Perplexity client (12 tests)
pytest tests/test_normalization.py -v # Normalization (15 tests)
pytest tests/test_integration.py -v   # Integration (8 tests)
```

### Real API Integration Tests
```bash
# Requires API keys in environment
export EXA_API_KEY=your_exa_key
export PERPLEXITY_SEARCH_API_KEY=your_perplexity_key

pytest -m integration -v -s
# 7 tests with detailed logging
```

### Watch Mode (Development)
```bash
pytest-watch -- -m "not integration"
# Automatically reruns tests on file changes
```

### End-to-End Test Script

We provide a comprehensive E2E test script that demonstrates the full pipeline:

```bash
# Basic usage (requires API keys in .env.local)
python run_e2e_test.py

# Custom query
python run_e2e_test.py --query "machine learning advances"

# Verbose output (shows all results)
python run_e2e_test.py --verbose

# Fewer results
python run_e2e_test.py --num-results 3
```

**What it tests:**
- ✅ API key loading from `.env.local`
- ✅ Both provider initialization
- ✅ Parallel search execution
- ✅ Result normalization
- ✅ Error handling (graceful degradation)
- ✅ Performance metrics
- ✅ Result analysis (provider distribution, dates, domains, scores)

**Example output:**
```
🚀 SEER SEARCH API - END-TO-END TEST

📦 Step 1: Initialize Search Providers
✅ Exa client initialized
✅ Perplexity client initialized

🔍 Step 2: Execute Parallel Searches
Query: 'artificial intelligence breakthroughs 2024'
✅ Exa returned 3 results
✅ Perplexity returned 3 results
⚡ Parallel execution completed in 1.22s

📄 Step 3: Normalize Results
✅ Normalized 6 documents

📊 Step 4: Result Analysis
Provider Distribution:
  EXA: 3 documents (50.0%)
  PERPLEXITY: 3 documents (50.0%)

✅ END-TO-END TEST COMPLETE
```

---

## TDD Approach Validation

We followed strict Test-Driven Development for all components:

1. **RED**: Write failing tests first
2. **GREEN**: Implement minimum code to pass tests
3. **REFACTOR**: Clean up implementation

**Benefits Observed:**
- ✅ Clear requirements from tests
- ✅ High confidence in code correctness
- ✅ Easy to refactor (tests catch regressions)
- ✅ Documentation through test examples
- ✅ Fast feedback loop (~1s)
- ✅ Zero regressions when adding Perplexity

**Example TDD Cycle:**
1. Write `test_search_with_country_filter()` → FAIL ❌
2. Implement `country` parameter in `PerplexityClient.search()` → PASS ✅
3. Refactor parameter handling → STILL PASS ✅

---

## API Key Setup

Our implementation automatically loads API keys from `.env` files using `python-dotenv`. It searches in this order:

1. `retrieval-agent/.env` (local to Python service)
2. `../.env.local` (root folder, Next.js convention)
3. System environment variables (fallback)

### Option 1: Root .env.local (Recommended for Development)
```bash
# In seer-platform/.env.local (already exists for Next.js)
EXA_API_KEY=your_exa_key
PERPLEXITY_SEARCH_API_KEY=your_perplexity_key
```
✅ **This works automatically** - no `export` needed!

### Option 2: Python Service .env
```bash
# In retrieval-agent/.env
EXA_API_KEY=your_exa_key
PERPLEXITY_SEARCH_API_KEY=your_perplexity_key
```

### Option 3: System Environment Variables
```bash
# In your shell (temporary, for testing)
export EXA_API_KEY=your_exa_key
export PERPLEXITY_SEARCH_API_KEY=your_perplexity_key
```

### Option 4: Direct in Code
```python
exa_client = ExaClient(api_key="your_exa_key")
perplexity_client = PerplexityClient(api_key="your_perplexity_key")
```

### Production Deployment

**Vercel (Next.js):**
- Add environment variables in Vercel dashboard
- They're automatically injected at runtime

**Python Service (Railway/Render/Fly.io):**
- Add environment variables in your platform's dashboard
- Each platform has its own env var system
- The Python service runs separately from Next.js

**Architecture:**
```
┌─────────────────┐         ┌──────────────────┐
│  Next.js (Vercel) │ ─────▶ │ Python (Railway) │
│  NEXT_PUBLIC_*   │         │ EXA_API_KEY     │
│  SUPABASE_*      │         │ PERPLEXITY_*    │
└─────────────────┘         └──────────────────┘
```

Both services use their hosting platform's environment variables - no shared `.env` file in production!

---

## Dependencies

```
# Core
pydantic==2.5.0          # Data validation
exa-py==1.0.9            # Exa API client
perplexityai==0.1.1      # Perplexity SDK
httpx==0.25.2            # HTTP client
python-dotenv==1.0.0     # Environment variables

# Testing
pytest==7.4.3            # Testing framework
pytest-asyncio==0.21.1   # Async test support
pytest-mock==3.12.0      # Mocking utilities
```

---

## What's NOT Included (Future Slices)

This is search integration only. Not yet implemented:

- ❌ Ranking pipeline (heuristics, RRF, LLM rerank, MMR)
- ❌ URL deduplication (same article from both providers)
- ❌ LangGraph workflow
- ❌ Database integration (Supabase)
- ❌ FastAPI endpoints
- ❌ SSE streaming
- ❌ Frontend integration
- ❌ Embeddings generation

---

## Next Steps

**Recommended Next Slice:** Simple Ranking + Deduplication

### Why Ranking Next?
1. **Builds on what we have** - Uses existing search results
2. **Adds immediate value** - Better result quality
3. **No new external dependencies** - Pure logic
4. **Still testable with TDD** - Clear success criteria

### Slice 2 Options:

**Option 1: Simple Ranking (Recommended)**
- Heuristic scoring (recency, domain authority, profile match)
- RRF fusion for multi-provider results
- URL deduplication
- Top-K selection

**Option 2: FastAPI Endpoint**
- Expose search via HTTP
- Request/response models
- CORS configuration
- Error handling

**Option 3: Database Storage**
- Store search results in Supabase
- Cache management
- Historical tracking

---

## Validation Checklist

- ✅ All tests pass (45/45)
- ✅ No linter errors
- ✅ Following architecture spec data models
- ✅ TDD approach demonstrated throughout
- ✅ Documentation complete
- ✅ Error handling robust
- ✅ Edge cases covered
- ✅ Performance acceptable (<2s for 100 docs)
- ✅ Logging implemented
- ✅ Multi-provider integration working
- ✅ Real API tests available
- ✅ Ready for next slice

---

## Key Metrics

**Code:**
- Implementation: ~545 lines
- Tests: ~1,100 lines
- Test/Code Ratio: **1.7:1** (excellent)

**Performance:**
- Unit test execution: **1.12s** (fast)
- Parallel search: **~1.2s** (2x speedup)
- Normalization (100 docs): **<1s**

**Test Coverage:**
- Exa client: **10 tests**
- Perplexity client: **12 tests**
- Normalization: **15 tests**
- Integration: **8 tests** (+ 7 real API)
- Total: **45 unit tests** + 7 integration

---

## Learnings & Notes

**What Went Well:**
1. TDD forced clear thinking about interfaces before implementation
2. Comprehensive tests caught edge cases early (date parsing, domain extraction)
3. Pydantic models prevented data errors at runtime
4. Async/await pattern works smoothly with both SDKs
5. Parallel execution was easy to implement and test
6. Logging made debugging real API calls trivial

**Key Decisions:**
- Used Pydantic v2 (`model_config` instead of `Config`)
- Chose 1000 char snippet limit (optimized for embeddings/ranking)
- Extract primary domain only (no subdomain in `source_domain`)
- Default 7 day recency filter for Exa
- Exponential decay scoring for Perplexity (since they don't provide scores)
- Graceful degradation with `return_exceptions=True` in `asyncio.gather()`

**Improvements for Next Slice:**
1. ✅ Add logging (done!)
2. ⏭️ Add result deduplication (URL-based)
3. ⏭️ Implement ranking pipeline
4. ⏭️ Consider caching layer for repeated searches
5. ⏭️ Add telemetry/metrics

---

## Example: Real Multi-Provider Search

```bash
$ pytest tests/test_integration.py::TestRealMultiProviderIntegration -v -s

🔍 REAL MULTI-PROVIDER SEARCH TEST
Query: 'artificial intelligence breakthroughs 2024'
Requesting 5 results from each provider...

2025-01-05 10:35:21 - INFO - 🔵 Exa API Request
2025-01-05 10:35:21 - INFO - 🔵 Perplexity API Request
2025-01-05 10:35:22 - INFO - 🟢 Exa Response (892ms)
2025-01-05 10:35:22 - INFO - 🟢 Perplexity Response (734ms)

⚡ Parallel search completed in 0.95s

✅ Exa returned 5 results
✅ Perplexity returned 5 results

📊 Combined: 10 total results
📄 Normalized: 10 documents

Provider Distribution:
  exa: 5 documents
  perplexity: 5 documents

PASSED
```

---

## CI/CD Ready

The test suite is production-ready:

✅ **Fast execution** - Unit tests <2s  
✅ **No flakiness** - Deterministic with mocks  
✅ **Isolated** - No external deps for unit tests  
✅ **Configurable** - Integration tests skippable  
✅ **Verbose logging** - Easy debugging  

**Example GitHub Actions:**
```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2
    - name: Install dependencies
      run: pip install -r requirements.txt
    - name: Run tests
      run: pytest -m "not integration" -v
```

---

**🎯 Search API Integration Complete!**

We now have a robust, well-tested foundation with:
- ✅ 2 search providers (Exa + Perplexity)
- ✅ 45 passing tests (1.7:1 test ratio)
- ✅ Full logging and observability
- ✅ Parallel execution with graceful degradation
- ✅ Production-ready error handling
- ✅ Ready for ranking pipeline

