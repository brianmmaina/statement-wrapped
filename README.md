# StatementWrapped - https://statement-wrapped.vercel.app/ 

> Turn any bank statement into an AI-powered spending analysis — no login, no bank connection required.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit-2563EB?style=flat-square)](INSERT_DEPLOYED_URL_HERE)
[![Stack](https://img.shields.io/badge/Stack-FastAPI%20%7C%20PostgreSQL%20%7C%20Redis%20%7C%20Docker-1A1A1A?style=flat-square)]()
[![License](https://img.shields.io/badge/License-MIT-059669?style=flat-square)]()

![StatementWrapped Demo](docs/screenshots/demo.png)

## The Problem

Most spending analysis tools require OAuth access or bank credentials — a friction point that prevents many users from getting a quick financial overview. StatementWrapped takes a different approach: use the CSV export your bank already provides, upload it directly, and get a categorized analysis in seconds without connecting any accounts.

The challenge is that every bank exports CSV files in a different schema, with different column names, date formats, and amount conventions. StatementWrapped solves this with a bank-specific normalization pipeline that produces a unified transaction schema regardless of the source, then uses an LLM to categorize each transaction and generate a plain-English spending summary.

## How It Works

**Stage 1 — Ingestion and Normalization.** The system accepts CSV exports from Chase, Bank of America, Apple Card, and Wells Fargo via `POST /ingest`. Each bank uses a different column schema, date format, and amount convention — Chase uses `Posting Date` and signed amounts, Apple Card uses `Transaction Date` and always-positive amounts with a separate transaction type column, and so on. A format-specific parser routes each upload through the correct normalization transformer via `parse_file(bank_type, content)`, producing a unified `NormalizedTransaction` schema with consistent `date`, `amount`, `merchant`, and `raw_description` fields regardless of the source bank. Invalid files, unrecognized columns, and malformed amounts return a descriptive 400 error.

**Stage 2 — LLM-Powered Categorization.** Normalized transactions are passed to the OpenAI API in a single batched request via `categorize_transactions()` — not one call per transaction — to minimize latency and API cost. The prompt instructs the model to return a JSON array of category slugs in the same order as the input transactions, selecting from nine predefined categories: income, dining, groceries, transport, subscriptions, entertainment, shopping, utilities, and other. On API failure or malformed response, every transaction falls back to the "other" category so the ingest flow never crashes. The returned slugs are mapped to `category_id` values and stored with each `Transaction` record.

**Stage 3 — Analysis, Caching, and Response.** After transactions are stored, the system builds a full analysis response — spending totals by category, transaction count, and an AI-generated plain-English summary via `generate_spending_summary()` — and caches it in Redis under the key `analysis:{statement_id}` with a TTL of 3600 seconds. `GET /analysis/{statement_id}` checks the Redis cache first; on a hit, the cached response is returned directly. On a miss, the analysis is rebuilt from PostgreSQL, cached, and returned. This eliminates redundant database queries and LLM calls for repeat fetches of the same statement.

## Architecture

```
POST /ingest
     │
     ▼
Format Detection → Bank-Specific Parser → NormalizedTransaction
     │
     ▼
OpenAI Batch Categorization (fallback: "other")
     │
     ▼
PostgreSQL  ←──  Statement + Transaction records
     │
     ▼
Build Analysis Response
     │
     ▼
Redis Cache  (key: analysis:{statement_id}, TTL: 3600s)
     │
     ▼
API Response

GET /analysis/{statement_id}
     │
     ├── Redis HIT  →  Return cached response
     │
     └── Redis MISS  →  Query PostgreSQL  →  Cache  →  Return response
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a full component map and data flow walkthrough.
See [DECISIONS.md](./DECISIONS.md) for the reasoning behind key technical choices.

## Technical Decisions

**FastAPI over Flask or Django.** FastAPI's async request handling is necessary for an ingest pipeline that makes sequential calls to PostgreSQL and the OpenAI API in a single request. Pydantic schema validation catches malformed transaction data before it reaches the database, and the automatic OpenAPI documentation at `/docs` is useful for development and reviewer walkthroughs without any additional configuration.

**Redis for analysis caching.** The ingest pipeline is expensive — it involves CSV parsing, an LLM API call, and multiple database writes. Caching the final analysis response under `analysis:{statement_id}` with a 3600-second TTL means repeat fetches return in under 5ms rather than re-executing the full pipeline. The TTL is set to one hour to balance freshness with performance; in a production system with user accounts, cache invalidation on profile updates would also be required.

**PostgreSQL over a document store.** Transaction data has relational structure that benefits from joins, indexing, and ACID compliance. The `Statement → Transaction → Category` schema allows efficient filtering by date range, category, and bank type. A document store would simplify schema changes but at the cost of query reliability on the analytical read paths that the `/transactions` and `/analysis` endpoints depend on.

## Tech Stack

| Technology | Role |
|---|---|
| FastAPI ≥0.109 | API framework, async request handling, automatic OpenAPI docs |
| PostgreSQL | Primary data store for statements, transactions, and categories |
| Redis ≥5.0 | Analysis response cache with TTL-based invalidation |
| Docker / Docker Compose | Containerized local development and production deployment |
| OpenAI API | Batch transaction categorization and spending summary generation |
| SQLAlchemy ≥2.0 | ORM for database models and query construction |
| Alembic ≥1.13 | Database schema migrations |
| React 18 + TypeScript 5.6 | Frontend SPA with four-page routing |
| Recharts 2.13 | Category bar chart and donut chart visualization |
| Framer Motion 11 | Page transitions and analysis entrance animations |
| Vite 5 | Frontend build tool and development server with API proxy |

## Getting Started

**Prerequisites:** Docker and Docker Compose. Python 3.11+. Node.js 18+.

**1. Clone the repository**
```bash
git clone https://github.com/brianmmaina/statementwrapped
cd statementwrapped
```

**2. Configure environment variables**
```bash
cp .env.example .env
```

Open `.env` and set the following values:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string. Use `postgresql+asyncpg://` for async SQLAlchemy. Default for Docker: `postgresql+asyncpg://statementwrapped:statementwrapped@postgres:5432/statementwrapped` |
| `REDIS_URL` | Redis connection URL for health check and analysis caching. Default for Docker: `redis://redis:6379/0` |
| `API_KEY` | Optional. When set, requires `X-API-Key` header on all non-docs requests. Leave unset to disable. |
| `OPENAI_API_KEY` | Required for LLM transaction categorization. Obtain from https://platform.openai.com/api-keys |
| `CORS_ORIGINS` | Optional. Comma-separated CORS origins for production (e.g. `https://statementwrapped.vercel.app`). Required when deploying frontend to a different domain than the API. |

**3. Start the stack**
```bash
docker compose up --build
```

**4. Run database migrations**
```bash
docker compose exec api alembic upgrade head
```

**5. Verify the service is running**
```bash
curl http://localhost:8000/health
# Expected: {"status":"ok","database":"ok","redis":"ok","openai_configured":true}
```

The API is running at `http://localhost:8000`.
Interactive documentation is available at `http://localhost:8000/docs`.
The frontend is running at `http://localhost:5173`.

## API Reference

**GET /health**
Returns the operational status of the API, database, Redis, and OpenAI configuration.
```
Response: {
  "status": "ok",
  "database": "ok",
  "redis": "ok",
  "openai_configured": true
}
```

**POST /ingest**
Upload a bank statement CSV for parsing, categorization, and analysis. Returns the statement ID for subsequent analysis retrieval.
```
Request:  multipart/form-data
          file: <csv file>
          bank_type: "chase" | "boa" | "apple_card" | "wells_fargo"

Response: {
  "statement_id": 1,
  "transaction_count": 5,
  "filename": "statement.csv",
  "bank_type": "chase"
}
```

**GET /analysis/{statement_id}**
Retrieve the full spending analysis for an uploaded statement. Returns cached result if available. Response includes `X-Cache: HIT` or `X-Cache: MISS` header.
```
Request:  statement_id (path parameter, integer)

Response: {
  "statement_id": 1,
  "filename": "statement.csv",
  "bank_type": "chase",
  "transaction_count": 5,
  "transactions": [
    {
      "id": 1,
      "date": "2024-01-15",
      "amount": 45.99,
      "merchant": "AMAZON.COM",
      "raw_description": "AMAZON.COM",
      "category_id": 7,
      "category_slug": "shopping"
    }
  ],
  "spending_by_category": {
    "shopping": 45.99,
    "groceries": 78.32,
    "subscriptions": 15.99,
    "other": 0.0
  },
  "summary": "Your December spending totaled $1,639.67..."
}
```

**GET /transactions**
List transactions with optional filtering and pagination.
```
Request:  Query parameters:
          limit: int (default 100, min 1, max 500)
          offset: int (default 0, min 0)
          statement_id: int | null
          min_date: date | null (YYYY-MM-DD)
          max_date: date | null (YYYY-MM-DD)

Response: {
  "items": [
    {
      "id": 1,
      "statement_id": 1,
      "date": "2024-01-15",
      "amount": 45.99,
      "merchant": "AMAZON.COM",
      "raw_description": "AMAZON.COM",
      "category_id": 7,
      "is_anomalous": false,
      "is_subscription": false
    }
  ],
  "limit": 100,
  "offset": 0
}
```

**GET /statements**
List all uploaded statements with transaction counts, newest first.
```
Response: {
  "items": [
    {
      "id": 1,
      "filename": "statement.csv",
      "bank_type": "chase",
      "transaction_count": 5
    }
  ]
}
```

## Performance

Benchmarks measured locally on a standard development machine with Docker Compose:

- **Normalization pipeline:** Processes a 200-row CSV in [X]ms, 500-row CSV in [X]ms — measure with `time curl -X POST /ingest` locally and fill in
- **Cold analysis (cache miss):** `GET /analysis/{id}` with no cached result: [X]ms — measure and fill in
- **Warm analysis (cache hit):** `GET /analysis/{id}` with cached result: [X]ms — measure and fill in
- **Cache hit rate:** After first fetch, 100% of subsequent requests for the same statement return cached results until TTL expiry

Run these benchmarks before publishing and replace the [X] placeholders with real measured values.

## What I Would Build Next

- **Async LLM categorization via background job** — The current implementation runs the OpenAI API call synchronously inside the ingest request, adding 2–5 seconds of latency for a 200–500 row CSV. Decoupling this with a task queue (Celery + Redis as broker) would allow `/ingest` to return a `statement_id` immediately and process categorization asynchronously, with the frontend polling `GET /analysis/{id}` until the result is ready.
- **Redis-backed rate limiting** — The current rate limiter is in-memory, which resets on server restart and does not scale horizontally. Moving to a Redis-backed implementation (e.g. `slowapi` with Redis storage) would make rate limits persistent and consistent across multiple server instances.
- **Month-over-month trend tracking** — Store a normalized date period per statement and support `GET /analysis/trends?user_id=X` to return category spending deltas across multiple uploaded statements, enabling users to track whether their dining spend increased or decreased month over month.
- **Anomaly and subscription detection** — The `Transaction` schema already includes `is_anomalous` and `is_subscription` boolean fields. Populating them with simple statistical detection — duplicate charges within 48 hours for anomalies, same merchant on a ~30-day interval for subscriptions — would surface actionable insights without requiring additional LLM calls.
- **Additional bank formats** — Capital One, Citi, and American Express each have distinct CSV schemas. The existing `BankParser` protocol makes adding new parsers straightforward; the primary work is handling each bank's specific column naming and amount formatting conventions.

## Author

**Brian Maina** — [bmmaina@bu.edu](mailto:bmmaina@bu.edu) · [LinkedIn](https://linkedin.com/in/brianmaina) · [GitHub](https://github.com/brianmaina)

Boston University · B.A. Computer Science and Economics · Expected May 2028
