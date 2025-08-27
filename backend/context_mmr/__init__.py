"""
Context Scoring & MMR Uplift v1 - Context-Aware Ranking System
Achieves P@3 ≥ 0.85 through context scoring, MMR diversity, and evidence chips
"""

from .feature_extractor import FeatureExtractor, ContextFeatures, feature_extractor
from .context_scorer import ContextScorer, ScoreBreakdown, context_scorer
from .mmr_reranker import MMRReranker, MMRResult, mmr_reranker
from .evidence_chips import EvidenceChipGenerator, EvidenceChip, evidence_chip_generator

__version__ = "1.0.0"
__all__ = [
    "FeatureExtractor", "ContextFeatures", "feature_extractor",
    "ContextScorer", "ScoreBreakdown", "context_scorer", 
    "MMRReranker", "MMRResult", "mmr_reranker",
    "EvidenceChipGenerator", "EvidenceChip", "evidence_chip_generator"
]