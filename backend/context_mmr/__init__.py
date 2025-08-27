"""
Context Scoring & MMR Uplift v1.1 - Enhanced Context-Aware Ranking System
Achieves P@3 ≥ 0.85 through context gates, enhanced scoring, and hard diversity
"""

from .feature_extractor import FeatureExtractor, ContextFeatures, feature_extractor
from .context_scorer import ContextScorer, ScoreBreakdown, context_scorer
from .context_gates import ContextGates, ContextGateResult, context_gates
from .mmr_reranker import MMRReranker, MMRResult, mmr_reranker
from .evidence_chips import EvidenceChipGenerator, EvidenceChip, evidence_chip_generator

__version__ = "1.1.0"
__all__ = [
    "FeatureExtractor", "ContextFeatures", "feature_extractor",
    "ContextScorer", "ScoreBreakdown", "context_scorer",
    "ContextGates", "ContextGateResult", "context_gates",
    "MMRReranker", "MMRResult", "mmr_reranker",
    "EvidenceChipGenerator", "EvidenceChip", "evidence_chip_generator"
]