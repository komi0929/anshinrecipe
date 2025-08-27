"""
Safety Gate 2.0 - Strict Allergen Exclusion with Evidence
"""

from .allergen_dictionaries import AllergenDictionaries
from .safety_engine import SafetyEngine, SafetyResult, AllergenHit

__version__ = "2.0.0"
__all__ = ["AllergenDictionaries", "SafetyEngine", "SafetyResult", "AllergenHit"]