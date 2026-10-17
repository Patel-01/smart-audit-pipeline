# AI-Enriched Continuous Audit Pipeline

## Run locally
1. Copy `.env.example` to `.env` and set `MONGODB_URI` to a MongoDB connection string.
2. `npm install`
3. `npm run seed`
4. `npm run dev` (API at port 4000, Vite at port 5173).

## Run with Docker
Set `MONGODB_URI` in your environment, then run `docker compose up --build`. The application is available at `http://localhost:10000`.

## Deploy to Render
Push this repository to GitHub, create a Render Blueprint from it, and provide `MONGODB_URI` when prompted. Use a MongoDB Atlas database or another reachable MongoDB deployment; the Blueprint creates the Docker web service but does not provision MongoDB. Render routes traffic to the container using `PORT`, and `/healthz` is the configured health check.

The API accepts raw evidence, queues AI enrichment, and uses targeted `$set` updates. AI is deterministic and local for easy review; replace `AIService` with a provider adapter in production.

Endpoints: `POST /api/audit-entries`, `GET /api/audit-entries`, `GET /api/audit-entries/:id`, `PUT /api/audit-entries/:id`, `GET /api/audit-entries/:id/similar`, and `GET /healthz`.
