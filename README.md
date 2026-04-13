# TalentMatch – Job-Candidate Matching Engine

A production-grade, hybrid matching system that ranks candidates for job descriptions using keyword overlap, semantic embeddings, and rule-based scoring — with clear, human-readable explanations for every decision.

---

## Quick Start (Single Docker Command)

```bash
git clone <repo-url> && cd job-match-engine
docker-compose up --build
```

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:3000       |
| API docs | http://localhost:8000/docs  |
| API root | http://localhost:8000       |

Sample data is loaded automatically on startup. No manual seeding required.

---

## Matching Approach

### Why Hybrid?

No single signal is enough:
- **Keywords alone** miss semantically related skills (Django ≈ Express.js as backend frameworks).
- **Embeddings alone** can hallucinate similarity between unrelated domains.
- **Rules alone** ignore actual skill content.

The three signals are combined with configurable weights per hiring context.

### Signal 1 — Keyword Overlap (default 45–60%)

Exact case-insensitive skill intersection between job requirements and candidate skills. Required skills are weighted **2×** over preferred skills. This is the most reliable signal for hard requirements.

### Signal 2 — Semantic Matching (default 25–50%)

Uses `all-MiniLM-L6-v2` (22M params, 384-dim) from sentence-transformers to encode the full job text and candidate profile into embeddings. Cosine similarity via FAISS gives a continuous score that captures:
- Skill synonyms ("Postgres" ↔ "PostgreSQL")
- Related frameworks ("Django" ↔ "Express.js" as backend frameworks)
- Domain overlap ("Machine Learning" ↔ "TensorFlow")

### Signal 3 — Rule-Based Score (default 15–20%)

Structured business logic:
- Experience within the required window → full score
- Underqualified → linear penalty (recoverable gap < 2 years)
- Overqualified by >3 years → soft 0.60 cap with retention warning
- Profile completeness modifier (sparse profiles get a ×0.9 confidence nudge-down)

### Weight Profiles by Hiring Mode

| Mode      | Keyword | Semantic | Rules | When to use                          |
|-----------|---------|----------|-------|--------------------------------------|
| `product` | 60%     | 25%      | 15%   | Hard skill requirements, SaaS/Fintech |
| `ai`      | 30%     | 50%      | 20%   | Research roles, flexible/emergent tech|
| `fresher` | 40%     | 40%      | 20%   | Campus hiring, learning potential     |
| `default` | 45%     | 35%      | 20%   | General hiring                        |

Set `hiring_mode` on each job description. Weights are in `backend/app/core/matcher.py` (`WEIGHT_PROFILES`) and can be changed without touching any other code.

---

## API Reference

### Ingest

```
POST /candidates          → upload candidate profiles (JSON array)
POST /candidates/upload   → upload as JSON file
POST /jobs                → upload job descriptions (JSON array)
POST /jobs/upload         → upload as JSON file
```

### Matching

```
GET /match/{jd_id}                  → ranked list of all candidates
GET /match/{jd_id}?top_k=50         → limit to top 50
GET /match/{jd_id}/{candidate_id}   → detailed match for one pair
```

### Browsing

```
GET /jobs         → list all jobs
GET /candidates   → list all candidates
GET /stats        → system stats (job count, candidate count, embedding status)
GET /health       → health check
```

### Example Response: `GET /match/jd001`

```json
{
  "job_id": "jd001",
  "job_title": "Senior Backend Engineer – Python/Django",
  "hiring_mode": "product",
  "total_candidates": 8,
  "results": [
    {
      "rank": 1,
      "candidate_id": "c006",
      "candidate_name": "Amit Joshi",
      "score": 0.8892,
      "fit": "STRONG",
      "confidence": 1.0,
      "breakdown": {
        "keyword_score": 0.9,
        "semantic_score": 0.82,
        "rules_score": 0.8,
        "weights": { "keyword": 0.6, "embedding": 0.25, "rules": 0.15 }
      },
      "details": {
        "matched_skills": ["Python", "Django", "PostgreSQL", "Redis", "Docker"],
        "missing_skills": [],
        "semantic_bridges": [
          { "candidate_skill": "FastAPI", "job_skill": "Django", "category": "Backend Frameworks" }
        ],
        "experience_note": "Experience is a strong fit (9 yrs within 4–8 yrs).",
        "profile_completeness": "100%",
        "skill_recommendations": []
      },
      "explanation": "Amit Joshi is a strong fit for the Senior Backend Engineer – Python/Django role. Matched skills: Python, Django, Postgresql, Rest Apis, Docker, Redis. No critical skill gaps identified. Experience is a strong fit (9 yrs within 4–8 yrs). Score breakdown — Keyword: 90% (×0.6), Semantic: 82% (×0.25), Rules: 80% (×0.15). Final weighted score: 89%."
    }
  ]
}
```

---

## Project Structure

```
job-match-engine/
├── backend/
│   ├── app/
│   │   ├── main.py              ← FastAPI app + startup data loading
│   │   ├── api/
│   │   │   ├── ingest.py        ← POST /candidates, POST /jobs
│   │   │   └── match.py         ← GET /match/...
│   │   ├── core/
│   │   │   ├── matcher.py       ← Hybrid scoring engine (pure Python)
│   │   │   ├── embeddings.py    ← Sentence-transformer + FAISS index
│   │   │   └── store.py         ← In-memory data store
│   │   └── models/
│   │       └── schemas.py       ← Pydantic request/response models
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/Sidebar.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Match.jsx        ← Main matching UI + detail panel
│   │   │   ├── Upload.jsx
│   │   │   ├── Jobs.jsx
│   │   │   └── Candidates.jsx
│   │   └── utils/api.js
│   ├── Dockerfile
│   └── nginx.conf
├── sample_data/
│   ├── candidates.json          ← 8 sample candidates
│   └── jobs.json                ← 4 sample job descriptions
└── docker-compose.yml
```

---

## Edge Case Handling

| Scenario                  | Handling                                                              |
|---------------------------|-----------------------------------------------------------------------|
| Empty skills list         | Keyword score → 0; semantic score → 0.5 (neutral); no crash          |
| Vague job description     | Keyword/semantic scores lower naturally; system still ranks          |
| Missing profile fields    | Completeness score reduces confidence; explanation notes sparsity     |
| Overqualified candidate   | Rule score capped at 0.60 with recruiter warning in explanation       |
| No candidates in system   | 404 with clear message                                                |
| Invalid JSON upload       | 400 with parse error detail                                           |
| Embeddings unavailable    | System falls back to neutral 0.5 semantic score, still functional    |

---

## Scalability to 100k Candidates

### Current Architecture (works up to ~5k candidates)

- In-memory Python dict for candidate store
- FAISS `IndexFlatIP` (exact search, O(n) per query)
- Single-process FastAPI

### Bottlenecks at Scale

| Bottleneck              | Kicks in at | Impact                                              |
|-------------------------|-------------|-----------------------------------------------------|
| Embedding computation   | 10k+        | Encoding 100k profiles ≈ 20–40 min on CPU           |
| FAISS flat index memory | 100k        | 384-dim × 100k × 4 bytes ≈ 150 MB (manageable)     |
| In-memory store         | 50k+        | High RAM; no persistence across restarts             |
| Single-process FastAPI  | High RPS    | No horizontal scaling                                |

### Recommended Architecture at 100k+

```
                    ┌──────────────┐
                    │  API Gateway │
                    │  (nginx/ALB) │
                    └──────┬───────┘
                           │
              ┌────────────┼─────────────┐
              ▼            ▼             ▼
        FastAPI #1    FastAPI #2    FastAPI #3    (stateless workers)
              │            │             │
              └────────────┼─────────────┘
                           │
                    ┌──────▼───────┐
                    │  PostgreSQL  │  ← candidate / job metadata
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Redis Cache │  ← embedding cache, result cache
                    └──────────────┘
                           │
                    ┌──────▼───────┐
                    │  FAISS IVF   │  ← sharded or pgvector
                    │  (persisted) │
                    └──────────────┘
                           │
                    ┌──────▼───────┐
                    │ Celery Queue │  ← async batch embedding jobs
                    └──────────────┘
```

**Specific changes required:**

1. **Switch FAISS index**: `IndexFlatIP` → `IndexIVFFlat(nlist=1024)` or `IndexHNSWFlat` for sub-linear ANN search. Trade: ~2–5% recall loss for 10–50× speedup.

2. **Precompute embeddings asynchronously**: Use Celery workers to encode profiles in batches of 512 on upload. Store vectors in pgvector or a FAISS shard saved to S3.

3. **Persistent store**: Replace in-memory dict with PostgreSQL for metadata. Candidate IDs map to FAISS row indices in the DB.

4. **Result caching**: Cache `GET /match/{jd_id}` results in Redis with a short TTL (5–10 min). Invalidate on new candidate upload.

5. **Horizontal scaling**: FastAPI is stateless once embeddings are in a shared index. Run 3–5 replicas behind a load balancer.

6. **GPU encoding** (optional): Move embedding computation to a GPU worker (A10G). Encoding 100k profiles drops from 40 min → ~2 min.

### Tradeoffs Accepted in This Implementation

| Decision                      | Tradeoff                                             |
|-------------------------------|------------------------------------------------------|
| In-memory store               | Fast dev; no persistence. Replace with Postgres at scale. |
| `all-MiniLM-L6-v2` (22M)     | Fast CPU inference; `bge-large` gives better recall but 3× slower. |
| `IndexFlatIP` (exact)         | 100% recall; O(n) query time. Use IVF at 10k+.      |
| Keyword weight dominant       | Prioritises hard requirements; may penalise career switchers. |
| Rule-based experience         | Deterministic but rigid; a learned model would be more nuanced. |

---

## Design Decisions

**Why not use an LLM for ranking directly?**
LLMs are slow (~2–5s per candidate pair), expensive at scale, and non-deterministic. They're better used for the explanation step. Our hybrid scoring is fast, deterministic, and explainable — the explanation is generated from structured signals, not from prompting an LLM.

**Why sentence-transformers over OpenAI embeddings?**
No API cost, no rate limits, runs offline, and `all-MiniLM-L6-v2` is competitive for skill-domain text. At scale, this matters.

**Why not a graph-based skill taxonomy?**
A skill ontology (O*NET, ESCO) would improve precision for rare skills. It adds significant data maintenance overhead and was out of scope for this implementation — but the `SKILL_CATEGORIES` dict in `matcher.py` is the foundation for adding it.

---

## Running Without Docker (Development)

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev     # → http://localhost:5173
```

Set `VITE_API_URL=http://localhost:8000` in `frontend/.env` for local dev.

---

## Sample Data

**4 job descriptions** across hiring modes: `product`, `ai`, `fresher`  
**8 candidate profiles** covering backend, frontend, ML, junior, senior profiles

All in `sample_data/` as JSON. Loaded automatically on startup.
