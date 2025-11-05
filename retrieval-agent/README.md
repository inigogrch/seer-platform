# Seer Retrieval Agent

AI-powered news aggregation system for tech professionals.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and add your API keys:
```bash
cp .env.example .env
```

3. Run tests:
```bash
pytest -m "not integration" -v
```

4. Run end-to-end test with real APIs:
```bash
python run_e2e_test.py
# Or with custom query:
python run_e2e_test.py --query "your search query" --verbose
```

## Development Status

**Current Slice**: ✅ Slice 1 Complete - Dual Search Provider Integration (Exa + Perplexity)

### Completed ✅
- [x] Project structure
- [x] Core data models (SearchResult, Document)
- [x] Exa client tests (10 tests)
- [x] Exa client implementation
- [x] Perplexity client tests (12 tests)
- [x] Perplexity client implementation
- [x] Logging utilities for API debugging
- [x] Normalization tests (15 tests)
- [x] Normalization implementation
- [x] Multi-provider integration tests (8 tests)

**Test Results**: 45/45 passing ✅ (+ 7 real API integration tests)

See [SEARCH_API_SUMMARY.md](./SEARCH_API_SUMMARY.md) for detailed documentation.

