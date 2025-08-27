#!/usr/bin/env python3
"""
Context Scoring & MMR Uplift v1.1 - Context Gates
Fail-fast thresholds with penalties for context relevance
"""

import re
import logging
from typing import Dict, List, Any, Tuple, Optional
from dataclasses import dataclass

from .feature_extractor import ContextFeatures

@dataclass
class ContextGateResult:
    """Result of context gate evaluation"""
    passed: bool
    penalty: float  # 0, -4, or -8
    reasons: List[str]
    bonus_points: float = 0.0

class ContextGates:
    """Context-specific gates with fail-fast thresholds"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Gate thresholds
        self.thresholds = {
            # Time-saving gates
            "time_saving_time_pass": 20,      # ≤20 min pass
            "time_saving_time_soft": 30,      # 21-30 min soft fail (-4)
            "time_saving_ingredients_pass": 9, # ≤9 ingredients pass
            "time_saving_ingredients_soft": 12, # 10-12 soft fail (-4)
            
            # Beginner gates  
            "beginner_steps_pass": 6,         # ≤6 steps pass
            "beginner_steps_soft": 9,         # 7-9 steps soft fail (-4)
            
            # Health gates
            "health_calories_excellent": 200,  # ≤200 cal bonus (+5)
            "health_calories_good": 350,      # 201-350 cal bonus (+2)
            "health_calories_soft": 500,      # 351-500 cal soft fail (-4)
            
            # Event gates
            "event_visual_pass": 0.5,         # ≥0.5 visual score pass
        }
        
        # Context-specific keywords
        self.context_keywords = {
            "time_saving": ["時短", "5分", "10分", "フライパン1つ", "レンジ", "簡単", "手軽"],
            "beginner": ["簡単", "初心者", "失敗しない", "基本", "混ぜるだけ"],
            "health": ["高たんぱく", "低糖質", "低カロリー", "食物繊維", "オートミール", "豆腐", "低脂質"],
            "event": ["映え", "デコレーション", "ホール", "誕生日", "パーティ", "華やか", "クリスマス"]
        }
        
        # Health proxy ingredients (when calories missing)
        self.health_proxy_ingredients = [
            "豆腐", "オートミール", "鶏むね", "ささみ", "ブロッコリー", 
            "キノコ", "こんにゃく", "寒天", "もやし"
        ]
    
    def evaluate_context_gates(
        self, 
        features: ContextFeatures, 
        context: Optional[str], 
        recipe_data: Dict[str, Any]
    ) -> ContextGateResult:
        """
        Evaluate context gates and return penalties/bonuses
        
        Args:
            features: Extracted context features
            context: Selected context (時短/健康/初心者/イベント)
            recipe_data: Full recipe data for additional checks
            
        Returns:
            ContextGateResult with pass/fail status and penalty
        """
        
        if not context:
            # No context selected, no gates to evaluate
            return ContextGateResult(passed=True, penalty=0.0, reasons=[])
        
        # Map context names
        context_map = {
            "時短": "time_saving",
            "健康": "health", 
            "初心者": "beginner",
            "イベント": "event"
        }
        
        context_key = context_map.get(context)
        if not context_key:
            return ContextGateResult(passed=True, penalty=0.0, reasons=["unknown_context"])
        
        # Apply context-specific gates
        if context_key == "time_saving":
            return self._evaluate_time_saving_gates(features, recipe_data)
        elif context_key == "beginner":
            return self._evaluate_beginner_gates(features, recipe_data)
        elif context_key == "health":
            return self._evaluate_health_gates(features, recipe_data)
        elif context_key == "event":
            return self._evaluate_event_gates(features, recipe_data)
        
        return ContextGateResult(passed=True, penalty=0.0, reasons=["no_gates_defined"])
    
    def _evaluate_time_saving_gates(
        self, 
        features: ContextFeatures, 
        recipe_data: Dict[str, Any]
    ) -> ContextGateResult:
        """Evaluate time-saving context gates"""
        
        reasons = []
        penalty = 0.0
        bonus = 0.0
        
        # Time gate: totalTime or prepTime ≤ 20 min
        prep_time = features.prep_time_minutes or features.total_time_minutes
        
        if prep_time is None:
            # Extract time from text as fallback
            prep_time = self._extract_time_from_text(recipe_data)
        
        if prep_time is not None:
            if prep_time <= self.thresholds["time_saving_time_pass"]:
                reasons.append(f"time_pass_{prep_time}min")
            elif prep_time <= self.thresholds["time_saving_time_soft"]:
                penalty += 4.0
                reasons.append(f"time_soft_fail_{prep_time}min")
            else:
                penalty += 8.0
                reasons.append(f"time_hard_fail_{prep_time}min")
        else:
            penalty += 8.0
            reasons.append("time_missing")
        
        # Ingredients gate: ≤ 9 ingredients
        ingredients_count = features.ingredients_count
        
        if ingredients_count is None:
            # Extract ingredients count from text as fallback
            ingredients_count = self._extract_ingredients_count_from_text(recipe_data)
        
        if ingredients_count is not None:
            if ingredients_count <= self.thresholds["time_saving_ingredients_pass"]:
                reasons.append(f"ingredients_pass_{ingredients_count}")
            elif ingredients_count <= self.thresholds["time_saving_ingredients_soft"]:
                penalty += 4.0
                reasons.append(f"ingredients_soft_fail_{ingredients_count}")
            else:
                penalty += 8.0
                reasons.append(f"ingredients_hard_fail_{ingredients_count}")
        else:
            penalty += 8.0
            reasons.append("ingredients_missing")
        
        passed = penalty == 0.0
        
        return ContextGateResult(
            passed=passed,
            penalty=penalty,
            reasons=reasons,
            bonus_points=bonus
        )
    
    def _evaluate_beginner_gates(
        self, 
        features: ContextFeatures, 
        recipe_data: Dict[str, Any]
    ) -> ContextGateResult:
        """Evaluate beginner context gates"""
        
        reasons = []
        penalty = 0.0
        bonus = 0.0
        
        # Steps gate: ≤ 6 steps
        steps_count = features.steps_count
        
        if steps_count is None:
            # Extract steps from text as fallback
            steps_count = self._extract_steps_count_from_text(recipe_data)
        
        if steps_count is not None:
            if steps_count <= self.thresholds["beginner_steps_pass"]:
                reasons.append(f"steps_pass_{steps_count}")
            elif steps_count <= self.thresholds["beginner_steps_soft"]:
                penalty += 4.0
                reasons.append(f"steps_soft_fail_{steps_count}")
            else:
                penalty += 8.0
                reasons.append(f"steps_hard_fail_{steps_count}")
        else:
            penalty += 8.0
            reasons.append("steps_missing")
        
        # Title tokens bonus: 簡単|初心者|失敗しない|基本 → +2
        title = recipe_data.get("title", "")
        beginner_keywords = self.context_keywords["beginner"]
        
        found_keywords = []
        for keyword in beginner_keywords:
            if keyword in title:
                found_keywords.append(keyword)
        
        if found_keywords:
            bonus += 2.0
            reasons.append(f"title_bonus_{','.join(found_keywords)}")
        
        passed = penalty == 0.0
        
        return ContextGateResult(
            passed=passed,
            penalty=penalty,
            reasons=reasons,
            bonus_points=bonus
        )
    
    def _evaluate_health_gates(
        self, 
        features: ContextFeatures, 
        recipe_data: Dict[str, Any]
    ) -> ContextGateResult:
        """Evaluate health context gates"""
        
        reasons = []
        penalty = 0.0
        bonus = 0.0
        
        # Calories gate with bonus/penalty system
        calories = features.calories_per_serving
        
        if calories is None:
            # Extract calories from text as fallback
            calories = self._extract_calories_from_text(recipe_data)
        
        if calories is not None:
            if calories <= self.thresholds["health_calories_excellent"]:
                bonus += 5.0
                reasons.append(f"calories_excellent_{calories}")
            elif calories <= self.thresholds["health_calories_good"]:
                bonus += 2.0
                reasons.append(f"calories_good_{calories}")
            elif calories <= self.thresholds["health_calories_soft"]:
                penalty += 4.0
                reasons.append(f"calories_soft_fail_{calories}")
            else:
                penalty += 8.0
                reasons.append(f"calories_hard_fail_{calories}")
        else:
            # Check for health keywords or proxy ingredients
            health_keywords = features.health_keywords or []
            
            # Check for health proxy ingredients in title/content
            title_content = f"{recipe_data.get('title', '')} {recipe_data.get('catchphrase', '')}"
            found_proxies = [ing for ing in self.health_proxy_ingredients if ing in title_content]
            
            if health_keywords or found_proxies:
                reasons.append(f"health_indicators_{health_keywords + found_proxies}")
            else:
                penalty += 8.0
                reasons.append("calories_missing_no_health_indicators")
        
        passed = penalty == 0.0
        
        return ContextGateResult(
            passed=passed,
            penalty=penalty,
            reasons=reasons,
            bonus_points=bonus
        )
    
    def _evaluate_event_gates(
        self, 
        features: ContextFeatures, 
        recipe_data: Dict[str, Any]
    ) -> ContextGateResult:
        """Evaluate event context gates"""
        
        reasons = []
        penalty = 0.0
        bonus = 0.0
        
        # Visual score gate (metadata-only, no remote fetch)
        visual_score = features.visual_score
        
        if visual_score is not None:
            if visual_score >= self.thresholds["event_visual_pass"]:
                reasons.append(f"visual_pass_{visual_score}")
            else:
                penalty += 4.0
                reasons.append(f"visual_soft_fail_{visual_score}")
        else:
            penalty += 4.0
            reasons.append("visual_missing")
        
        # Event tokens bonus
        title_content = f"{recipe_data.get('title', '')} {recipe_data.get('catchphrase', '')}"
        event_keywords = self.context_keywords["event"]
        
        found_keywords = []
        for keyword in event_keywords:
            if keyword in title_content:
                found_keywords.append(keyword)
        
        if found_keywords:
            bonus += 2.0
            reasons.append(f"event_bonus_{','.join(found_keywords)}")
        
        passed = penalty <= 4.0  # Allow soft fails for event context
        
        return ContextGateResult(
            passed=passed,
            penalty=penalty,
            reasons=reasons,
            bonus_points=bonus
        )
    
    def _extract_time_from_text(self, recipe_data: Dict[str, Any]) -> Optional[int]:
        """Extract time from text using regex patterns"""
        
        text = f"{recipe_data.get('title', '')} {recipe_data.get('catchphrase', '')}"
        
        # Time patterns
        patterns = [
            r'(\d+)\s*分',
            r'(\d+)\s*minutes?',
            r'(\d+)\s*min',
            r'(\d+)分間'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                times = [int(m) for m in matches if m.isdigit() and int(m) <= 300]  # Max 5 hours
                if times:
                    return min(times)  # Return shortest time found
        
        return None
    
    def _extract_ingredients_count_from_text(self, recipe_data: Dict[str, Any]) -> Optional[int]:
        """Extract ingredients count from text"""
        
        text = f"{recipe_data.get('title', '')} {recipe_data.get('catchphrase', '')}"
        
        # Ingredients patterns
        patterns = [
            r'材料\s*(\d+)\s*[個種つ]',
            r'(\d+)\s*[個種つ].*材料',
            r'ingredients?\s*(\d+)'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                counts = [int(m) for m in matches if m.isdigit() and int(m) <= 50]  # Max 50 ingredients
                if counts:
                    return min(counts)
        
        return None
    
    def _extract_steps_count_from_text(self, recipe_data: Dict[str, Any]) -> Optional[int]:
        """Extract steps count from text"""
        
        text = f"{recipe_data.get('title', '')} {recipe_data.get('catchphrase', '')}"
        
        # Steps patterns
        patterns = [
            r'手順\s*(\d+)',
            r'ステップ\s*(\d+)',
            r'(\d+)\s*[つ個].*手順',
            r'step\s*(\d+)'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                counts = [int(m) for m in matches if m.isdigit() and int(m) <= 30]  # Max 30 steps
                if counts:
                    return max(counts)  # Return highest step count found
        
        return None
    
    def _extract_calories_from_text(self, recipe_data: Dict[str, Any]) -> Optional[float]:
        """Extract calories from text"""
        
        text = f"{recipe_data.get('title', '')} {recipe_data.get('catchphrase', '')}"
        
        # Calorie patterns
        patterns = [
            r'([0-9]{2,4})\s*kcal',
            r'([0-9]{2,4})\s*カロリー',
            r'([0-9]{2,4})\s*cal'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                calories = [float(m) for m in matches if m.isdigit() and 50 <= float(m) <= 2000]
                if calories:
                    return min(calories)  # Return lowest calorie count found
        
        return None

# Global context gates instance
context_gates = ContextGates()

if __name__ == "__main__":
    # Test context gates
    from .feature_extractor import ContextFeatures
    
    # Test cases for different contexts
    test_cases = [
        {
            "context": "時短",
            "features": ContextFeatures(prep_time_minutes=15, ingredients_count=5),
            "recipe_data": {"title": "簡単パンケーキ 15分", "catchphrase": "材料5つだけ"},
            "expected": "pass"
        },
        {
            "context": "初心者", 
            "features": ContextFeatures(steps_count=4),
            "recipe_data": {"title": "失敗しないクッキー 簡単レシピ", "catchphrase": ""},
            "expected": "pass_with_bonus"
        },
        {
            "context": "健康",
            "features": ContextFeatures(calories_per_serving=180.0),
            "recipe_data": {"title": "低カロリースープ", "catchphrase": ""},
            "expected": "pass_with_bonus"
        }
    ]
    
    gates = ContextGates()
    
    print("=== Context Gates Testing ===")
    
    for i, test in enumerate(test_cases, 1):
        result = gates.evaluate_context_gates(
            test["features"], 
            test["context"], 
            test["recipe_data"]
        )
        
        print(f"\nTest {i}: {test['context']} context")
        print(f"  Expected: {test['expected']}")
        print(f"  Passed: {result.passed}")
        print(f"  Penalty: {result.penalty}")
        print(f"  Bonus: {result.bonus_points}")
        print(f"  Reasons: {result.reasons}")
        
        status = "✅ PASS" if result.passed else "❌ FAIL"
        print(f"  Status: {status}")