"""
Embedding Service

convert text → numbers so we can compare meaning

FAISS:
used for fast similarity search between vectors

Index used:
IndexFlatIP → checks all vectors (accurate but slower for large data)
for bigger scale → use IndexIVFFlat or IndexHNSWFlat

model:
all-MiniLM-L6-v2 → small, fast, works on CPU
"""

from __future__ import annotations
import logging
from typing import Dict, List, Optional
import numpy as np

logger = logging.getLogger(__name__)

# try importing heavy libs (if missing, system still runs)
try:
    from sentence_transformers import SentenceTransformer
    import faiss
    _DEPS_AVAILABLE = True
except ImportError:
    _DEPS_AVAILABLE = False
    logger.warning("missing sentence-transformers/faiss → semantic score = 0.5")

MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIM = 384


class EmbeddingService:
    """handles text → vector + similarity search"""

    def __init__(self) -> None:
        self._model: Optional[object] = None
        self._index: Optional[object] = None
        self._id_to_row: Dict[str, int] = {}
        self._row_to_id: Dict[int, str] = {}
        self._embeddings: Dict[str, np.ndarray] = {}

    # load model only when needed
    def _load_model(self) -> None:
        if not _DEPS_AVAILABLE:
            return
        if self._model is None:
            logger.info("loading model...")
            self._model = SentenceTransformer(MODEL_NAME)

    # build FAISS index from embeddings
    def _build_index(self) -> None:
        if not _DEPS_AVAILABLE or not self._embeddings:
            return
        rows = sorted(self._id_to_row.items(), key=lambda x: x[1])
        matrix = np.stack([self._embeddings[cid] for cid, _ in rows]).astype("float32")
        faiss.normalize_L2(matrix)
        index = faiss.IndexFlatIP(EMBEDDING_DIM)  # brute force search
        index.add(matrix)
        self._index = index

    # convert text → vector
    def encode_text(self, text: str) -> Optional[np.ndarray]:
        if not _DEPS_AVAILABLE:
            return None
        self._load_model()
        vec = self._model.encode([text], convert_to_numpy=True)[0].astype("float32")
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm
        return vec

# add candidates and build embeddings
    def add_candidates(self, candidate_texts: Dict[str, str]) -> None:
        if not _DEPS_AVAILABLE:
            return
        self._load_model()
        ids = list(candidate_texts.keys())
        texts = list(candidate_texts.values())
        vecs = self._model.encode(texts, convert_to_numpy=True, batch_size=16).astype("float32")

        new_vecs = []
        for cid, vec in zip(ids, vecs):
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            self._embeddings[cid] = vec
            if cid not in self._id_to_row:
                row = len(self._id_to_row)
                self._id_to_row[cid] = row
                self._row_to_id[row] = cid
                new_vecs.append(vec)

        if new_vecs and _DEPS_AVAILABLE:
            matrix = np.stack(new_vecs).astype("float32")
            faiss.normalize_L2(matrix)
            if self._index is None:
                self._index = faiss.IndexFlatIP(EMBEDDING_DIM)
            self._index.add(matrix)

    # get similarity of job with all candidates
    def similarities_for_job(
        self, job_text: str, candidate_ids: Optional[List[str]] = None
    ) -> Dict[str, float]:

        if not _DEPS_AVAILABLE or self._index is None:
            target_ids = candidate_ids or list(self._embeddings.keys())
            return {cid: 0.5 for cid in target_ids}

        job_vec = self.encode_text(job_text)
        if job_vec is None:
            return {cid: 0.5 for cid in (candidate_ids or self._embeddings.keys())}

        job_vec = job_vec.reshape(1, -1).astype("float32")

        if candidate_ids is None:
            scores, indices = self._index.search(job_vec, self._index.ntotal)
            result = {}
            for score, idx in zip(scores[0], indices[0]):
                cid = self._row_to_id.get(idx)
                if cid:
                    result[cid] = float(np.clip(score, 0, 1))
            for cid in self._embeddings:
                result.setdefault(cid, 0.5)
            return result
        else:
            result = {}
            for cid in candidate_ids:
                if cid in self._embeddings:
                    sim = float(np.dot(job_vec[0], self._embeddings[cid]))
                    result[cid] = float(np.clip(sim, 0, 1))
                else:
                    result[cid] = 0.5
            return result

    # similarity between two texts
    def similarity_pair(self, text_a: str, text_b: str) -> float:
        if not _DEPS_AVAILABLE:
            return 0.5
        self._load_model()
        vecs = self._model.encode([text_a, text_b], convert_to_numpy=True).astype("float32")
        a, b = vecs[0], vecs[1]
        norm_a, norm_b = np.linalg.norm(a), np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.clip(np.dot(a / norm_a, b / norm_b), 0, 1))

    @property
    def candidate_count(self) -> int:
        return len(self._embeddings)

    def is_ready(self) -> bool:
        return _DEPS_AVAILABLE and self._model is not None


embedding_service = EmbeddingService()