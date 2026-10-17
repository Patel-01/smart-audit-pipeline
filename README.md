# AI-Enriched Continuous Audit Pipeline

SmartAudit is an Express/React application written in TypeScript. The backend
keeps HTTP handling, update decisions, persistence, enrichment, and background
orchestration in separate classes. The AI adapter is deterministic for the
assessment; it does not call an external provider.

## Run locally
1. Copy `.env.example` to `.env` and set `MONGODB_URI` to a MongoDB connection string.
2. `npm ci`
3. Optionally run `npm run seed` to **add** two synthetic entries. It does not
   delete existing data; use a non-production database for demos.
4. `npm run dev` (API at port 4000, Vite at port 5173).
5. `npm test` runs the unit tests. `npm run build` type-checks both backend and
   frontend and builds the production bundle.

## Run with Docker
Set `MONGODB_URI` in your environment, then run `docker compose up --build`. The application is available at `http://localhost:10000`.

## Deploy to Render
Push this repository to GitHub, create a Render Blueprint from it, and provide `MONGODB_URI` when prompted. Use a MongoDB Atlas database or another reachable MongoDB deployment; the Blueprint creates the Docker web service but does not provision MongoDB. Render routes traffic to the container using `PORT`, and `/healthz` is the configured health check.

The API accepts raw evidence and returns `202` while the worker processes it.
`AuditMutationPolicy` distinguishes auditor-note edits from financial/evidence
edits. Notes use a targeted `$set` without changing AI status. Core edits use
`$set` and `$inc` to requeue enrichment and advance `coreRevision`. A worker
claims one pending record atomically; its result is written only if that
revision is still current. This prevents a stale in-flight result from
overwriting a newer edit. AI is deterministic and local for review; replace
`AIService` with a provider adapter for real AI integration.

The similarity endpoint returns the top three completed exceptions ranked by
cosine similarity of their eight-dimensional vectors. It returns `409` while
the target entry has no current vector.

The local demo video in `demo/smart-audit-demo.mp4` was generated
with synthetic data and an isolated in-memory store, so it does not read or
modify production audit records. The demo folder is intentionally ignored by
Git and Docker.

Endpoints: `POST /api/audit-entries`, `GET /api/audit-entries`, `GET /api/audit-entries/:id`, `PUT /api/audit-entries/:id`, `GET /api/audit-entries/:id/similar`, and `GET /healthz`.
