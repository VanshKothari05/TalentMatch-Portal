# TalentMatch – Job-Candidate Matching Engine

A system that ranks candidates for job descriptions using a mix of keyword matching, semantic similarity, and rule-based scoring — with explainable results for each candidate.

---

## 🎬 Don't wanna read boring docs? 😏

**[Click here to watch the live demo walkthrough video](https://vimeo.com/1182972430?share=copy&fl=sv&fe=ci)**

---

## 🌐 Live Demo

| | URL |
|---|---|
| Frontend | https://talentmatch-portal-1.onrender.com |
| Backend (Swagger) | https://talentmatch-portal.onrender.com/docs |

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python) |
| Frontend | React (Vite) |
| Vector Search | FAISS |
| Embeddings | `all-MiniLM-L6-v2` (sentence-transformers, local) / `BAAI/bge-small-en-v1.5` (FastEmbed ONNX, Render) |
| Deployment | Docker + Render |

---

## 🗂️ Sample Data

Don't have test files? Use these to try it out instantly:

| File | Description | Download |
|---|---|---|
| `job_description.pdf` | Sample job description | [Download](https://drive.google.com/file/d/1gO7BqC9Tu5D_peL9h_c-nhXdOsIyTvd1/view?usp=sharing) |
| `candidates.csv` | Sample candidates list | [Download](https://drive.google.com/file/d/13Rjw0EwZyf55cHap0k1ZFYWsTNxAnb3Q/view?usp=sharing) |

Upload these directly on the frontend to see matching in action.

---

## ⚡ Quick Start (Docker)

```bash
git clone <your-repo-url>
cd job-match-engine
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8000/docs |

---

## 🔁 Using Sentence Transformers Locally (Optional)

If you want higher-quality embeddings locally, make these changes **before** running `docker compose up --build`:

**1. `requirements.txt`**
```
# uncomment this
sentence-transformers==3.0.0

# comment this
# fastembed
```

**2. `Dockerfile`**
```dockerfile
# comment this
# RUN python -c "from fastembed import TextEmbedding; TextEmbedding(model_name='BAAI/bge-small-en-v1.5')"

# enable this
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
```

**3. Set env var**
```
USE_FASTEMBED=false
```

Then rebuild:
```bash
docker compose up --build
```

---

## 🧠 How Matching Works

The system combines 3 signals instead of relying on a single method:

### 1. Keyword Matching
- Exact overlap between job skills and candidate skills
- Required skills are weighted higher than preferred skills

### 2. Semantic Matching
- Text is converted to embeddings via FastEmbed
- Finds similarity even when wording differs
- e.g. `"Postgres"` ≈ `"PostgreSQL"`

### 3. Rule-Based Scoring
- Experience range check
- Profile completeness score
- Handles over/under qualification

---

## 🎯 How Candidates Are Evaluated

Three scoring signals combined:

- **Keyword Match** — Exact skill overlap. Required skills count 2× preferred.
- **Semantic Match** — Skill category overlap e.g. Django similar to Express.js.
- **Experience Fit** — Years vs role range. Overqualified is flagged.

### Weights by Context

| Context | Keyword | Semantic | Experience | Best For |
|---|---|---|---|---|
| Product company | 60% | 25% | 15% | SaaS, fintech |
| AI startup | 30% | 50% | 20% | Flexible, research |
| Fresher hiring | 40% | 40% | 20% | Campus, potential |
| General | 45% | 35% | 20% | Most scenarios |

### Score Bands

| Score | Result |
|---|---|
| 65 – 100 | ✅ Strong fit |
| 40 – 64 | 🟡 Moderate |
| 0 – 39 | ❌ Weak fit |

---

## 🔧 Key Optimization — Real Issue Faced

### Problem
Initially used `sentence-transformers` (PyTorch-based):
- Memory usage: ~300–400MB just for model load
- Render free tier limit: 512MB
- Backend kept crashing → 502 errors → fake CORS errors in browser

### Solution
Switched to `fastembed` (ONNX-based):
- No PyTorch dependency
- Total memory ~50–100MB
- Removed model loading at startup
- Reduced batch size (64 → 16)
- Incremental FAISS index updates instead of full rebuild on every upload

### Result
- Stable deployment on free tier
- Faster cold starts
- Same semantic matching quality

---

## 📡 API Endpoints

### Upload
```
POST /jobs/upload
POST /candidates/upload
```

### Matching
```
GET /match/{jd_id}
GET /match/{jd_id}/{candidate_id}
```

### Other
```
GET /jobs
GET /candidates
GET /stats
```

---

## 🖥️ Frontend Features

- Upload job descriptions and candidate files
- View ranked candidate results
- See detailed match explanation per candidate
- Works entirely without Postman

---

## ⚠️ Edge Cases Handled

- Missing or empty skills
- Incomplete candidate profiles
- Overqualified candidates
- Invalid or unsupported file uploads

---

## 📈 Scalability (100k+ Candidates)

**Current setup:**
- In-memory store
- FAISS exact search (IndexFlatIP)

**Limitations at scale:**
- Slower search without indexing strategy
- No data persistence across restarts

**Future improvements:**
- PostgreSQL + pgvector
- Redis caching layer
- FAISS IVF / HNSW for approximate search
- Async background embedding jobs

---

## ⚖️ Tradeoffs

| Decision | Tradeoff |
|---|---|
| FastEmbed over PyTorch | Slightly less accurate but fits in 512MB |
| In-memory store | Fast reads, no persistence |
| Rule-based scoring | Simple and explainable, but rigid |
| FAISS flat index | Exact results, slower at 100k+ scale |

---

## 📁 Project Structure

```
backend/          → FastAPI app + matching logic
frontend/         → React UI (Vite)
sample_data/      → Test CSV and PDF files
docker-compose.yml
```

---

## 🧪 Run Without Docker

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```
