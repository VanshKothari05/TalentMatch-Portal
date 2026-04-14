from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.core.embeddings import embedding_service
from app.core.matcher import engine
from app.core.store import store
from app.models.schemas import MatchResult, RankedResponse, StatsResponse

# this router handles all matching related APIs
router = APIRouter(tags=["Matching"])


# get top candidates for a job
@router.get("/match/{jd_id}", response_model=RankedResponse)
async def match_job(jd_id: str, top_k: int = 50, hiring_mode: str = ""):
    """
    return ranked candidates for a job
    you can also change hiring_mode if needed
    """

    # get job from store
    job = store.get_job(jd_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"Job '{jd_id}' not found.")

    # get all candidates
    candidates = store.list_candidates()
    if not candidates:
        raise HTTPException(status_code=404, detail="No candidates in the system yet.")

    # if user passes different hiring mode, update it
    if hiring_mode and hiring_mode != job.hiring_mode:
        from app.core.matcher import JobDescription as JD
        job = JD(
            id=job.id, title=job.title, company=job.company,
            description=job.description, required_skills=job.required_skills,
            preferred_skills=job.preferred_skills, min_experience=job.min_experience,
            max_experience=job.max_experience, hiring_mode=hiring_mode,
        )

    # get similarity scores from embeddings
    emb_sims = embedding_service.similarities_for_job(job.full_text)

    # main logic happens here (ranking)
    ranked = engine.rank(job, candidates, embedding_similarities=emb_sims)

    # only return top k results
    ranked = ranked[:top_k]

    # format response
    return RankedResponse(
        job_id=jd_id,
        job_title=job.title,
        hiring_mode=job.hiring_mode,
        total_candidates=len(candidates),
        results=[_to_match_result(r) for r in ranked],
    )


# get detailed explanation for one candidate
@router.get("/match/{jd_id}/{candidate_id}", response_model=MatchResult)
async def match_detail(jd_id: str, candidate_id: str):
    """
    explain why this candidate matches this job
    """

    # get job
    job = store.get_job(jd_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"Job '{jd_id}' not found.")

    # get candidate
    candidate = store.get_candidate(candidate_id)
    if candidate is None:
        raise HTTPException(status_code=404, detail=f"Candidate '{candidate_id}' not found.")

    # get similarity between job and this candidate
    emb_sim = embedding_service.similarity_pair(job.full_text, candidate.full_text)

    # get final score + explanation
    result  = engine.score(job, candidate, embedding_similarity=emb_sim)

    return _to_match_result(result)


# list all jobs (simple debug / view API)
@router.get("/jobs", summary="List all jobs")
async def list_jobs():
    jobs = store.list_jobs()
    return [
        {
            "id":               j.id,
            "title":            j.title,
            "company":          j.company,
            "hiring_mode":      j.hiring_mode,
            "required_skills":  j.required_skills,
            "preferred_skills": j.preferred_skills,
            "min_experience":   j.min_experience,
            "max_experience":   j.max_experience,
            "description":      j.description,
        }
        for j in jobs
    ]


# list all candidates
@router.get("/candidates", summary="List all candidates")
async def list_candidates():
    candidates = store.list_candidates()
    return [
        {
            "id":               c.id,
            "name":             c.name,
            "years_experience": c.years_experience,
            "skills":           c.skills,
            "completeness":     round(c.completeness * 100),
        }
        for c in candidates
    ]


# basic stats about system
@router.get("/stats", response_model=StatsResponse)
async def stats():
    s = store.stats()
    return StatsResponse(
        jobs=s["jobs"],
        candidates=s["candidates"],
        embeddings_ready=embedding_service.is_ready(),
    )


# ---------------- helper ----------------

# convert raw result dict into clean response model
def _to_match_result(r: dict) -> MatchResult:
    from app.models.schemas import BreakdownOut, BridgeOut, DetailsOut

    return MatchResult(
        rank=r.get("rank"),
        candidate_id=r["candidate_id"],
        candidate_name=r["candidate_name"],
        score=r["score"],
        fit=r["fit"],
        confidence=r["confidence"],
        breakdown=BreakdownOut(**r["breakdown"]),
        details=DetailsOut(
            matched_skills=r["details"]["matched_skills"],
            missing_skills=r["details"]["missing_skills"],
            semantic_bridges=[BridgeOut(**b) for b in r["details"]["semantic_bridges"]],
            experience_note=r["details"]["experience_note"],
            profile_completeness=r["details"]["profile_completeness"],
            skill_recommendations=r["details"]["skill_recommendations"],
        ),
        explanation=r["explanation"],
        vs_above=r.get("vs_above"),
    )


# get one job by id
@router.get("/jobs/{jd_id}", summary="Get full job description")
async def get_job(jd_id: str):
    job = store.get_job(jd_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"Job '{jd_id}' not found.")

    return {
        "id":               job.id,
        "title":            job.title,
        "company":          job.company,
        "hiring_mode":      job.hiring_mode,
        "description":      job.description,
        "required_skills":  job.required_skills,
        "preferred_skills": job.preferred_skills,
        "min_experience":   job.min_experience,
        "max_experience":   job.max_experience,
    }