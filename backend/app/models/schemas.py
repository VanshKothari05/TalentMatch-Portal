from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ---------------- input models ----------------

# used when user uploads candidate data
class CandidateIn(BaseModel):
    id: str
    name: str
    skills: List[str] = Field(default_factory=list)  # default empty list
    years_experience: float = 0.0
    summary: str = ""
    education: str = ""
    current_role: str = ""
    email: str = ""


# used when user uploads job data
class JobIn(BaseModel):
    id: str
    title: str
    company: str = ""
    description: str = ""
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    min_experience: int = 0
    max_experience: int = 20
    hiring_mode: str = "default"   # controls scoring style


# ---------------- output models ----------------

# shows how score is calculated
class BreakdownOut(BaseModel):
    keyword_score: float
    semantic_score: float
    rules_score: float
    weights: Dict[str, float]


# used for "similar skills" explanation
class BridgeOut(BaseModel):
    candidate_skill: str
    job_skill: str
    category: str


# detailed info for each match
class DetailsOut(BaseModel):
    matched_skills: List[str]
    missing_skills: List[str]
    semantic_bridges: List[BridgeOut]
    experience_note: str
    profile_completeness: str
    skill_recommendations: List[str]


# main result for each candidate
class MatchResult(BaseModel):
    rank: Optional[int] = None
    candidate_id: str
    candidate_name: str
    score: float
    fit: str
    confidence: float
    breakdown: BreakdownOut
    details: DetailsOut
    explanation: str
    vs_above: Optional[str] = None


# response for /match API
class RankedResponse(BaseModel):
    job_id: str
    job_title: str
    hiring_mode: str
    total_candidates: int
    results: List[MatchResult]


# response after uploading data
class IngestResponse(BaseModel):
    status: str
    added: int
    ids: List[str]


# response for /stats API
class StatsResponse(BaseModel):
    jobs: int
    candidates: int
    embeddings_ready: bool