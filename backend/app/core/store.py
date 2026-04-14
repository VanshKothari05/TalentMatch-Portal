"""
Simple store (temporary storage)

we keep jobs and candidates in memory (RAM)


data will be lost if server restarts
in real apps → we use database (PostgreSQL / Redis)
"""

from __future__ import annotations
from typing import Dict, List, Optional

from app.core.matcher import CandidateProfile, JobDescription


class Store:
    def __init__(self) -> None:
        # store everything in dictionaries using id
        self._jobs: Dict[str, JobDescription] = {}
        self._candidates: Dict[str, CandidateProfile] = {}

    # ---------------- jobs ----------------

    # add a job
    def add_job(self, job: JobDescription) -> None:
        self._jobs[job.id] = job

    # get job by id
    def get_job(self, jd_id: str) -> Optional[JobDescription]:
        return self._jobs.get(jd_id)

    # get all jobs
    def list_jobs(self) -> List[JobDescription]:
        return list(self._jobs.values())

    # ---------------- candidates ----------------

    # add candidate
    def add_candidate(self, c: CandidateProfile) -> None:
        self._candidates[c.id] = c

    # get candidate by id
    def get_candidate(self, cid: str) -> Optional[CandidateProfile]:
        return self._candidates.get(cid)

    # get all candidates
    def list_candidates(self) -> List[CandidateProfile]:
        return list(self._candidates.values())

    # ---------------- stats ----------------

    # simple count info (used for /stats API)
    def stats(self) -> dict:
        return {
            "jobs": len(self._jobs),
            "candidates": len(self._candidates),
        }


# single shared store used everywhere
store = Store()