"""
Main file (entry point)

starts FastAPI app
loads sample data (csv + pdf)
connects all routes

also sets up embeddings and matching
"""

from __future__ import annotations
from fastapi import FastAPI

app = FastAPI()

import csv, logging, re
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Dict, List

from fastapi.middleware.cors import CORSMiddleware

from app.api.ingest import router as ingest_router
from app.api.match import router as match_router
from app.core.embeddings import embedding_service
from app.core.matcher import CandidateProfile, JobDescription
from app.core.store import store

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SAMPLE_DATA = Path("/app/sample_data")


# ---------------- skill extraction ----------------

# common skills list (used to detect skills from text)
_KNOWN_SKILLS = [
    "python","java","javascript","react","docker","aws","kubernetes",
    "tensorflow","pytorch","sql","nosql","git","linux"
]

# find skills inside text
def _extract_skills_from_text(text: str) -> List[str]:
    text = text.lower()
    found = []
    for skill in _KNOWN_SKILLS:
        if re.search(r"\b" + re.escape(skill) + r"\b", text):
            found.append(skill)
    return found

# convert "a,b,c" → ["a","b","c"]
def _parse_skills(raw: str) -> List[str]:
    if not raw:
        return []
    return [s.strip() for s in raw.split(",") if s.strip()]

# safely convert to int
def _safe_int(value, default=0):
    try:
        return int(float(str(value).strip()))
    except:
        return default


# ---------------- PDF helpers ----------------

# clean messy pdf text
def _clean_pdf_text(raw: str) -> str:
    import re
    text = raw.replace("\n \n", " ")
    text = re.sub(r"\n +\n", " ", text)
    text = re.sub(r" {2,}", " ", text)
    text = re.sub(r"\. ([A-Z])", ".\n\n\\1", text)
    return text.strip()

# read pdf and extract text
def _read_pdf_text(path: Path) -> str:
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(str(path))
        pages = [p.extract_text() or "" for p in reader.pages]
        return _clean_pdf_text("\n".join(pages))
    except:
        return ""


# ---------------- load sample data ----------------

def _load_sample_data():

    candidates_file = SAMPLE_DATA / "candidates.csv"
    jd_file = SAMPLE_DATA / "job_description.pdf"

    candidate_texts: Dict[str, str] = {}

    # load candidates
    if candidates_file.exists():
        with open(candidates_file, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)

            for row in reader:
                cid = str(row.get("id", "")).strip()
                if not cid:
                    continue

                skills_raw = row.get("skills", "") or ""

                c = CandidateProfile(
                    id=cid,
                    name=row.get("name", ""),
                    skills=_parse_skills(skills_raw),
                    years_experience=_safe_int(row.get("years_of_experience", 0)),
                    summary=row.get("summary", ""),
                    education=row.get("degree", ""),
                    current_role=row.get("current_title", ""),
                    email="",
                )

                store.add_candidate(c)

                # build text for embeddings
                candidate_texts[cid] = (
                    f"{c.name} {c.current_role} {c.skills} {c.summary}"
                )

        logger.info("loaded candidates")

    # load job from pdf
    if jd_file.exists():
        jd_text = _read_pdf_text(jd_file)

        if jd_text:
            skills = _extract_skills_from_text(jd_text)

            split = max(1, len(skills)//2)

            jd = JobDescription(
                id="1",
                title="Job Role",
                company="",
                description=jd_text,
                required_skills=skills[:split],
                preferred_skills=skills[split:],
                min_experience=0,
                max_experience=20,
                hiring_mode="default",
            )

            store.add_job(jd)

    # # create embeddings
    # if candidate_texts:
    #     embedding_service.add_candidates(candidate_texts)


# ---------------- app startup ----------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # load data when app starts
    _load_sample_data()
    yield


app = FastAPI(
    title="Job Matching Engine",
    version="1.0",
    lifespan=lifespan,
)

# allow all requests (for frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# connect routes
app.include_router(ingest_router)
app.include_router(match_router)


# simple home route
@app.get("/")
async def root():
    return {
        "service": "Job Matching Engine",
        "status": "running",
        "data": store.stats(),
    }


# health check
@app.get("/health")
async def health():
    return {"status": "ok"}