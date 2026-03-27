# TrafficVision Full-Functionality & Deployment Plan (FastAPI Track)

## 1) Current-State Findings (Repository Audit)

### Frontend status
- The admin dashboard is mostly mock-driven (hardcoded violations, KPIs, zones, and simulated updates) instead of backend-fed.
- Authentication is demo-only in client state (`DUMMY` credentials), while Firebase client SDK is configured but not used in auth flows.
- Challan APIs are hardcoded to `http://localhost:8000` and the frontend does not send Firebase ID tokens on review calls.
- Most panels still lack robust loading/error/empty handling tied to real API status.

### Backend status
- The repository currently has two backend codepaths:
  - FastAPI (`backend/server.py`) for challans/review and token verification.
  - Django/DRF (`backend/core`, `backend/apps/detection`) for video detection endpoint scaffolding.
- YOLO-based detection exists and runs, but business persistence is incomplete and helmet logic is still placeholder-grade.
- FastAPI currently persists challans in `challans.json`, seeded from image files, which is not production-safe or audit-friendly.
- Firebase Admin integration exists, but end-to-end auth + role enforcement is incomplete.

### Deployment readiness gaps
- Development-grade security defaults still exist (open CORS patterns, local file persistence, mixed runtime paths).
- No clear production data layer for operational entities (violations, challans, reviews, users, cameras).
- No CI/CD release path and no canonical staging/prod deployment workflow.

---

## 2) Chosen Target Architecture (Decision Locked)

> **Decision: FastAPI is the canonical backend.**

### Final architecture
- **Frontend (React/Vite)**
  - Firebase Auth for sign-in/sign-out.
  - Central API client using `VITE_API_BASE_URL`.
  - Bearer token attachment on protected requests.

- **Backend (FastAPI, canonical)**
  - REST APIs for upload, violations, challans, analytics, and review workflows.
  - Firebase Admin token verification and role checks.
  - Async processing via worker queue for video jobs.

- **Inference pipeline**
  - YOLO-based detection service with explicit stages:
    - frame sampling
    - detection
    - association (rider/bike)
    - helmet classifier
    - dedup + evidence generation.

- **Data and media**
  - PostgreSQL for transactional data.
  - Object storage (GCS/S3/Firebase Storage) for videos and evidence snapshots.

- **Operations**
  - Containerized API + worker deployment.
  - Metrics/logging/alerting for reliability and model behavior tracking.

---

## 3) FastAPI Workstreams and Detailed Execution Plan

## Phase 0 — FastAPI Consolidation (2–3 days)
1. Officially deprecate Django runtime path for production.
2. Keep Django code as archive/reference only until migration parity is complete.
3. Define MVP violation scope:
   - Triple riding
   - No helmet
   - (optional) red-light jump if reliable model/dataset is available.
4. Publish a single OpenAPI-first contract for frontend integration.

**Deliverables**
- FastAPI ADR and migration note
- API contract (`/docs`) aligned with frontend expectations
- Environment matrix (dev/staging/prod)

## Phase 1 — Domain Model + Persistence (1–2 weeks)
1. Replace `challans.json` with PostgreSQL entities:
   - `camera`, `violation`, `evidence`, `challan`, `review_action`, `user_role`, `zone`.
2. Introduce SQLAlchemy models + Alembic migrations.
3. Implement repositories/services for CRUD + workflows.
4. Normalize challan lifecycle states (`pending`, `approved`, `rejected`, `cancelled`) and audit metadata.
5. Add seeded reference data for zones/cameras.

**Acceptance Criteria**
- Challans and violations are DB-backed.
- No operational path depends on local JSON files.

## Phase 2 — API Hardening (1–2 weeks)
1. Build/standardize endpoints:
   - `POST /api/videos/upload`
   - `GET /api/jobs/{job_id}`
   - `GET /api/violations`
   - `GET /api/violations/{id}`
   - `GET /api/challans`
   - `POST /api/challans/{id}/review`
   - `GET /api/analytics/summary`
2. Add pagination/filter/sort for list APIs.
3. Add request validation + structured error envelopes.
4. Add auth guards and role-based route protection.
5. Add rate limiting and idempotency strategy for mutation endpoints.

**Acceptance Criteria**
- Frontend can consume all required endpoints from FastAPI only.
- API behavior documented and stable via OpenAPI schemas.

## Phase 3 — Detection Pipeline Productionization (2–3 weeks)
1. Refactor inference into modular services (detection, association, helmet inference, evidence writer).
2. Replace placeholder helmet logic with a validated helmet/no-helmet model.
3. Introduce async job queue (Celery/RQ/Arq + Redis) for video processing.
4. Persist model metadata per violation:
   - model name/version
   - confidence
   - frame/time offsets.
5. Add deterministic test fixtures and benchmark reports.

**Acceptance Criteria**
- Reproducible outputs on fixture videos.
- Model thresholding documented with validation metrics.

## Phase 4 — Frontend Integration (1–2 weeks)
1. Replace demo auth flow with Firebase Auth integration in `AuthContext`.
2. Create API client abstraction with token injection and base URL configuration.
3. Remove hardcoded `localhost` endpoints from components.
4. Wire core modules to FastAPI data:
   - Violation log
   - Challan review
   - KPI summary
   - Analytics panels.
5. Keep a feature-flagged demo mode (`VITE_DEMO_MODE=true`) for demos only.

**Acceptance Criteria**
- End users can sign in, fetch live challans, and complete review workflows against FastAPI.

## Phase 5 — Security + Deployability (1 week)
1. Enforce production CORS origin allowlist.
2. Remove service account files from repository; use injected secrets only.
3. Add audit logging for all review actions.
4. Dockerize frontend, FastAPI API, and worker.
5. Add CI/CD pipelines for lint/test/build/deploy with staging gates.

**Acceptance Criteria**
- One-command staging deploy + verified rollback procedure.

---

## 4) Deployment Blueprint (Concrete, FastAPI)

### Recommended platform stack
- Frontend: Vercel or Firebase Hosting
- FastAPI API: Google Cloud Run (or Render/Fly.io equivalent)
- Worker: Cloud Run Jobs or dedicated worker service
- DB: Cloud SQL PostgreSQL
- Cache/queue: Redis (Memorystore)
- Media: Cloud Storage bucket
- Auth: Firebase Auth + Firebase Admin token verification
- Monitoring: Cloud Logging + metrics dashboards + uptime checks

### Environment variables baseline
- Frontend:
  - `VITE_API_BASE_URL`
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
  - `VITE_DEMO_MODE`

- FastAPI backend:
  - `APP_ENV`
  - `API_BASE_URL`
  - `DATABASE_URL`
  - `REDIS_URL`
  - `FIREBASE_CREDENTIALS_JSON`
  - `MEDIA_BUCKET_NAME`
  - `MODEL_GENERAL_PATH`
  - `MODEL_HELMET_PATH`
  - `ALLOWED_ORIGINS`
  - `LOG_LEVEL`

---

## 5) Prioritized Backlog (FastAPI-first)

### P0 (must-have pre-launch)
- [ ] Deprecate Django production path and finalize FastAPI ownership.
- [ ] Move challan/violation persistence to PostgreSQL.
- [ ] Implement Firebase-authenticated review endpoints with RBAC.
- [ ] Remove hardcoded frontend API URLs and wire centralized API client.
- [ ] Deploy staging with full upload→detect→challan→review flow.

### P1 (should-have)
- [ ] Async processing and job tracking UI.
- [ ] Full analytics endpoints backing dashboards.
- [ ] Camera health and status monitoring.
- [ ] Audit log UI/export for compliance review.

### P2 (nice-to-have)
- [ ] Real-time updates via SSE/WebSockets.
- [ ] Retraining pipeline and model registry.
- [ ] Downstream integrations (payments/penalty systems).

---

## 6) Test and Quality Strategy

### Backend
- Unit tests: violation logic, auth guards, service-layer transitions.
- API tests: status codes, schema correctness, pagination/filtering, role checks.
- Worker tests: queue behavior, retries, timeout handling, idempotency.

### Frontend
- Component tests for data, loading, and failure states.
- Integration tests for login and challan review flow.
- E2E smoke test for upload-to-review happy path.

### ML/Detection
- Curated validation set for local road/camera conditions.
- Precision/recall/F1 targets by violation class before release gating.

---

## 7) Key Risks and Mitigations

1. **False positives in helmet detection**
   - Mitigation: calibrated thresholds + mandatory reviewer approval flow.
2. **Migration drift while retiring Django path**
   - Mitigation: explicit migration checklist and cutoff date.
3. **Secrets exposure risk**
   - Mitigation: secret manager + key rotation + repo scanning.
4. **Processing latency on long videos**
   - Mitigation: async workers, adaptive frame skip, autoscaling.

---

## 8) Proposed Timeline (MVP)

- Week 1: Phase 0 + Phase 1 foundation
- Week 2: Phase 2 API hardening
- Week 3: Phase 3 detection productionization
- Week 4: Phase 4 frontend integration + Phase 5 deployment/security

**MVP target:** ~4 weeks with focused ownership.

---

## 9) Immediate Next 10 Actions

1. Freeze FastAPI as the only production backend.
2. Create SQLAlchemy schema + Alembic migrations.
3. Replace `challans.json` flows with DB repositories.
4. Implement authenticated challan review workflow with roles.
5. Add upload + async job status endpoints.
6. Integrate proper helmet model and capture model version metadata.
7. Refactor frontend API access to use `VITE_API_BASE_URL`.
8. Replace dummy auth flow with Firebase Auth.
9. Stand up staging infra (API + worker + DB + storage).
10. Run UAT script and publish go-live checklist.

---

## 10) Definition of “Full Functional & Deployable”

TrafficVision is considered full functional and deployable when:
- Users authenticate via Firebase and role enforcement is active in FastAPI.
- Uploaded videos produce persisted violations and challans with evidence links.
- Frontend dashboards are powered by live FastAPI data (not static arrays).
- Media is stored durably in object storage with stable URLs.
- CI/CD, staging, and production deploys are repeatable and monitored.
- Security baseline (secret handling, CORS allowlist, audit trail, least privilege) is enforced.
