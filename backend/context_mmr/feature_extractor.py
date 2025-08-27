#!/usr/bin/env python3
"""
Context Scoring & MMR Uplift v1 - Feature Extraction Engine
Extracts context-specific features from recipe data (JSON-LD → Microdata → HTML)
"""

import re
import json
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass
from urllib.parse import urlparse

@dataclass
class ContextFeatures:
    """Container for context-specific features extracted from recipe data"""
    
    # Time-saving features
    total_time_minutes: Optional[int] = None
    prep_time_minutes: Optional[int] = None
    cook_time_minutes: Optional[int] = None
    ingredients_count: Optional[int] = None
    steps_count: Optional[int] = None
    
    # Health features
    calories_per_serving: Optional[float] = None
    protein_grams: Optional[float] = None
    fiber_grams: Optional[float] = None
    sugar_grams: Optional[float] = None
    salt_grams: Optional[float] = None
    health_keywords: List[str] = None
    macros_present: bool = False
    
    # Beginner features
    clarity_tokens: List[str] = None
    avg_instruction_length: Optional[float] = None
    beginner_keywords: List[str] = None
    
    # Event features
    visual_score: Optional[float] = None
    image_resolution: Optional[Tuple[int, int]] = None
    event_keywords: List[str] = None
    popularity_score: Optional[float] = None
    
    # Extraction metadata
    extraction_sources: List[str] = None
    completion_score: float = 0.0  # 0-1 based on how many features were extracted

class FeatureExtractor:
    """Extracts context-specific features from recipe data"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Context-specific keywords
        self.health_keywords = [
            "高たんぱく", "低糖質", "食物繊維", "低カロリー", "ヘルシー", "栄養",
            "ビタミン", "ミネラル", "低脂肪", "無添加", "オーガニック", "グルテンフリー",
            "high protein", "low carb", "fiber", "healthy", "nutrition"
        ]
        
        self.beginner_keywords = [
            "簡単", "失敗しない", "初心者", "丁寧", "ポイント", "コツ", "基本",
            "easy", "simple", "beginner", "basic", "step by step"
        ]
        
        self.clarity_keywords = [
            "わかりやすい", "詳しく", "写真付き", "動画", "説明", "解説"
        ]
        
        self.event_keywords = [
            "映え", "華やか", "パーティー", "誕生日", "お祝い", "記念日", "特別",
            "おもてなし", "豪華", "festive", "party", "celebration", "special"
        ]
    
    def extract_all_features(self, recipe_data: Dict[str, Any]) -> ContextFeatures:
        """
        Extract all context features from recipe data
        
        Args:
            recipe_data: Recipe data containing html_content, title, url, etc.
            
        Returns:
            ContextFeatures with extracted data
        """
        
        features = ContextFeatures()
        features.extraction_sources = []
        
        # Extract from JSON-LD (highest priority)
        jsonld_features = self._extract_from_jsonld(recipe_data)
        if jsonld_features:
            features = self._merge_features(features, jsonld_features)
            features.extraction_sources.append("jsonld")
        
        # Extract from Microdata (fallback)
        microdata_features = self._extract_from_microdata(recipe_data)
        if microdata_features:
            features = self._merge_features(features, microdata_features)
            features.extraction_sources.append("microdata")
        
        # Extract from HTML (fallback)
        html_features = self._extract_from_html(recipe_data)
        if html_features:
            features = self._merge_features(features, html_features)
            features.extraction_sources.append("html")
        
        # Calculate completion score
        features.completion_score = self._calculate_completion_score(features)
        
        # Initialize empty lists if None
        if features.health_keywords is None:
            features.health_keywords = []
        if features.clarity_tokens is None:
            features.clarity_tokens = []
        if features.beginner_keywords is None:
            features.beginner_keywords = []
        if features.event_keywords is None:
            features.event_keywords = []
        
        return features
    
    def _extract_from_jsonld(self, recipe_data: Dict[str, Any]) -> Optional[ContextFeatures]:
        """Extract features from JSON-LD structured data"""
        
        html_content = recipe_data.get("html_content", "")
        if not html_content:
            return None
        
        features = ContextFeatures()
        
        # Find JSON-LD script tags
        jsonld_pattern = r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>'
        jsonld_matches = re.findall(jsonld_pattern, html_content, re.DOTALL | re.IGNORECASE)
        
        for match in jsonld_matches:
            try:
                data = json.loads(match.strip())
                self._extract_jsonld_features(data, features)
            except json.JSONDecodeError:
                continue
        
        return features if self._has_extracted_features(features) else None
    
    def _extract_jsonld_features(self, data: Any, features: ContextFeatures):
        """Extract features from parsed JSON-LD data"""
        
        if isinstance(data, dict):
            # Recipe schema
            if data.get("@type") == "Recipe":
                
                # Time features
                total_time = data.get("totalTime")
                if total_time:
                    features.total_time_minutes = self._parse_iso8601_duration(total_time)
                
                prep_time = data.get("prepTime")
                if prep_time:
                    features.prep_time_minutes = self._parse_iso8601_duration(prep_time)
                
                cook_time = data.get("cookTime")
                if cook_time:
                    features.cook_time_minutes = self._parse_iso8601_duration(cook_time)
                
                # Ingredients count
                ingredients = data.get("recipeIngredient", [])
                if isinstance(ingredients, list):
                    features.ingredients_count = len(ingredients)
                
                # Instructions count
                instructions = data.get("recipeInstructions", [])
                if isinstance(instructions, list):
                    features.steps_count = len(instructions)
                    
                    # Calculate average instruction length for clarity
                    instruction_texts = []
                    for instruction in instructions:
                        if isinstance(instruction, dict):
                            text = instruction.get("text", "")
                        elif isinstance(instruction, str):
                            text = instruction
                        else:
                            continue
                        instruction_texts.append(text)
                    
                    if instruction_texts:
                        avg_length = sum(len(text) for text in instruction_texts) / len(instruction_texts)
                        features.avg_instruction_length = avg_length
                
                # Nutrition features
                nutrition = data.get("nutrition", {})
                if isinstance(nutrition, dict):
                    features.macros_present = True
                    
                    calories = nutrition.get("calories")
                    if calories:
                        features.calories_per_serving = self._parse_numeric_value(calories)
                    
                    protein = nutrition.get("proteinContent")
                    if protein:
                        features.protein_grams = self._parse_numeric_value(protein)
                    
                    fiber = nutrition.get("fiberContent")
                    if fiber:
                        features.fiber_grams = self._parse_numeric_value(fiber)
                    
                    sugar = nutrition.get("sugarContent")
                    if sugar:
                        features.sugar_grams = self._parse_numeric_value(sugar)
                    
                    sodium = nutrition.get("sodiumContent")
                    if sodium:
                        features.salt_grams = self._parse_numeric_value(sodium)
                
                # Popularity features
                rating = data.get("aggregateRating", {})
                if isinstance(rating, dict):
                    rating_value = rating.get("ratingValue", 0)
                    review_count = rating.get("reviewCount", 0)
                    if rating_value and review_count:
                        # Simple popularity score (can be enhanced)
                        features.popularity_score = float(rating_value) * min(1.0, float(review_count) / 100)
                
                # Extract keywords from name and description
                recipe_text = f"{data.get('name', '')} {data.get('description', '')}"
                features.health_keywords = self._extract_keywords(recipe_text, self.health_keywords)
                features.beginner_keywords = self._extract_keywords(recipe_text, self.beginner_keywords)
                features.event_keywords = self._extract_keywords(recipe_text, self.event_keywords)
                features.clarity_tokens = self._extract_keywords(recipe_text, self.clarity_keywords)
        
        elif isinstance(data, list):
            for item in data:
                self._extract_jsonld_features(item, features)
    
    def _extract_from_microdata(self, recipe_data: Dict[str, Any]) -> Optional[ContextFeatures]:
        """Extract features from Microdata"""
        
        html_content = recipe_data.get("html_content", "")
        if not html_content:
            return None
        
        features = ContextFeatures()
        
        # Microdata extraction patterns
        patterns = {
            "prepTime": r'itemprop=["\']prepTime["\'][^>]*content=["\']([^"\']+)["\']',
            "cookTime": r'itemprop=["\']cookTime["\'][^>]*content=["\']([^"\']+)["\']',
            "totalTime": r'itemprop=["\']totalTime["\'][^>]*content=["\']([^"\']+)["\']',
            "calories": r'itemprop=["\']calories["\'][^>]*>([^<]+)',
        }
        
        for prop, pattern in patterns.items():
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            if matches and matches[0]:
                value = matches[0].strip()
                
                if prop in ["prepTime", "cookTime", "totalTime"]:
                    minutes = self._parse_iso8601_duration(value)
                    if minutes:
                        setattr(features, f"{prop.replace('Time', '_time')}_minutes", minutes)
                
                elif prop == "calories":
                    calories = self._parse_numeric_value(value)
                    if calories:
                        features.calories_per_serving = calories
        
        # Extract ingredients and instructions count from microdata
        ingredient_pattern = r'itemprop=["\']recipeIngredient["\'][^>]*>([^<]+)'
        ingredients = re.findall(ingredient_pattern, html_content, re.IGNORECASE)
        if ingredients:
            features.ingredients_count = len(ingredients)
        
        instruction_pattern = r'itemprop=["\']recipeInstructions["\'][^>]*>([^<]+)'
        instructions = re.findall(instruction_pattern, html_content, re.IGNORECASE)
        if instructions:
            features.steps_count = len(instructions)
        
        return features if self._has_extracted_features(features) else None
    
    def _extract_from_html(self, recipe_data: Dict[str, Any]) -> Optional[ContextFeatures]:
        """Extract features from HTML using heuristics"""
        
        html_content = recipe_data.get("html_content", "")
        title = recipe_data.get("title", "")
        
        if not html_content and not title:
            return None
        
        features = ContextFeatures()
        
        combined_text = f"{title} {html_content}"
        
        # Time extraction from text
        time_patterns = [
            r'(\d+)\s*分',
            r'(\d+)\s*minutes?',
            r'(\d+)\s*min',
            r'(\d+)分間'
        ]
        
        for pattern in time_patterns:
            matches = re.findall(pattern, combined_text, re.IGNORECASE)
            if matches:
                times = [int(m) for m in matches if m.isdigit()]
                if times:
                    # Use the first reasonable time found
                    time_value = min(times)  # Assume shortest time is prep time
                    if not features.prep_time_minutes and time_value <= 180:  # Max 3 hours
                        features.prep_time_minutes = time_value
                    break
        
        # Ingredients count from text patterns
        ingredient_patterns = [
            r'材料[：:]?\s*(\d+)\s*個',
            r'(\d+)\s*種類',
            r'ingredients?\s*[：:]?\s*(\d+)'
        ]
        
        for pattern in ingredient_patterns:
            matches = re.findall(pattern, combined_text, re.IGNORECASE)
            if matches:
                features.ingredients_count = int(matches[0])
                break
        
        # Steps count from HTML structure
        step_patterns = [
            r'<ol[^>]*>(.*?)</ol>',
            r'<li[^>]*>.*?</li>',
            r'手順\s*(\d+)',
            r'ステップ\s*(\d+)'
        ]
        
        # Count list items as steps
        li_pattern = r'<li[^>]*>.*?</li>'
        steps = re.findall(li_pattern, html_content, re.DOTALL | re.IGNORECASE)
        if steps:
            features.steps_count = len(steps)
        
        # Extract keywords
        features.health_keywords = self._extract_keywords(combined_text, self.health_keywords)
        features.beginner_keywords = self._extract_keywords(combined_text, self.beginner_keywords)
        features.event_keywords = self._extract_keywords(combined_text, self.event_keywords)
        features.clarity_tokens = self._extract_keywords(combined_text, self.clarity_keywords)
        
        # Visual score from image analysis
        features.visual_score = self._calculate_visual_score(recipe_data)
        
        return features if self._has_extracted_features(features) else None
    
    def _parse_iso8601_duration(self, duration_str: str) -> Optional[int]:
        """Parse ISO8601 duration to minutes"""
        
        if not duration_str:
            return None
        
        # Handle PT format (e.g., "PT15M", "PT1H30M")
        if duration_str.startswith("PT"):
            duration_str = duration_str[2:]  # Remove PT
            
            minutes = 0
            
            # Extract hours
            hour_match = re.search(r'(\d+)H', duration_str)
            if hour_match:
                minutes += int(hour_match.group(1)) * 60
            
            # Extract minutes
            minute_match = re.search(r'(\d+)M', duration_str)
            if minute_match:
                minutes += int(minute_match.group(1))
            
            return minutes if minutes > 0 else None
        
        # Handle plain number (assume minutes)
        if duration_str.isdigit():
            return int(duration_str)
        
        return None
    
    def _parse_numeric_value(self, value: str) -> Optional[float]:
        """Parse numeric value from string"""
        
        if not value:
            return None
        
        # Remove units and extra text
        numeric_str = re.sub(r'[^\d.]', '', str(value))
        
        try:
            return float(numeric_str)
        except ValueError:
            return None
    
    def _extract_keywords(self, text: str, keyword_list: List[str]) -> List[str]:
        """Extract matching keywords from text"""
        
        found_keywords = []
        text_lower = text.lower()
        
        for keyword in keyword_list:
            if keyword.lower() in text_lower:
                found_keywords.append(keyword)
        
        return found_keywords
    
    def _calculate_visual_score(self, recipe_data: Dict[str, Any]) -> Optional[float]:
        """Calculate visual appeal score from image data"""
        
        # For now, return a simple heuristic based on image presence
        image_url = recipe_data.get("image")
        
        if image_url:
            # Basic scoring based on image URL patterns
            if any(domain in image_url for domain in ["unsplash", "high-res", "hd"]):
                return 0.8
            elif "placeholder" in image_url or "default" in image_url:
                return 0.2
            else:
                return 0.6
        
        return None
    
    def _merge_features(self, base: ContextFeatures, new: ContextFeatures) -> ContextFeatures:
        """Merge features, preferring non-None values"""
        
        for field_name, field_value in new.__dict__.items():
            if field_value is not None:
                current_value = getattr(base, field_name)
                
                if current_value is None:
                    setattr(base, field_name, field_value)
                elif isinstance(field_value, list) and isinstance(current_value, list):
                    # Merge lists and remove duplicates
                    merged_list = list(set(current_value + field_value))
                    setattr(base, field_name, merged_list)
        
        return base
    
    def _has_extracted_features(self, features: ContextFeatures) -> bool:
        """Check if any meaningful features were extracted"""
        
        non_list_fields = [
            'total_time_minutes', 'prep_time_minutes', 'cook_time_minutes',
            'ingredients_count', 'steps_count', 'calories_per_serving',
            'protein_grams', 'visual_score', 'popularity_score'
        ]
        
        return any(getattr(features, field) is not None for field in non_list_fields)
    
    def _calculate_completion_score(self, features: ContextFeatures) -> float:
        """Calculate feature extraction completion score (0-1)"""
        
        total_fields = 0
        extracted_fields = 0
        
        # Count all possible feature fields
        for field_name, field_value in features.__dict__.items():
            if field_name not in ['extraction_sources', 'completion_score']:
                total_fields += 1
                if field_value is not None:
                    if isinstance(field_value, list) and len(field_value) > 0:
                        extracted_fields += 1
                    elif not isinstance(field_value, list):
                        extracted_fields += 1
        
        return extracted_fields / total_fields if total_fields > 0 else 0.0

# Global feature extractor instance
feature_extractor = FeatureExtractor()

if __name__ == "__main__":
    # Test feature extractor
    test_recipe_data = {
        "title": "簡単パンケーキレシピ 15分 高たんぱく 初心者向け",
        "html_content": '''
        <script type="application/ld+json">
        {
            "@type": "Recipe",
            "name": "簡単パンケーキ",
            "prepTime": "PT15M",
            "cookTime": "PT5M",
            "totalTime": "PT20M",
            "recipeIngredient": ["卵 2個", "小麦粉 100g", "牛乳 150ml"],
            "recipeInstructions": [
                {"text": "卵を溶く"},
                {"text": "小麦粉を混ぜる"},
                {"text": "フライパンで焼く"}
            ],
            "nutrition": {
                "calories": "250",
                "proteinContent": "12g",
                "fiberContent": "3g"
            }
        }
        </script>
        ''',
        "image": "https://example.com/pancake.jpg"
    }
    
    extractor = FeatureExtractor()
    features = extractor.extract_all_features(test_recipe_data)
    
    print("=== Feature Extraction Test ===")
    print(f"Prep time: {features.prep_time_minutes} minutes")
    print(f"Ingredients count: {features.ingredients_count}")
    print(f"Steps count: {features.steps_count}")
    print(f"Calories: {features.calories_per_serving}")
    print(f"Protein: {features.protein_grams}g")
    print(f"Health keywords: {features.health_keywords}")
    print(f"Beginner keywords: {features.beginner_keywords}")
    print(f"Completion score: {features.completion_score:.2f}")
    print(f"Extraction sources: {features.extraction_sources}")