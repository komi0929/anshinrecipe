#!/usr/bin/env python3
"""
Context Scoring & MMR Uplift v1 - Evidence Chips Generator
Generates context-specific evidence chips for recipe cards
"""

import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

from .feature_extractor import ContextFeatures

@dataclass
class EvidenceChip:
    """Evidence chip for recipe card display"""
    text: str
    type: str  # "time", "health", "beginner", "event", "quality"
    color: str  # "green", "blue", "orange", "purple", "gray"
    icon: Optional[str] = None

class EvidenceChipGenerator:
    """Generates context-appropriate evidence chips for recipe cards"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Chip thresholds and rules
        self.thresholds = {
            "fast_prep_minutes": 20,
            "few_ingredients": 6,
            "few_steps": 5,
            "high_protein_grams": 15,
            "low_calorie_max": 300,
            "good_visual_score": 0.6
        }
    
    def generate_chips(
        self, 
        features: ContextFeatures, 
        context: Optional[str] = None,
        score_breakdown: Optional[Dict[str, float]] = None
    ) -> List[EvidenceChip]:
        """
        Generate evidence chips based on features and context
        
        Args:
            features: Extracted context features
            context: Selected context (時短/健康/初心者/イベント)
            score_breakdown: Optional score breakdown for quality indicators
            
        Returns:
            List of EvidenceChip objects
        """
        
        chips = []
        
        # Context-specific chips
        if context == "時短":
            chips.extend(self._generate_time_saving_chips(features))
        elif context == "健康":
            chips.extend(self._generate_health_chips(features))
        elif context == "初心者":
            chips.extend(self._generate_beginner_chips(features))
        elif context == "イベント":
            chips.extend(self._generate_event_chips(features))
        
        # General quality chips (always shown)
        chips.extend(self._generate_quality_chips(features, score_breakdown))
        
        # Limit to max 3-4 chips per card to avoid clutter
        return chips[:4]
    
    def _generate_time_saving_chips(self, features: ContextFeatures) -> List[EvidenceChip]:
        """Generate chips for time-saving context"""
        
        chips = []
        
        # Prep time chip
        if features.prep_time_minutes:
            if features.prep_time_minutes <= self.thresholds["fast_prep_minutes"]:
                chips.append(EvidenceChip(
                    text=f"{features.prep_time_minutes}分",
                    type="time",
                    color="green",
                    icon="clock"
                ))
            else:
                chips.append(EvidenceChip(
                    text=f"{features.prep_time_minutes}分",
                    type="time", 
                    color="blue",
                    icon="clock"
                ))
        
        # Ingredients count chip
        if features.ingredients_count:
            if features.ingredients_count <= self.thresholds["few_ingredients"]:
                chips.append(EvidenceChip(
                    text=f"材料{features.ingredients_count}個",
                    type="time",
                    color="green",
                    icon="list"
                ))
            else:
                chips.append(EvidenceChip(
                    text=f"材料{features.ingredients_count}個",
                    type="time",
                    color="blue", 
                    icon="list"
                ))
        
        # Steps count chip
        if features.steps_count:
            if features.steps_count <= self.thresholds["few_steps"]:
                chips.append(EvidenceChip(
                    text=f"手順{features.steps_count}つ",
                    type="time",
                    color="green",
                    icon="check-list"
                ))
        
        return chips
    
    def _generate_health_chips(self, features: ContextFeatures) -> List[EvidenceChip]:
        """Generate chips for health context"""
        
        chips = []
        
        # Nutrition info availability
        if features.macros_present:
            chips.append(EvidenceChip(
                text="栄養情報あり",
                type="health",
                color="green",
                icon="bar-chart"
            ))
        
        # High protein
        if features.protein_grams and features.protein_grams >= self.thresholds["high_protein_grams"]:
            chips.append(EvidenceChip(
                text="高たんぱく",
                type="health",
                color="blue",
                icon="muscle"
            ))
        
        # Low calorie
        if features.calories_per_serving and features.calories_per_serving <= self.thresholds["low_calorie_max"]:
            chips.append(EvidenceChip(
                text="低カロリー",
                type="health",
                color="green",
                icon="heart"
            ))
        
        # Health keywords
        if features.health_keywords:
            # Show the first meaningful health keyword
            priority_keywords = ["高たんぱく", "低糖質", "食物繊維", "低カロリー"]
            for keyword in priority_keywords:
                if keyword in features.health_keywords:
                    chips.append(EvidenceChip(
                        text=keyword,
                        type="health",
                        color="blue",
                        icon="heart"
                    ))
                    break
        
        return chips
    
    def _generate_beginner_chips(self, features: ContextFeatures) -> List[EvidenceChip]:
        """Generate chips for beginner context"""
        
        chips = []
        
        # Few steps indicator
        if features.steps_count and features.steps_count <= self.thresholds["few_steps"]:
            chips.append(EvidenceChip(
                text=f"手順{features.steps_count}つ",
                type="beginner",
                color="green",
                icon="check-list"
            ))
        
        # Beginner-friendly keywords
        if features.beginner_keywords:
            if "簡単" in features.beginner_keywords:
                chips.append(EvidenceChip(
                    text="簡単",
                    type="beginner",
                    color="green",
                    icon="star"
                ))
            elif "初心者" in features.beginner_keywords:
                chips.append(EvidenceChip(
                    text="初心者向け",
                    type="beginner",
                    color="blue",
                    icon="user"
                ))
        
        # Clear instructions
        if features.avg_instruction_length and 30 <= features.avg_instruction_length <= 80:
            chips.append(EvidenceChip(
                text="丁寧な説明",
                type="beginner",
                color="blue",
                icon="book"
            ))
        
        return chips
    
    def _generate_event_chips(self, features: ContextFeatures) -> List[EvidenceChip]:
        """Generate chips for event context"""
        
        chips = []
        
        # Visual quality
        if features.visual_score:
            if features.visual_score >= self.thresholds["good_visual_score"]:
                chips.append(EvidenceChip(
                    text="写真品質 良",
                    type="event",
                    color="purple",
                    icon="camera"
                ))
            else:
                chips.append(EvidenceChip(
                    text="写真品質 可",
                    type="event",
                    color="gray",
                    icon="camera"
                ))
        
        # Event keywords
        if features.event_keywords:
            priority_event_keywords = ["映え", "華やか", "パーティー", "おもてなし"]
            for keyword in priority_event_keywords:
                if keyword in features.event_keywords:
                    chips.append(EvidenceChip(
                        text=keyword,
                        type="event",
                        color="purple",
                        icon="star"
                    ))
                    break
        
        # Popularity indicator
        if features.popularity_score and features.popularity_score > 3.0:
            chips.append(EvidenceChip(
                text="人気",
                type="event",
                color="orange",
                icon="trending-up"
            ))
        
        return chips
    
    def _generate_quality_chips(
        self, 
        features: ContextFeatures, 
        score_breakdown: Optional[Dict[str, float]]
    ) -> List[EvidenceChip]:
        """Generate general quality indicator chips"""
        
        chips = []
        
        # Structured data quality
        if features.extraction_sources:
            if "jsonld" in features.extraction_sources:
                chips.append(EvidenceChip(
                    text="詳細データ",
                    type="quality",
                    color="green",
                    icon="check-circle"
                ))
        
        # High completion score
        if features.completion_score >= 0.7:
            chips.append(EvidenceChip(
                text="情報充実",
                type="quality",
                color="blue",
                icon="info"
            ))
        
        # Trust score indicator (if available)
        if score_breakdown and score_breakdown.get("trust", 0) >= 25:
            chips.append(EvidenceChip(
                text="信頼サイト",
                type="quality",
                color="green",
                icon="shield"
            ))
        
        return chips
    
    def chips_to_dict(self, chips: List[EvidenceChip]) -> List[Dict[str, str]]:
        """Convert evidence chips to dictionary format for JSON serialization"""
        
        return [
            {
                "text": chip.text,
                "type": chip.type,
                "color": chip.color,
                "icon": chip.icon or ""
            }
            for chip in chips
        ]

# Global evidence chip generator instance
evidence_chip_generator = EvidenceChipGenerator()

if __name__ == "__main__":
    # Test evidence chip generator
    from .feature_extractor import ContextFeatures
    
    # Mock features for different contexts
    test_features = ContextFeatures(
        prep_time_minutes=15,
        ingredients_count=5,
        steps_count=4,
        calories_per_serving=250,
        protein_grams=18,
        health_keywords=["高たんぱく", "低糖質"],
        beginner_keywords=["簡単", "初心者"],
        event_keywords=["映え", "パーティー"],
        visual_score=0.8,
        popularity_score=4.2,
        macros_present=True,
        extraction_sources=["jsonld"],
        completion_score=0.85
    )
    
    mock_score_breakdown = {
        "safety": 40.0,
        "trust": 28.0,
        "context": 18.0,
        "popularity": 8.0
    }
    
    generator = EvidenceChipGenerator()
    
    contexts = ["時短", "健康", "初心者", "イベント", None]
    
    print("=== Evidence Chip Generator Test ===")
    
    for context in contexts:
        chips = generator.generate_chips(test_features, context, mock_score_breakdown)
        
        print(f"\nContext: {context or 'None'}")
        print(f"Generated chips: {len(chips)}")
        
        for chip in chips:
            print(f"  • {chip.text} ({chip.type}, {chip.color})")
        
        # Test dictionary conversion
        chip_dicts = generator.chips_to_dict(chips)
        print(f"  JSON format: {chip_dicts[0] if chip_dicts else 'None'}")