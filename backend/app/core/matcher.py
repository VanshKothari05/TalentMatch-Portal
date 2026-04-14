"""
Hybrid Matching Engine

This system finds best candidates using 3 things:

1. Skills match  
2. Meaning match  
3. Simple rules (experience, profile)

Modes:
- "product" → more focus on skills  
- "ai"      → more focus on meaning  
- "fresher" → balanced and easy rules
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

import numpy as np

# ---------------------------------------------------------------------------
# Weight profiles keyed by hiring_mode
# ---------------------------------------------------------------------------
WEIGHT_PROFILES: Dict[str, Dict[str, float]] = {
    "product": {"keyword": 0.60, "embedding": 0.25, "rules": 0.15},
    "ai":      {"keyword": 0.30, "embedding": 0.50, "rules": 0.20},
    "fresher": {"keyword": 0.40, "embedding": 0.40, "rules": 0.20},
    "default": {"keyword": 0.45, "embedding": 0.35, "rules": 0.20},
}

# Soft skill-category groupings used for semantic bridging in explanations
SKILL_CATEGORIES = {
    "backend_frameworks": ["django", "fastapi", "flask", "express.js", "spring boot", "rails", "laravel"],
    "languages":          ["python", "javascript", "typescript", "java", "go", "rust", "ruby", "php"],
    "databases":          ["postgresql", "mysql", "mongodb", "redis", "elasticsearch", "cassandra"],
    "devops":             ["docker", "kubernetes", "aws", "gcp", "azure", "ci/cd", "terraform"],
    "ml":                 ["tensorflow", "pytorch", "scikit-learn", "mlflow", "machine learning", "deep learning"],
    "frontend":           ["react", "vue", "angular", "next.js", "tailwind css", "html", "css"],
    "messaging":          ["kafka", "rabbitmq", "celery", "redis", "sqs"],
}


# Correct display names for skills where .title() gives wrong casing
_DISPLAY_NAMES: Dict[str, str] = {
    "ci/cd":          "CI/CD",
    "scikit-learn":   "scikit-learn",
    "fastapi":        "FastAPI",
    "postgresql":     "PostgreSQL",
    "mongodb":        "MongoDB",
    "mysql":          "MySQL",
    "graphql":        "GraphQL",
    "grpc":           "gRPC",
    "nosql":          "NoSQL",
    "aws":            "AWS",
    "gcp":            "GCP",
    "azure":          "Azure",
    "mlflow":         "MLflow",
    "tensorflow":     "TensorFlow",
    "pytorch":        "PyTorch",
    "javascript":     "JavaScript",
    "typescript":     "TypeScript",
    "next.js":        "Next.js",
    "express.js":     "Express.js",
    "tailwind css":   "Tailwind CSS",
    "html":           "HTML",
    "css":            "CSS",
    "sql":            "SQL",
    "rest apis":      "REST APIs",
    "github actions": "GitHub Actions",
    "spring boot":    "Spring Boot",
    "rabbitmq":       "RabbitMQ",
    "sqs":            "SQS",
    "git":            "Git",
    "linux":          "Linux",
    "bash":           "Bash",
    "airflow":        "Airflow",
    "machine learning": "Machine Learning",
    "deep learning":  "Deep Learning",
}


def _display_name(skill: str) -> str:
    """Return a properly cased display name for a skill string."""
    key = skill.strip().lower()
    return _DISPLAY_NAMES.get(key, skill.strip().title())


def _normalise(skills: List[str]) -> List[str]:
    return [s.strip().lower() for s in skills if s.strip()]


def _category_of(skill: str) -> Optional[str]:
    s = skill.lower()
    for cat, members in SKILL_CATEGORIES.items():
        if s in members:
            return cat
    return None


# ---------------------------------------------------------------------------
# Data containers
# ---------------------------------------------------------------------------
@dataclass
class JobDescription:
    id: str
    title: str
    company: str
    description: str
    required_skills: List[str]
    preferred_skills: List[str] = field(default_factory=list)
    min_experience: int = 0
    max_experience: int = 20
    hiring_mode: str = "default"

    @property
    def all_skills(self) -> List[str]:
        return self.required_skills + self.preferred_skills

    @property
    def full_text(self) -> str:
        parts = [self.title, self.description] + self.required_skills + self.preferred_skills
        return " ".join(parts)


@dataclass
class CandidateProfile:
    id: str
    name: str
    skills: List[str]
    years_experience: float = 0.0
    summary: str = ""
    education: str = ""
    current_role: str = ""
    email: str = ""

    @property
    def full_text(self) -> str:
        parts = [self.current_role, self.summary, self.education] + self.skills
        return " ".join(filter(None, parts))

    @property
    def completeness(self) -> float:
        """0-1 score reflecting how much information the profile contains."""
        checks = [
            bool(self.skills),
            self.years_experience > 0,
            bool(self.summary and len(self.summary) > 10),
            bool(self.current_role),
            bool(self.education),
        ]
        return sum(checks) / len(checks)


# ---------------------------------------------------------------------------
# Keyword scorer
# ---------------------------------------------------------------------------

def keyword_score(
    job: JobDescription, candidate: CandidateProfile
) -> Tuple[float, List[str], List[str]]:
    """
    Returns (score 0-1, matched_skills, missing_skills).
    Required skills are weighted 2× over preferred skills.
    """
    req   = _normalise(job.required_skills)
    pref  = _normalise(job.preferred_skills)
    cand  = set(_normalise(candidate.skills))

    req_matched  = [s for s in req  if s in cand]
    pref_matched = [s for s in pref if s in cand]
    req_missing  = [s for s in req  if s not in cand]

    if not req and not pref:
        # Vague JD: no skills specified at all.
        # Return 0.0 so keyword weight still affects final score correctly.
        # The semantic signal will carry the weight instead.
        return 0.0, [], []

    total_weight = len(req) * 2 + len(pref)
    matched_weight = len(req_matched) * 2 + len(pref_matched)
    score = matched_weight / total_weight if total_weight else 0.0

    matched = req_matched + pref_matched
    return min(score, 1.0), matched, req_missing


# ---------------------------------------------------------------------------
# Rule-based scorer
# ---------------------------------------------------------------------------

def rules_score(
    job: JobDescription, candidate: CandidateProfile
) -> Tuple[float, str]:
    """
    Returns (score 0-1, experience_note).
    Penalises underqualification and soft-penalises overqualification.
    """
    exp = candidate.years_experience
    lo  = job.min_experience
    hi  = job.max_experience

    # ── Edge case: empty profile ────────────────────────────────────────
    if candidate.completeness == 0.0:
        return 0.10, (
            "Profile appears empty — no skills, experience, or summary provided. "
            "Cannot assess fit without more information."
        )

    # ── Edge case: overqualified (hard cap) ─────────────────────────────
    if exp > hi + 5:
        score = 0.45
        note  = (
            f"Significantly overqualified ({exp:.0f} yrs vs max {hi} yrs for this role). "
            "High retention risk — consider whether the scope matches their career level."
        )
    elif exp > hi + 2:
        score = 0.62
        note  = (
            f"Potentially overqualified ({exp:.0f} yrs vs ≤{hi} yrs preferred). "
            "Assess retention risk and whether role offers sufficient growth."
        )
    elif exp > hi:
        score = 0.80
        note  = f"Slightly senior ({exp:.0f} yrs vs preferred ≤{hi} yrs). Likely manageable."

    # ── Edge case: underqualified ────────────────────────────────────────
    elif exp < lo:
        gap   = lo - exp
        score = max(0.05, 0.55 - gap * 0.12)
        note  = (
            f"Under-experienced ({exp:.0f} yrs; role needs ≥{lo} yrs). "
            f"Gap of {gap:.0f} yr{'s' if gap != 1 else ''}. "
            "May require mentoring or extended ramp-up."
        )
    else:
        # Sweet spot
        score = 1.0
        note  = f"Experience is a strong fit ({exp:.0f} yrs within the {lo}–{hi} yr window)."

    # Profile completeness modifier: sparse profiles get a confidence penalty
    completeness = candidate.completeness
    if completeness < 0.3:
        score = score * 0.75
    elif completeness < 0.5:
        score = score * 0.88

    score = min(1.0, max(0.0, score))
    return score, note


# ---------------------------------------------------------------------------
# Semantic bridging helpers (no ML model needed here; used for explanation)
# ---------------------------------------------------------------------------

def find_semantic_bridges(
    job: JobDescription, candidate: CandidateProfile, matched: List[str]
) -> List[Dict]:
    """
    Identify skills the candidate has that are *different* from job requirements
    but belong to the same skill category — these are transferable skills.
    """
    job_skills  = set(_normalise(job.all_skills))
    cand_skills = set(_normalise(candidate.skills))
    matched_set = set(_normalise(matched))

    bridges = []
    for cskill in cand_skills - matched_set:
        cat = _category_of(cskill)
        if cat is None:
            continue
        for jskill in job_skills - matched_set:
            if _category_of(jskill) == cat and jskill != cskill:
                bridges.append({
                    "candidate_skill": _display_name(cskill),
                    "job_skill": _display_name(jskill),
                    "category": cat.replace("_", " ").title(),
                })
    # De-duplicate by candidate_skill
    seen = set()
    unique = []
    for b in bridges:
        if b["candidate_skill"] not in seen:
            unique.append(b)
            seen.add(b["candidate_skill"])
    return unique[:5]  # cap at 5 bridges for readability


# ---------------------------------------------------------------------------
# Human-readable explanation builder
# ---------------------------------------------------------------------------

def build_explanation(
    job: JobDescription,
    candidate: CandidateProfile,
    final_score: float,
    keyword_s: float,
    embedding_s: float,
    rules_s: float,
    matched: List[str],
    missing: List[str],
    bridges: List[Dict],
    exp_note: str,
    fit: str,
    weights: Dict[str, float],
) -> str:
    lines = []

    # ---- Headline sentence ------------------------------------------------
    if fit == "STRONG":
        opener = f"{candidate.name} is a strong fit for the {job.title} role."
    elif fit == "MODERATE":
        opener = f"{candidate.name} is a reasonable candidate for the {job.title} role with some gaps."
    else:
        opener = f"{candidate.name} is a weak match for the {job.title} role at this time."
    lines.append(opener)

    # ---- Skill strengths --------------------------------------------------
    if matched:
        lines.append(
            f"Matched skills: {', '.join(_display_name(s) for s in matched[:8])}."
        )

    # ---- Semantic bridges -------------------------------------------------
    if bridges:
        bridge_phrases = [
            f"{b['candidate_skill']} (similar to {b['job_skill']})"
            for b in bridges[:3]
        ]
        lines.append(
            f"Transferable expertise: {', '.join(bridge_phrases)} — "
            "these map into the same domain as required skills."
        )

    # ---- Missing skills ---------------------------------------------------
    if missing:
        lines.append(
            f"Skill gaps: {', '.join(_display_name(s) for s in missing[:5])} "
            "are listed as required but not found on this profile."
        )
    else:
        lines.append("No critical skill gaps identified.")

    # ---- Experience note --------------------------------------------------
    lines.append(exp_note)

  

    return " ".join(lines)


# ---------------------------------------------------------------------------
# Main matching engine (embedding-free core; embeddings are optional overlay)
# ---------------------------------------------------------------------------

class MatchingEngine:
    """
    Stateless matching engine. Embeddings are passed in externally so the
    engine itself has no heavy model dependency (makes testing easy).
    """

    def score(
        self,
        job: JobDescription,
        candidate: CandidateProfile,
        *,
        embedding_similarity: float = 0.5,
    ) -> Dict:
        weights = WEIGHT_PROFILES.get(job.hiring_mode, WEIGHT_PROFILES["default"])

        kw_score, matched, missing = keyword_score(job, candidate)
        rb_score, exp_note         = rules_score(job, candidate)

        # ── Semantic score ────────────────────────────────────────────────
        # If real embeddings are available, use them.
        # If not (embedding_similarity == 0.5 fallback), derive a proxy from:
        #   - skill category overlap (how many domains match)
        #   - profile completeness
        # This ensures modes with high semantic weight (ai=0.5) score
        # differently from modes with low semantic weight (product=0.25)
        # even without a real embedding model.
        if embedding_similarity == 0.5:
            # Proxy: skill category overlap ratio
            job_cats  = {_category_of(s) for s in _normalise(job.all_skills) if _category_of(s)}
            cand_cats = {_category_of(s) for s in _normalise(candidate.skills) if _category_of(s)}
            if job_cats and cand_cats:
                cat_overlap = len(job_cats & cand_cats) / len(job_cats | cand_cats)
                emb_score = 0.3 + cat_overlap * 0.5   # range 0.3 – 0.8
            elif not job_cats:
                # Vague JD: proxy from profile completeness only
                emb_score = 0.3 + candidate.completeness * 0.4
            else:
                emb_score = 0.25  # no category overlap at all
        else:
            emb_score = max(0.0, min(1.0, embedding_similarity))

        # ── Vague JD handling ─────────────────────────────────────────────
        is_vague_jd = len(job.required_skills) == 0 and len(job.preferred_skills) == 0
        if is_vague_jd:
            # Redistribute keyword weight to semantic + rules
            # so the ranking is still meaningful despite missing JD skills
            effective_weights = {
                "keyword":   0.0,
                "embedding": weights["embedding"] + weights["keyword"] * 0.7,
                "rules":     weights["rules"]     + weights["keyword"] * 0.3,
            }
        else:
            effective_weights = weights

        final = (
            effective_weights["keyword"]   * kw_score +
            effective_weights["embedding"] * emb_score +
            effective_weights["rules"]     * rb_score
        )
        final = round(min(final, 1.0), 4)

        # Empty profile penalty
        confidence = candidate.completeness
        if confidence == 0.0:
            final = 0.05
        elif confidence < 0.4:
            final = final * 0.82

        fit = "STRONG" if final >= 0.65 else "MODERATE" if final >= 0.40 else "WEAK"

        bridges = find_semantic_bridges(job, candidate, matched)

        explanation = build_explanation(
            job, candidate, final,
            kw_score, emb_score, rb_score,
            matched, missing, bridges,
            exp_note, fit, weights,
        )

        # Skill recommendations: missing required + bridging suggestions
        recommendations = []
        for ms in missing[:3]:
            category = _category_of(ms)
            if category:
                recommendations.append(
                    f"Consider learning {_display_name(ms)} — it falls under {category.replace('_',' ').title()}, "
                    f"an area where you already have relevant exposure."
                )
            else:
                recommendations.append(f"Adding {_display_name(ms)} to your skill set would strengthen this application.")

        return {
            "candidate_id":   candidate.id,
            "candidate_name": candidate.name,
            "score":          final,
            "fit":            fit,
            "confidence":     round(confidence, 2),
            "breakdown": {
                "keyword_score":   round(kw_score, 4),
                "semantic_score":  round(emb_score, 4),
                "rules_score":     round(rb_score, 4),
                "weights":         weights,
            },
            "details": {
                "matched_skills":     [_display_name(s) for s in matched],
                "missing_skills":     [_display_name(s) for s in missing],
                "semantic_bridges":   bridges,
                "experience_note":    exp_note,
                "profile_completeness": f"{round(confidence * 100)}%",
                "skill_recommendations": recommendations,
            },
            "explanation": explanation,
        }

    def rank(
        self,
        job: JobDescription,
        candidates: List[CandidateProfile],
        *,
        embedding_similarities: Optional[Dict[str, float]] = None,
    ) -> List[Dict]:
        results = []
        for c in candidates:
            emb_sim = (embedding_similarities or {}).get(c.id, 0.5)
            results.append(self.score(job, c, embedding_similarity=emb_sim))

        results.sort(key=lambda r: r["score"], reverse=True)

        # Attach rank and comparison note
        for i, r in enumerate(results):
            r["rank"] = i + 1
            if i > 0:
                prev = results[i - 1]
                gap  = prev["score"] - r["score"]
                if gap > 0.1:
                    r["vs_above"] = (
                        f"Ranks below {prev['candidate_name']} primarily due to "
                        f"{'lower skill coverage' if prev['breakdown']['keyword_score'] > r['breakdown']['keyword_score'] else 'experience or semantic gap'} "
                        f"({gap:.0%} score gap)."
                    )
                else:
                    r["vs_above"] = (
                        f"Very close to {prev['candidate_name']} — minor differences in skill overlap."
                    )
        return results


# Singleton
engine = MatchingEngine()