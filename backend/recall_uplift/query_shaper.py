#!/usr/bin/env python3
"""
Recall Uplift v1 - Query Shaping Engine
Transforms user queries for better recipe recall while excluding e-commerce/store content
"""

import re
import logging
from typing import Dict, List, Tuple, Optional
from urllib.parse import quote_plus

class QueryShaper:
    """Shapes user queries for improved recipe recall via CSE"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Always include recipe terms
        self.recipe_terms = ["レシピ", "recipe"]
        
        # E-commerce and store exclusion terms
        self.exclude_terms = [
            "販売", "通販", "予約", "店舗", "住所", "地図", "価格", "クーポン",
            "UberEats", "出前館", "ぐるなび", "食べログ", "楽天", "Amazon",
            "購入", "注文", "配達", "デリバリー", "宅配", "営業時間", "アクセス",
            "menu", "メニュー表", "価格表", "料金", "送料", "税込", "割引"
        ]
        
        # Recipe preference hints
        self.prefer_terms = [
            "作り方", "手順", "how to", "材料", "ingredients", "調理",
            "cooking", "preparation", "instructions", "method"
        ]
        
        # URL preference patterns
        self.url_prefer_patterns = [
            "recipe", "レシピ", "cooking", "料理", "作り方"
        ]
    
    def shape_query_for_cse(self, user_query: str, retrieval_pass: str = "pass_1_broad") -> Dict[str, str]:
        """
        Shape user query for CSE retrieval based on pass type
        
        Args:
            user_query: Original user search query
            retrieval_pass: Type of retrieval pass (pass_1_broad, pass_2_prefer, etc.)
            
        Returns:
            Dict with shaped query and CSE parameters
        """
        
        shaped_query = user_query.strip()
        
        # Base shaping - always include recipe terms
        if not any(term in shaped_query.lower() for term in ["レシピ", "recipe"]):
            shaped_query += " (レシピ OR recipe)"
        
        # Add exclusion terms (always applied)
        exclusion_string = " -" + " -".join(self.exclude_terms)
        
        # Pass-specific enhancements
        if retrieval_pass == "pass_1_broad":
            # Broad pass - basic recipe terms only
            final_query = shaped_query + exclusion_string
            
        elif retrieval_pass == "pass_2_prefer":
            # Prefer pass - boost structured recipe content
            prefer_boost = " (" + " OR ".join(self.prefer_terms) + ")"
            url_boost = " (inurl:recipe OR inurl:レシピ OR inurl:cooking)"
            final_query = shaped_query + prefer_boost + url_boost + exclusion_string
            
        elif retrieval_pass == "pass_3_exclude":
            # Exclude pass - stronger domain filtering (handled by domain manager)
            final_query = shaped_query + exclusion_string + " -site:amazon.co.jp -site:rakuten.co.jp -site:tabelog.com"
            
        elif retrieval_pass == "pass_4_whitelist":
            # Whitelist pass - relaxed constraints for fallback
            final_query = shaped_query + " (レシピ OR recipe OR cooking OR 料理)"
            
        else:
            final_query = shaped_query + exclusion_string
        
        # CSE parameters
        cse_params = {
            "q": final_query,
            "lr": "lang_ja",  # Japanese language preference
            "num": "10"       # Start with 10 results, expand if needed
        }
        
        self.logger.info(f"Query shaped for {retrieval_pass}: '{user_query}' -> '{final_query}'")
        
        return {
            "original_query": user_query,
            "shaped_query": final_query,
            "retrieval_pass": retrieval_pass,
            "cse_params": cse_params
        }
    
    def expand_search_num(self, current_num: int, max_expansion: int = 50) -> int:
        """Expand search results count for stepwise retrieval"""
        if current_num == 10:
            return 20
        elif current_num == 20:
            return min(50, max_expansion)
        else:
            return current_num  # No further expansion
    
    def get_url_encoded_query(self, query_dict: Dict[str, str]) -> str:
        """Get URL-encoded query string for CSE API"""
        return quote_plus(query_dict["shaped_query"])
    
    def extract_recipe_indicators(self, title: str, snippet: str) -> Dict[str, float]:
        """Extract recipe confidence indicators from title and snippet"""
        
        title_lower = title.lower()
        snippet_lower = snippet.lower()
        combined_text = f"{title_lower} {snippet_lower}"
        
        indicators = {
            "has_recipe_term": 0.0,
            "has_cooking_method": 0.0,
            "has_ingredients": 0.0,
            "has_instructions": 0.0,
            "has_time_duration": 0.0
        }
        
        # Recipe term indicators
        recipe_terms = ["レシピ", "recipe", "作り方", "料理法", "cooking", "how to make"]
        if any(term in combined_text for term in recipe_terms):
            indicators["has_recipe_term"] = 1.0
        
        # Cooking method indicators  
        cooking_methods = ["焼く", "煮る", "炒める", "蒸す", "揚げる", "茹でる", "炊く", "混ぜる"]
        if any(method in combined_text for method in cooking_methods):
            indicators["has_cooking_method"] = 0.8
        
        # Ingredient indicators
        ingredient_patterns = [r'\d+g', r'\d+ml', r'\d+個', r'\d+本', r'\d+枚', r'\d+杯']
        for pattern in ingredient_patterns:
            if re.search(pattern, combined_text):
                indicators["has_ingredients"] = 0.7
                break
        
        # Instruction indicators
        instruction_words = ["手順", "工程", "ステップ", "step", "まず", "次に", "最後に"]
        if any(word in combined_text for word in instruction_words):
            indicators["has_instructions"] = 0.6
        
        # Time duration indicators
        time_patterns = [r'\d+分', r'\d+時間', r'\d+ minutes', r'\d+ hours']
        for pattern in time_patterns:
            if re.search(pattern, combined_text):
                indicators["has_time_duration"] = 0.5
                break
        
        return indicators
    
    def calculate_recipe_confidence(self, title: str, snippet: str, url: str) -> float:
        """Calculate overall recipe confidence score"""
        
        indicators = self.extract_recipe_indicators(title, snippet)
        
        # Base score from indicators
        confidence_score = sum(indicators.values()) / len(indicators)
        
        # URL bonus
        url_lower = url.lower()
        url_bonus = 0.0
        for pattern in self.url_prefer_patterns:
            if pattern in url_lower:
                url_bonus += 0.1
        
        final_confidence = min(1.0, confidence_score + url_bonus)
        
        return final_confidence

# Global query shaper instance
query_shaper = QueryShaper()

if __name__ == "__main__":
    # Test query shaper
    qs = QueryShaper()
    
    test_queries = [
        "卵 乳 小麦 なし パンケーキ",
        "スープ レシピ",
        "クッキー 作り方",
        "ケーキ"
    ]
    
    print("=== Query Shaping Testing ===")
    
    for query in test_queries:
        print(f"\nOriginal Query: '{query}'")
        print("-" * 40)
        
        for pass_type in ["pass_1_broad", "pass_2_prefer", "pass_3_exclude", "pass_4_whitelist"]:
            result = qs.shape_query_for_cse(query, pass_type)
            print(f"{pass_type}:")
            print(f"  Shaped: '{result['shaped_query']}'")
            print(f"  CSE params: {result['cse_params']}")
    
    # Test recipe confidence
    print("\n=== Recipe Confidence Testing ===")
    
    test_results = [
        ("簡単パンケーキの作り方 | 材料3つで完成", "小麦粉200g、卵2個、牛乳150mlを混ぜて焼くだけ。10分で完成。", "https://cookpad.com/recipes/123"),
        ("パンケーキミックス 販売中 | Amazon", "パンケーキミックス粉 500g 価格980円 送料無料", "https://amazon.co.jp/products/456"),
        ("美味しいパンケーキのお店 | 食べログ", "東京駅近くの人気パンケーキ店。営業時間9:00-21:00", "https://tabelog.com/restaurants/789")
    ]
    
    for title, snippet, url in test_results:
        confidence = qs.calculate_recipe_confidence(title, snippet, url)
        print(f"Title: {title[:40]}...")
        print(f"  Confidence: {confidence:.2f}")
        print(f"  URL: {url}")
        print()