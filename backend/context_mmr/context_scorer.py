#!/usr/bin/env python3
"""
Context Scoring & MMR Uplift v1 - Context Scorer
Context-aware scoring system with Safety 40 / Trust 30 / Context 20 / Popularity 10 weights
"""

import logging
import statistics
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass

from .feature_extractor import ContextFeatures, feature_extractor

@dataclass
class ScoreBreakdown:
    """Detailed score breakdown for debugging"""
    safety: float = 0.0
    trust: float = 0.0  
    context: float = 0.0
    popularity: float = 0.0
    total: float = 0.0

class ContextScorer:
    """Context-aware recipe scoring system"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Global scoring weights
        self.weights = {
            "safety": 40,      # Safety Gate score
            "trust": 30,       # Domain trust + page health
            "context": 20,     # Context-specific features
            "popularity": 10   # Reviews/ratings
        }
        
        # Median values for missing data imputation (updated as we get more data)
        self.median_values = {
            "prep_time_minutes": 30,
            "ingredients_count": 8,
            "steps_count": 6,
            "calories_per_serving": 300,
            "protein_grams": 15,
            "avg_instruction_length": 50,
            "visual_score": 0.5
        }
        
        # Context-specific scoring rules
        self.context_rules = {
            "時短": self._score_time_saving,
            "健康": self._score_health,
            "初心者": self._score_beginner,
            "イベント": self._score_event
        }
    
    def score_recipe_with_context(
        self, 
        recipe_data: Dict[str, Any], 
        context: Optional[str] = None,
        domain_policy = None
    ) -> Tuple[float, ScoreBreakdown, ContextFeatures]:
        """
        Score recipe with context awareness
        
        Args:
            recipe_data: Recipe data with safety, url, etc.
            context: Selected context (時短/健康/初心者/イベント)
            domain_policy: Domain policy object for trust scoring
            
        Returns:
            Tuple of (final_score, score_breakdown, context_features)
        """
        
        # Extract context-specific features
        features = feature_extractor.extract_all_features(recipe_data)
        
        # Initialize score breakdown
        breakdown = ScoreBreakdown()
        
        # Safety Score (40 points max)
        breakdown.safety = self._calculate_safety_score(recipe_data)
        
        # Trust Score (30 points max)
        breakdown.trust = self._calculate_trust_score(recipe_data, features, domain_policy)
        
        # Context Score (20 points max)
        breakdown.context = self._calculate_context_score(features, context)
        
        # Popularity Score (10 points max)
        breakdown.popularity = self._calculate_popularity_score(features)
        
        # Total score
        breakdown.total = breakdown.safety + breakdown.trust + breakdown.context + breakdown.popularity
        
        # Normalize to 0-100 range (should already be within range)
        final_score = max(0, min(100, breakdown.total))
        
        return final_score, breakdown, features
    
    def _calculate_safety_score(self, recipe_data: Dict[str, Any]) -> float:
        """Calculate safety component score (0-40)"""
        
        safety_info = recipe_data.get("safety", {})
        status = safety_info.get("status", "ok")
        
        if status == "ok":
            return 40.0
        elif status == "ambiguous":
            return 0.0  # Should be filtered out before ranking
        elif status == "ng":
            return float('-inf')  # Should be filtered out before ranking
        else:
            return 20.0  # Unknown status, conservative score
    
    def _calculate_trust_score(
        self, 
        recipe_data: Dict[str, Any], 
        features: ContextFeatures, 
        domain_policy = None
    ) -> float:
        """Calculate trust component score (0-30)"""
        
        trust_score = 0.0
        
        # Domain trust (0-15 points)
        url = recipe_data.get("url", "")
        if domain_policy and url:
            policy = domain_policy.get_domain_policy(url)
            
            if policy.policy_type == "prefer":
                # High-trust domains
                domain_trust = 15.0 * min(1.0, policy.boost_factor / 1.5)
            elif policy.policy_type == "exclude":
                # Low-trust domains (should be filtered but handle gracefully)
                domain_trust = 15.0 * policy.boost_factor  # Will be low (0.1-0.2)
            else:
                # Neutral domains
                domain_trust = 10.0
        else:
            domain_trust = 10.0  # Default for unknown domains
        
        trust_score += domain_trust
        
        # Structured data bonus (0-10 points)
        if features.extraction_sources:
            if "jsonld" in features.extraction_sources:
                structured_bonus = 10.0
            elif "microdata" in features.extraction_sources:
                structured_bonus = 7.0
            else:
                structured_bonus = 3.0  # HTML heuristics only
        else:
            structured_bonus = 0.0
        
        trust_score += structured_bonus
        
        # Completion penalty (0-5 points)
        completion_bonus = features.completion_score * 5.0
        trust_score += completion_bonus
        
        return min(30.0, trust_score)
    
    def _calculate_context_score(
        self, 
        features: ContextFeatures, 
        context: Optional[str]
    ) -> float:
        """Calculate context-specific score (0-20)"""
        
        if not context or context not in self.context_rules:
            # No context selected, use general quality score
            return self._score_general_quality(features)
        
        # Apply context-specific scoring
        scoring_func = self.context_rules[context]
        return scoring_func(features)
    
    def _score_time_saving(self, features: ContextFeatures) -> float:
        """Score for time-saving context (0-20)"""
        
        score = 0.0
        
        # Prep time scoring (0-10 points) - lower is better
        prep_time = features.prep_time_minutes or self.median_values["prep_time_minutes"]
        if prep_time <= 15:
            score += 10.0
        elif prep_time <= 30:
            score += 7.0
        elif prep_time <= 45:
            score += 4.0
        else:
            score += 1.0
        
        # Ingredients count (0-5 points) - fewer is better for time-saving
        ingredients_count = features.ingredients_count or self.median_values["ingredients_count"]
        if ingredients_count <= 5:
            score += 5.0
        elif ingredients_count <= 8:
            score += 3.0
        else:
            score += 1.0
        
        # Steps count (0-5 points) - fewer steps is faster
        steps_count = features.steps_count or self.median_values["steps_count"]
        if steps_count <= 4:
            score += 5.0
        elif steps_count <= 6:
            score += 3.0
        else:
            score += 1.0
        
        return min(20.0, score)
    
    def _score_health(self, features: ContextFeatures) -> float:
        """Score for health context (0-20)"""
        
        score = 0.0
        
        # Nutrition data presence (0-8 points)
        if features.macros_present:
            score += 5.0
            
            # Protein content bonus (high protein is healthy)
            if features.protein_grams and features.protein_grams >= 20:
                score += 3.0
        
        # Health keywords bonus (0-7 points)
        health_keyword_count = len(features.health_keywords or [])
        score += min(7.0, health_keyword_count * 2.0)
        
        # Calorie awareness (0-5 points)
        if features.calories_per_serving:
            calories = features.calories_per_serving
            if 150 <= calories <= 400:  # Reasonable calorie range
                score += 5.0
            elif 100 <= calories <= 600:  # Acceptable range
                score += 3.0
            else:
                score += 1.0
        
        return min(20.0, score)
    
    def _score_beginner(self, features: ContextFeatures) -> float:
        """Score for beginner context (0-20)"""
        
        score = 0.0
        
        # Steps count (0-8 points) - fewer steps for beginners
        steps_count = features.steps_count or self.median_values["steps_count"]
        if steps_count <= 4:
            score += 8.0
        elif steps_count <= 6:
            score += 5.0
        elif steps_count <= 8:
            score += 3.0
        else:
            score += 1.0
        
        # Beginner keywords (0-7 points)
        beginner_keyword_count = len(features.beginner_keywords or [])
        score += min(7.0, beginner_keyword_count * 2.5)
        
        # Instruction clarity (0-5 points)
        if features.avg_instruction_length:
            avg_length = features.avg_instruction_length
            if 30 <= avg_length <= 80:  # Good detail level for beginners
                score += 5.0
            elif 20 <= avg_length <= 120:  # Acceptable
                score += 3.0
            else:
                score += 1.0
        
        return min(20.0, score)
    
    def _score_event(self, features: ContextFeatures) -> float:
        """Score for event context (0-20)"""
        
        score = 0.0
        
        # Visual appeal (0-8 points)
        if features.visual_score:
            score += features.visual_score * 8.0
        
        # Event keywords (0-7 points)
        event_keyword_count = len(features.event_keywords or [])
        score += min(7.0, event_keyword_count * 2.5)
        
        # Popularity bonus (0-5 points)
        if features.popularity_score:
            score += min(5.0, features.popularity_score * 2.0)
        
        return min(20.0, score)
    
    def _score_general_quality(self, features: ContextFeatures) -> float:
        """General quality score when no specific context is selected (0-20)"""
        
        score = 0.0
        
        # Completeness bonus
        score += features.completion_score * 10.0
        
        # Balanced feature presence
        if features.ingredients_count and features.steps_count:
            score += 5.0
        
        if features.calories_per_serving or features.macros_present:
            score += 3.0
        
        if features.visual_score and features.visual_score > 0.5:
            score += 2.0
        
        return min(20.0, score)
    
    def _calculate_popularity_score(self, features: ContextFeatures) -> float:
        """Calculate popularity component score (0-10)"""
        
        if features.popularity_score:
            # Scale popularity score to 0-10 range
            return min(10.0, features.popularity_score * 2.0)
        
        # Default score for recipes without popularity data
        return 5.0
    
    def update_median_values(self, recipe_batch: List[ContextFeatures]):
        """Update median values for imputation from actual data"""
        
        if not recipe_batch:
            return
        
        # Collect non-None values for each field
        field_values = {}
        
        for features in recipe_batch:
            for field_name, field_value in features.__dict__.items():
                if field_name in self.median_values and field_value is not None:
                    if field_name not in field_values:
                        field_values[field_name] = []
                    field_values[field_name].append(field_value)
        
        # Update medians
        for field_name, values in field_values.items():
            if len(values) >= 3:  # Need at least 3 values for meaningful median
                self.median_values[field_name] = statistics.median(values)
                self.logger.info(f"Updated median {field_name}: {self.median_values[field_name]}")

# Global context scorer instance
context_scorer = ContextScorer()

if __name__ == "__main__":
    # Test context scorer
    from .feature_extractor import ContextFeatures
    
    # Mock recipe data
    recipe_data = {
        "safety": {"status": "ok", "allergens": [], "reasons": [], "hits": []},
        "url": "https://cookpad.com/recipe/123",
        "title": "簡単パンケーキレシピ 15分",
    }
    
    # Mock features
    features = ContextFeatures(
        prep_time_minutes=15,
        ingredients_count=5,
        steps_count=4,
        health_keywords=["高たんぱく"],
        beginner_keywords=["簡単"],
        completion_score=0.8
    )
    
    scorer = ContextScorer()
    
    # Test different contexts
    contexts = ["時短", "健康", "初心者", "イベント", None]
    
    print("=== Context Scorer Test ===")
    
    for context in contexts:
        score, breakdown, _ = scorer.score_recipe_with_context(recipe_data, context)
        
        print(f"\nContext: {context or 'None'}")
        print(f"  Total Score: {score:.1f}")
        print(f"  Safety: {breakdown.safety:.1f}")
        print(f"  Trust: {breakdown.trust:.1f}")
        print(f"  Context: {breakdown.context:.1f}")
        print(f"  Popularity: {breakdown.popularity:.1f}")
    
    print(f"\nMedian values: {scorer.median_values}")