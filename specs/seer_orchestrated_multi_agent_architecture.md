# Seer — Orchestrated Multi‑Agent Architecture

Below are pragmatic, implementation‑ready diagrams for how a single **Retrieval Orchestrator** coordinates gateway tools and (when needed) separate agents. It also highlights **communication patterns** and **where to add reflexion** to optimize the final brief.

---

## 1) High‑Level Component View

```mermaid
flowchart LR
  subgraph Client[Client Apps]
    UI[Web UI]
  end

  subgraph API[FastAPI]
    Runs[Runs API]
    Events[SSE/WebSocket]
  end

  subgraph Orchestrator["Retrieval Orchestrator (LangGraph)"]
    Plan[Query Planner]
    Search[Search Gateway]
    Fetch[Fetch/Parse Gateway]
    Dedup[Dedup/Normalize]
    Rank[Ranker]
    Summ[Summarizer]
    Compose[Composer]
    QA[Reflexion/QA]
    Persist[Persistence]
  end

  subgraph AGENTS["Optional Split Agents"]
    Acq["Acquisition Agent: connectors, feeds, crawling"]
    SumA["Summarization Agent: batch LLM work"]
    PersA["Personalization/Scoring Agent"]
    DelA["Delivery Agent"]
  end

  subgraph Data[Data Layer]
    DB[(Postgres + pgvector)]
    Obj[(Object Storage)]
    Cache[(Redis Cache)]
    Q[(Queue/Topics)]
  end

  subgraph Obs[Observability]
    Logs[[Structured Logs]]
    Traces[[Traces/Spans]]
    Metrics[[SLIs/KPIs]]
  end

  UI -->|Start Run| Runs
  Runs --> Plan
  Plan --> Search
  Search --> Fetch
  Fetch --> Dedup --> Rank --> Summ --> Compose --> QA --> Persist

  Orchestrator <-->|enqueue/dequeue| Q
  Acq <-->|produce docs| Q
  SumA <-->|consume jobs| Q
  PersA <-->|update weights| DB
  DelA -->|deliver brief| UI

  Search --> DB
  Fetch --> Obj
  Persist --> DB
  Orchestrator --> Cache

  Orchestrator -.-> Logs
  Orchestrator -.-> Traces
  Orchestrator -.-> Metrics
  AGENTS -.-> Logs
  AGENTS -.-> Traces
  AGENTS -.-> Metrics

  Runs --> Events
  Events --> UI
```

**Notes**
- Begin **single‑agent** (Orchestrator using gateway tools). Promote a gateway tool to a separate agent when cadence/scale/SLA diverge.
- All components emit logs/traces/metrics with **correlation IDs**.

---

## 2) Control Flow (Happy Path)

```mermaid
sequenceDiagram
  autonumber
  participant U as Web UI
  participant API as FastAPI
  participant OR as Orchestrator (LangGraph)
  participant S as Search Gateway
  participant F as Fetch/Parse Gateway
  participant R as Ranker
  participant SM as Summarizer
  participant CP as Composer
  participant QA as Reflexion/QA
  participant DB as Postgres/pgvector
  participant OBJ as Object Storage

  U->>API: POST /runs (profile, topics)
  API->>OR: start(run_id, state)
  OR->>S: plan+search(queries)
  S-->>OR: results (URLs + snippets)
  OR->>F: fetch(parse_urls)
  F->>OBJ: store raw/parsed blobs
  F-->>OR: parsed docs (ids, text, meta)
  OR->>OR: dedup/normalize
  OR->>R: rank(features)
  R-->>OR: ranked list + scores
  OR->>SM: summarize(topN)
  SM-->>OR: structured summaries
  OR->>CP: compose(sections/rows)
  CP-->>OR: brief draft
  OR->>QA: reflexion(pass: factuality, coverage, style)
  QA-->>OR: corrections/suggestions
  OR->>DB: persist(brief, docs, scores)
  OR-->>API: run complete (artifact ids)
  API-->>U: stream status + final brief
```

---

## 3) Communication Patterns (Contracts & Transport)

```mermaid
flowchart TB
  subgraph Sync[Sync Calls]
    HTTP[HTTP/JSON]
    SDK[(Local Tool Calls)]
  end
  subgraph Async[Async]
    Queue[Queue/Topic]
    Webhook[Webhook Callback]
  end

  HTTP --- SDK
  Queue --- Webhook
```

**Guidelines**
- **Gateway tools (same process):** call as local functions/SDK to minimize latency.
- **Split agents (separate services):** use **queues** for fan‑out/fault isolation and optional **webhooks** to notify completion.
- **All calls:** include `run_id`, `idempotency_key`, `correlation_id`, `version`.

**Canonical messages**
- `SearchRequest{ run_id, queries[], provider_policy, budget }`
- `ParsedDoc{ doc_id, url, text, meta{source, date, domain_score}, hash }`
- `RankedDoc{ doc_id, score, features{recency, authority, novelty, user_fit} }`
- `Summary{ doc_id, sections[], citations[], cost }`
- `Brief{ run_id, rows[], stats, prompt_version, ranker_version }`

---

## 4) Where Reflexion Adds Real Value

```mermaid
flowchart LR
  A[Ranked Docs] --> B((Reflexion: Coverage & Novelty Checks)) --> C[Augment Plan]
  C --> D[Re‑query / Fetch Missing Angles]
  D --> E[Summaries]
  E --> F((Reflexion: Factuality & Consistency)) --> G[Corrections]
  G --> H[Compose Brief]
  H --> I((Reflexion: Style & Personalization)) --> J[Final Brief]
```

**Reflexion patterns (drop‑in, low risk):**
1. **Coverage Reflexion (post‑rank)**
   - Detect gaps vs. user profile & topic map (e.g., missing vendor updates/research).
   - Trigger micro‑requeries with tight budgets.
2. **Factuality/Consistency Reflexion (post‑summary)**
   - Ask a verifier to cross‑check claims against source passages; flag low‑confidence spans.
3. **Style/Personalization Reflexion (post‑compose)**
   - Ensure tone, length, and “So‑What/Action” frames match user prefs.

**Controls**
- Cap reflexion passes (e.g., max 2) and enforce **token/time budgets**.
- Persist reflexion outcomes for **learning‑to‑rank** and future routing.

---

## 5) Deployment Topology

```mermaid
flowchart LR
  subgraph Edge[Frontend]
    NextJS[Next.js App]
  end
  subgraph API[Backend]
    FastAPI[FastAPI + Uvicorn]
    Orchestrator[(LangGraph Runtime)]
  end
  subgraph Workers[Workers / Agents]
    AcqW[Acquisition Worker]
    SumW[Summarization Worker]
  end
  subgraph Infra[Infra]
    Pg[(Postgres + pgvector)]
    Redis[(Redis)]
    S3[(Object Storage)]
    MQ[(Queue/Topic)]
    OTEL[(Observability Stack)]
  end

  NextJS --> FastAPI --> Orchestrator
  Orchestrator <---> Pg
  Orchestrator <---> Redis
  Orchestrator --> MQ
  AcqW <---> MQ
  SumW <---> MQ
  AcqW --> S3
  Orchestrator --> OTEL
  AcqW --> OTEL
  SumW --> OTEL
```

---

## 6) Orchestrator Graph (with Reflexion Nodes)

```mermaid
flowchart TD
  Start([Start Run]) --> Plan[Plan Queries]
  Plan --> Search[Search]
  Search --> Fetch[Fetch & Parse]
  Fetch --> Dedup[Dedup/Normalize]
  Dedup --> Rank[Rank]
  Rank --> CovReflexion{{Coverage Reflexion}}
  CovReflexion -->|gap found| MicroSearch[Micro‑Search]
  MicroSearch --> Fetch
  CovReflexion -->|ok| Summ[Summarize]
  Summ --> FactReflexion{{Factuality/Consistency Reflexion}}
  FactReflexion -->|fixes| Summ
  FactReflexion --> Compose[Compose Brief]
  Compose --> StyleReflexion{{Style/Personalization Reflexion}}
  StyleReflexion -->|tweak| Compose
  StyleReflexion --> Persist[Persist + Emit]
  Persist --> Done([Done])
```

**Budgets**
- `max_docs`, `max_tokens`, `max_latency_ms` per node; abort or degrade gracefully when exceeded.

---

## 7) KPIs & Guardrails (operationalizing quality)

- **Coverage:** % of key sources/topics touched; **Novelty:** % new vs. previously seen.
- **Latency:** P95 per node and end‑to‑end; **Cost per brief**.
- **Accuracy:** verifier pass‑rate; number of corrections applied.
- **Engagement:** CTR, saves, follow‑ups from the brief.
- **Stability:** error rate by provider; retry counts; circuit breaker trips.

---

## 8) Implementation Tips

- Keep orchestrator logic deterministic; put branching/timeouts/retries in the graph file.
- All integrations live behind `services/*` with **timeouts, retries, redaction**.
- Use **idempotency keys** across DB writes and async jobs.
- Persist all artifacts (docs, features, drafts, final brief) for traceability and learning.
- Version prompts, rankers, and state schemas; roll out behind feature flags.

---

**Outcome:** A minimal‑to‑scalable architecture—start with one orchestrator + gateway tools, then peel off Acquisition/Summarization as dedicated agents when data cadence or compute profile demands it, with reflexion nodes inserted where they deliver maximum lift for brief quality without runaway costs.

