# AI Screening Backend (Node.js + OpenAI + Qdrant)

Automated CV & project report evaluation using RAG + LLM chaining with async job orchestration (BullMQ).

## Prereqs
- Node.js 20+
- Docker Desktop (for Redis & Qdrant)
- A Gemini API key

## Setup
1. `cp .env.example .env` and fill `GEMINI_API_KEY`.
2. Put PDFs into `./data`:
   - `case_study_brief.pdf`
   - `job_description.pdf` (target role)
   - `scoring_cv.pdf` and `scoring_project.pdf`
3. Start infra: `docker compose up -d`
4. Install deps: `npm i`
5. Ingest ground-truth: `npx tsx scripts/ingest.ts`
6. Run API: `npm run dev`

## API
- `POST /upload` → multipart form with `cv` and `report` (PDFs). Returns file ids.
- `POST /evaluate` → body `{ job_title, cv_id, report_id }`. Returns `{ id, status: "queued" }`.
- `GET /result/:id` → returns `{ status }` or final result JSON.

## Notes
- RAG uses Qdrant (Xenova/all-MiniLM-L6-v2, dim=384).
- Jobs retried with exponential backoff.
