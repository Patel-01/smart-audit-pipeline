# AI-Enriched Continuous Audit Pipeline

SmartAudit is an Express/React application written in TypeScript. The backend is
organized by business capability: `src/modules/audit` owns audit records,
persistence, mutation rules, and the enrichment contract; `src/modules/ai-enrichment`
implements enrichment behind that contract. Their implementation details stay
inside each module. `ApplicationContainer` is the composition root that connects
the modules and their concrete adapters.

The frontend keeps application-wide composition and shared infrastructure in
`client/src/app` and `client/src/shared`, while audit-owned code lives together
under `client/src/modules/audit`. The class-based `AuditDashboardPage` owns the
audit workflow state and composes focused class components for the header,
overview, evidence form, audit stream, rows, and similarity results.
`AuditApiClient` owns audit endpoints and payloads; the shared `HttpClient`
handles only transport concerns. This avoids duplicating common plumbing without
forcing each feature into a backend-style one-to-one structure.

## Run locally
1. Copy `.env.example` to `.env` and set `MONGODB_URI` to a MongoDB connection string.
2. `npm ci`
3. Optionally run `npm run seed` to **add** four synthetic entries. It does not
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
edits and delegates validation and field classification to an internal planner.
Notes use a targeted `$set` without changing AI status. Core edits use
`$set` and `$inc` to requeue enrichment and advance `coreRevision`. A worker
claims one pending record atomically; its result is written only if that
revision is still current. This prevents a stale in-flight result from
overwriting a newer edit. `AIService` delegates enrichment to an internal
engine; `AIWorkerService` delegates polling and concurrency handling to an
internal worker. Replace the internal deterministic engine with a provider
adapter when connecting a real AI service.

The similarity endpoint (`POST /api/audit-entries/:id/similar`) returns the top
three completed exceptions ranked by cosine similarity of their
eight-dimensional vectors. It returns `409` while the target entry has no
current vector. The React class-component dashboard includes live pipeline
status, risk levels, summaries, anomaly flags, note fast-track editing, core
evidence re-analysis, and similarity search. The deterministic local engine
simulates 400ms of processing by default; configure `AI_PROCESSING_DELAY_MS` to
change the delay. `MOCK_AI=true` documents the default local assessment mode;
there is no live provider integration or API key required.

The local demo video in `demo/smart-audit-demo.mp4` was generated
with synthetic data and an isolated in-memory store, so it does not read or
modify production audit records. The demo folder is intentionally ignored by
Git and Docker.

Endpoints: `POST /api/audit-entries`, `GET /api/audit-entries`, `GET /api/audit-entries/:id`, `PUT /api/audit-entries/:id`, `POST /api/audit-entries/:id/similar`, and `GET /healthz`.
