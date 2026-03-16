# StatementWrapped

Spend intelligence from bank statement CSV uploads: multi-bank normalization, transaction categorization, anomaly and subscription detection. Backend uses FastAPI, PostgreSQL, and Redis; frontend is React. Deployable via Docker (e.g. Render).

## Screenshots

| Dashboard | Transaction list | Upload |
|-----------|------------------|--------|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Transaction list](docs/screenshots/transactions.png) | ![Upload](docs/screenshots/upload.png) |

_Screenshot placeholders: add `docs/screenshots/dashboard.png`, `docs/screenshots/transactions.png`, and `docs/screenshots/upload.png` to replace these links._

## Features

- **Multi-bank CSV ingestion** — Normalized pipeline for Chase, Bank of America, Apple Card, and Wells Fargo export formats
- **LLM-powered categorization** — Automatic transaction categorization with configurable categories
- **Anomaly detection** — Surfaces unusual or unexpected charges
- **Subscription detection** — Identifies recurring and subscription-like transactions
- **Redis caching** — Caches LLM results to reduce cost and latency on repeat analysis
- **Dockerized stack** — FastAPI + PostgreSQL + Redis, ready for local dev and deployment (e.g. Render)

## Tech stack

| Layer    | Stack |
|----------|--------|
| API      | FastAPI, Python 3.12 |
| Database | PostgreSQL 16, SQLAlchemy (async) |
| Cache    | Redis 7 |
| Frontend | React, TypeScript, Vite (planned) |
| Infra    | Docker, Docker Compose |

## Prerequisites

- **Docker** and **Docker Compose**  
  - Compose is often bundled as the `docker compose` plugin; the standalone command is `docker-compose`.  
  - If you get **"failed to connect to the docker API"** or **"no such file or directory"** for `docker.sock`, the Docker daemon isn’t running — start Docker Desktop (or Colima/OrbStack) and try again.  
  - If **"command not found"** for both: on macOS run `brew install docker-compose`, or install Docker Desktop (includes the `docker compose` plugin).

- **Without Docker:** Python 3.12+, PostgreSQL 16, Redis 7.

## Getting started

### 1. Clone and enter the repo

```bash
git clone <your-repo-url>
cd StatementWrapped
```

### 2. Environment

Copy the example env and adjust if needed (defaults work with the Compose stack):

```bash
cp .env.example .env
```

See [Environment variables](#environment-variables) for all options.

### 3. Run with Docker

From the project root:

```bash
docker compose up --build -d
```

or, with the standalone Compose binary:

```bash
docker-compose up --build -d
```

### 4. Verify

- **API:** http://localhost:8000  
- **Interactive docs:** http://localhost:8000/docs  
- **Health:** http://localhost:8000/health  

```bash
curl http://localhost:8000/health
```

Expected: `{"status":"ok","database":"ok","redis":"ok"}`.

### Run backend only (no Docker)

1. Create a PostgreSQL database and a Redis instance.
2. Set environment variables (see `.env.example`):

   ```bash
   export DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/statementwrapped
   export REDIS_URL=redis://localhost:6379/0
   ```

3. From the project root:

   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## Project structure

```
StatementWrapped/
├── backend/                 # FastAPI application
│   ├── main.py              # App entry, health, lifespan
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── models/              # SQLAlchemy models
│   ├── routers/             # API route modules
│   ├── services/            # Business logic (normalizer, LLM, cache)
│   └── parsers/             # Bank-specific CSV parsers (Chase, BoA, etc.)
├── frontend/                # React SPA (Vite + TypeScript)
├── docker-compose.yml       # api, postgres, redis
├── .env.example
└── README.md
```

## Environment variables

| Variable        | Description |
|-----------------|-------------|
| `DATABASE_URL`  | PostgreSQL connection string; use `postgresql+asyncpg://...` for async. |
| `REDIS_URL`     | Redis connection URL (e.g. `redis://localhost:6379/0`). |
| `OPENAI_API_KEY`| (Optional) For LLM categorization and insights (Week 2+). |

See `.env.example` for local/Docker defaults.

## Development

- **API reload:** When running without Docker, use `uvicorn main:app --reload` so the server restarts on code changes.
- **Migrations:** Alembic is used for DB migrations; run from `backend/` (see Day 2+ setup).
- **Adding a bank:** Implement a parser in `backend/parsers/` that conforms to the normalizer contract and register it in the bank registry.

## Contributing

1. **Fork and clone** the repository.
2. **Create a branch** for your change: `git checkout -b feature/your-feature` or `fix/your-fix`.
3. **Set up locally:** follow [Getting started](#getting-started); ensure `curl http://localhost:8000/health` returns OK.
4. **Make your changes.** Keep backend and frontend style consistent with the existing code (FastAPI routers, SQLAlchemy models, React components).
5. **Run the stack and test** manually (and add or run automated tests if present).
6. **Commit** with clear messages; **push** your branch and open a **pull request** against `main`. Describe what changed and how to verify it. Link any related issue.

If you add a new bank parser: implement it in `backend/parsers/` against the normalizer contract and register it in the bank registry; include a sample CSV (with PII removed) or column mapping in the PR description.

## Deployment

Run the API as a Web Service on [Render](https://render.com) (or similar). Attach a PostgreSQL database and Redis instance; set `DATABASE_URL` and `REDIS_URL`. Run migrations on deploy (release command or startup script). Build the React app and serve it as static files from the API or as a separate static site.

## License

MIT. See [LICENSE](LICENSE) for terms.
