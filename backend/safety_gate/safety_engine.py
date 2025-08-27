#!/usr/bin/env python3
"""
Safety Gate 2.0 - Core Safety Engine
Implements windowed context analysis and safety decisions for allergen detection
"""

import re
import json
from typing import Dict, List, Set, Any, Tuple, Optional
from dataclasses import dataclass
from .allergen_dictionaries import AllergenDictionaries

@dataclass
class AllergenHit:
    """Represents a detected allergen hit with context"""
    allergen: str
    token: str
    source: str  # "jsonld" | "microdata" | "html"
    position: Tuple[int, int]  # [start, end]
    snippet: str
    context_analysis: Dict[str, Any]

@dataclass
class SafetyResult:
    """Safety analysis result for a recipe"""
    status: str  # "ok" | "ng" | "ambiguous"
    allergens: List[str]  # Selected allergens that were checked
    reasons: List[str]  # Reason codes for the decision
    hits: List[AllergenHit]  # All detected hits with context

class SafetyEngine:
    """Core safety engine for allergen detection and analysis"""
    
    def __init__(self):
        self.dictionaries = AllergenDictionaries()
        self.window_size = 30  # ±30 chars for context analysis
        
    def analyze_recipe_safety(self, recipe_data: Dict[str, Any], selected_allergens: List[str]) -> SafetyResult:
        """
        Analyze recipe safety for selected allergens
        
        Args:
            recipe_data: Recipe data with structured content (jsonld, microdata, html)
            selected_allergens: List of allergen keys to check (e.g., ['egg', 'milk', 'wheat'])
            
        Returns:
            SafetyResult with analysis
        """
        
        if not selected_allergens:
            # No allergens selected, everything is safe
            return SafetyResult(
                status="ok",
                allergens=[],
                reasons=[],
                hits=[]
            )
        
        all_hits = []
        
        # Evidence-first parsing order: JSON-LD → Microdata → HTML
        sources_to_check = [
            ("jsonld", self._extract_jsonld_text(recipe_data)),
            ("microdata", self._extract_microdata_text(recipe_data)),
            ("html", self._extract_html_text(recipe_data))
        ]
        
        # Detect hits in each source
        for source_name, text_content in sources_to_check:
            if text_content:
                hits = self._detect_allergen_hits(text_content, selected_allergens, source_name)
                all_hits.extend(hits)
        
        # Analyze context for each hit
        analyzed_hits = []
        for hit in all_hits:
            context_analysis = self._analyze_hit_context(hit)
            hit.context_analysis = context_analysis
            analyzed_hits.append(hit)
        
        # Make safety decision
        safety_decision = self._make_safety_decision(analyzed_hits, selected_allergens)
        
        return SafetyResult(
            status=safety_decision["status"],
            allergens=selected_allergens,
            reasons=safety_decision["reasons"],
            hits=analyzed_hits
        )
    
    def _extract_jsonld_text(self, recipe_data: Dict[str, Any]) -> str:
        """Extract text content from JSON-LD structured data"""
        jsonld_text = ""
        
        # Look for JSON-LD in the HTML content
        html_content = recipe_data.get("html_content", "")
        if html_content:
            jsonld_pattern = r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>'
            jsonld_matches = re.findall(jsonld_pattern, html_content, re.DOTALL | re.IGNORECASE)
            
            for match in jsonld_matches:
                try:
                    data = json.loads(match.strip())
                    # Extract relevant fields for ingredients/instructions
                    jsonld_text += self._extract_recipe_fields_from_jsonld(data)
                except json.JSONDecodeError:
                    continue
        
        return jsonld_text
    
    def _extract_recipe_fields_from_jsonld(self, data: Any) -> str:
        """Extract recipe-relevant text from JSON-LD data"""
        text_parts = []
        
        if isinstance(data, dict):
            # Look for recipe-specific fields
            recipe_fields = [
                "recipeIngredient", "ingredients", "ingredient",
                "recipeInstructions", "instructions", "instruction",
                "nutrition", "keywords", "description", "name"
            ]
            
            for field in recipe_fields:
                if field in data:
                    field_data = data[field]
                    if isinstance(field_data, list):
                        for item in field_data:
                            if isinstance(item, str):
                                text_parts.append(item)
                            elif isinstance(item, dict) and "text" in item:
                                text_parts.append(item["text"])
                    elif isinstance(field_data, str):
                        text_parts.append(field_data)
        
        elif isinstance(data, list):
            for item in data:
                text_parts.append(self._extract_recipe_fields_from_jsonld(item))
        
        return " ".join(text_parts)
    
    def _extract_microdata_text(self, recipe_data: Dict[str, Any]) -> str:
        """Extract text content from Microdata"""
        html_content = recipe_data.get("html_content", "")
        microdata_text = ""
        
        if html_content:
            # Look for microdata recipe properties
            microdata_patterns = [
                r'itemprop=["\']recipeIngredient["\'][^>]*>([^<]+)',
                r'itemprop=["\']ingredients["\'][^>]*>([^<]+)',
                r'itemprop=["\']recipeInstructions["\'][^>]*>([^<]+)',
                r'itemprop=["\']instructions["\'][^>]*>([^<]+)',
                r'itemprop=["\']nutrition["\'][^>]*>([^<]+)',
                r'itemprop=["\']name["\'][^>]*>([^<]+)',
            ]
            
            for pattern in microdata_patterns:
                matches = re.findall(pattern, html_content, re.IGNORECASE | re.DOTALL)
                microdata_text += " " + " ".join(matches)
        
        return microdata_text
    
    def _extract_html_text(self, recipe_data: Dict[str, Any]) -> str:
        """Extract text content from HTML using heuristics"""
        html_content = recipe_data.get("html_content", "")
        html_text = ""
        
        if html_content:
            # Look for common Japanese recipe sections
            section_patterns = [
                r'<h[1-6][^>]*>.*?材料.*?</h[1-6]>(.*?)(?=<h[1-6]|$)',
                r'<h[1-6][^>]*>.*?作り方.*?</h[1-6]>(.*?)(?=<h[1-6]|$)',
                r'<h[1-6][^>]*>.*?手順.*?</h[1-6]>(.*?)(?=<h[1-6]|$)',
                r'<div[^>]*class="[^"]*ingredient[^"]*"[^>]*>(.*?)</div>',
                r'<ul[^>]*class="[^"]*ingredient[^"]*"[^>]*>(.*?)</ul>',
                r'<ol[^>]*class="[^"]*instruction[^"]*"[^>]*>(.*?)</ol>',
            ]
            
            for pattern in section_patterns:
                matches = re.findall(pattern, html_content, re.IGNORECASE | re.DOTALL)
                for match in matches:
                    # Remove HTML tags but keep text
                    clean_text = re.sub(r'<[^>]+>', ' ', match)
                    html_text += " " + clean_text
            
            # Also extract general text content for broader scanning
            general_text = re.sub(r'<[^>]+>', ' ', html_content)
            html_text += " " + general_text
        
        return html_text
    
    def _detect_allergen_hits(self, text: str, selected_allergens: List[str], source: str) -> List[AllergenHit]:
        """Detect allergen hits in text using windowed substring matching"""
        hits = []
        
        if not text:
            return hits
        
        # Normalize the text
        normalized_text = self.dictionaries.normalize_text(text)
        
        # Check each selected allergen
        for allergen_key in selected_allergens:
            allergen_terms = self.dictionaries.get_all_terms_for_allergen(allergen_key)
            
            for term in allergen_terms:
                if not term:
                    continue
                    
                normalized_term = self.dictionaries.normalize_text(term)
                
                # Find all occurrences of this term
                start_pos = 0
                while True:
                    pos = normalized_text.find(normalized_term, start_pos)
                    if pos == -1:
                        break
                    
                    end_pos = pos + len(normalized_term)
                    
                    # Extract snippet with context
                    snippet_start = max(0, pos - 20)
                    snippet_end = min(len(normalized_text), pos + len(normalized_term) + 20)
                    snippet = normalized_text[snippet_start:snippet_end]
                    
                    hit = AllergenHit(
                        allergen=allergen_key,
                        token=term,
                        source=source,
                        position=(pos, end_pos),
                        snippet=f"...{snippet}...",
                        context_analysis={}
                    )
                    
                    hits.append(hit)
                    start_pos = pos + 1
        
        return hits
    
    def _analyze_hit_context(self, hit: AllergenHit) -> Dict[str, Any]:
        """Analyze the context around a hit using windowed analysis"""
        
        # Extract the full text context around the hit
        full_text = hit.snippet  # For now, using snippet; in full implementation would use original text
        
        allergen_data = self.dictionaries.dictionaries.get(hit.allergen, {})
        
        # Check for negation patterns (±30 chars window)
        negation_patterns = allergen_data.get("negation_patterns", [])
        alternative_patterns = allergen_data.get("alternative_patterns", [])
        metaphor_patterns = allergen_data.get("metaphor_patterns", [])
        
        context_analysis = {
            "has_negation": False,
            "has_alternative": False,
            "has_metaphor": False,
            "has_explicit_free": False,
            "confidence": "low"
        }
        
        # Normalize context for analysis
        normalized_context = self.dictionaries.normalize_text(full_text)
        
        # Check for negation (explicit X不使用, Xなし, X抜き)
        allergen_name = allergen_data.get("name_ja", hit.allergen)
        explicit_free_patterns = [
            f"{allergen_name}不使用",
            f"{allergen_name}なし",
            f"{allergen_name}抜き",
            f"{allergen_name}無し",
            f"{allergen_name}フリー"
        ]
        
        for pattern in explicit_free_patterns:
            if self.dictionaries.normalize_text(pattern) in normalized_context:
                context_analysis["has_explicit_free"] = True
                context_analysis["confidence"] = "high"
                break
        
        # Check for general negation patterns
        for pattern in negation_patterns:
            if self.dictionaries.normalize_text(pattern) in normalized_context:
                context_analysis["has_negation"] = True
                break
        
        # Check for alternative/replacement patterns
        for pattern in alternative_patterns:
            if self.dictionaries.normalize_text(pattern) in normalized_context:
                context_analysis["has_alternative"] = True
                break
        
        # Check for metaphor/flavor/trace patterns
        for pattern in metaphor_patterns:
            if self.dictionaries.normalize_text(pattern) in normalized_context:
                context_analysis["has_metaphor"] = True
                break
        
        return context_analysis
    
    def _make_safety_decision(self, hits: List[AllergenHit], selected_allergens: List[str]) -> Dict[str, Any]:
        """Make safety decision based on hits and context analysis"""
        
        reasons = []
        allergen_status = {}
        
        # Initialize all selected allergens as safe
        for allergen in selected_allergens:
            allergen_status[allergen] = "ok"
        
        # Analyze each hit
        for hit in hits:
            allergen = hit.allergen
            context = hit.context_analysis
            
            # Decision logic based on MVP policy
            if context.get("has_explicit_free", False):
                # Explicit X不使用 statements mark allergen as safe
                allergen_status[allergen] = "ok"
                if "explicit_free" not in reasons:
                    reasons.append("explicit_free")
                    
            elif context.get("has_metaphor", False) or context.get("has_alternative", False):
                # Metaphor/flavor/trace = ambiguous (exclude in MVP)
                if allergen_status[allergen] != "ng":  # Don't override hard exclusions
                    allergen_status[allergen] = "ambiguous"
                if "metaphor" not in reasons:
                    reasons.append("metaphor")
                    
            elif not context.get("has_negation", False):
                # Direct hit without negation = hard exclude
                allergen_status[allergen] = "ng"
                if "hit_token" not in reasons:
                    reasons.append("hit_token")
            
            else:
                # Has negation but not explicit - treat as ambiguous
                if allergen_status[allergen] not in ["ng", "ambiguous"]:
                    allergen_status[allergen] = "ambiguous"
                if "negation_near" not in reasons:
                    reasons.append("negation_near")
        
        # Overall status decision
        if any(status == "ng" for status in allergen_status.values()):
            overall_status = "ng"
        elif any(status == "ambiguous" for status in allergen_status.values()):
            overall_status = "ambiguous"  # MVP: ambiguity = exclusion
        else:
            overall_status = "ok"
        
        return {
            "status": overall_status,
            "reasons": reasons,
            "allergen_details": allergen_status
        }

# CLI test function
def test_safety_engine():
    """Test the safety engine with sample data"""
    engine = SafetyEngine()
    
    # Test cases
    test_cases = [
        {
            "name": "Safe recipe (explicit dairy-free)",
            "html_content": "<div>材料: 小麦粉 200g、卵不使用、乳不使用のマーガリン 100g</div>",
            "selected_allergens": ["egg", "milk"],
            "expected": "ok"
        },
        {
            "name": "Unsafe recipe (contains butter)",
            "html_content": "<div>材料: 小麦粉 200g、バター 100g、卵 2個</div>",
            "selected_allergens": ["egg", "milk"],
            "expected": "ng"
        },
        {
            "name": "Ambiguous recipe (butter flavor)",
            "html_content": "<div>材料: 小麦粉 200g、バター風味マーガリン 100g</div>",
            "selected_allergens": ["milk"],
            "expected": "ambiguous"
        }
    ]
    
    print("Testing Safety Engine...")
    print("=" * 60)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test_case['name']}")
        print("-" * 40)
        
        result = engine.analyze_recipe_safety(
            {"html_content": test_case["html_content"]},
            test_case["selected_allergens"]
        )
        
        print(f"Selected allergens: {test_case['selected_allergens']}")
        print(f"Expected: {test_case['expected']}")
        print(f"Actual: {result.status}")
        print(f"Reasons: {result.reasons}")
        print(f"Hits: {len(result.hits)}")
        
        for hit in result.hits:
            print(f"  - {hit.allergen}: '{hit.token}' in {hit.source}")
            print(f"    Context: {hit.context_analysis}")
        
        status = "✅ PASS" if result.status == test_case["expected"] else "❌ FAIL"
        print(f"Status: {status}")

if __name__ == "__main__":
    test_safety_engine()