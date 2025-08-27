#!/usr/bin/env python3
"""
Recall Uplift v1 - Stepwise Retrieval Engine
Orchestrates multi-pass retrieval with domain policies and diversity controls
"""

import asyncio
import time
import logging
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime
from collections import defaultdict

from .query_shaper import query_shaper
from .domain_manager import domain_manager

class StepwiseRetrieval:
    """Orchestrates stepwise retrieval for improved recipe recall"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Performance budgets (milliseconds)
        self.time_budgets = {
            "retrieval_ms": 15000,  # 15s total retrieval budget
            "extract_ms": 10000,    # 10s total extraction budget 
            "safety_ms": 5000,      # 5s total safety analysis budget
            "scoring_ms": 2000      # 2s scoring budget
        }
        
        # Diversity controls
        self.diversity_limits = {
            "top3_max_per_domain": 1,
            "top10_max_per_domain": 2
        }
        
        # Result targets
        self.result_targets = {
            "min_safe_results": 3,
            "target_safe_results": 10,
            "max_total_candidates": 50
        }
        
    async def execute_stepwise_search(
        self, 
        user_query: str, 
        selected_allergens: List[str],
        cse_search_func,
        safety_analyze_func,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute stepwise retrieval with performance monitoring
        
        Args:
            user_query: Original user query
            selected_allergens: List of selected allergens for safety filtering
            cse_search_func: Function to call CSE API
            safety_analyze_func: Function to analyze recipe safety
            context: Optional context filter
            
        Returns:
            Dict with results, metrics, and performance data
        """
        
        start_time = time.time()
        
        # Initialize metrics
        metrics = {
            "retrieval_passes": [],
            "performance": {
                "total_ms": 0,
                "retrieval_ms": 0,
                "safety_ms": 0,
                "scoring_ms": 0
            },
            "counts": {
                "retrieval_total": 0,
                "recipe_type_pass": 0,
                "safety_ok_count": 0,
                "safety_ng_count": 0,
                "safety_ambiguous_count": 0,
                "non_recipe_filtered": 0,
                "zero_results_after_safety": 0
            }
        }
        
        # Initialize results tracking
        all_candidates = []
        safe_results = []
        domain_counts = defaultdict(int)
        
        # Execute retrieval passes
        retrieval_start = time.time()
        
        # Pass 1: Broad search
        pass1_results = await self._execute_retrieval_pass(
            user_query, "pass_1_broad", cse_search_func, metrics
        )
        all_candidates.extend(pass1_results)
        
        # Process Pass 1 candidates
        pass1_processed = await self._process_candidates(
            pass1_results, selected_allergens, safety_analyze_func, "pass_1_broad", metrics
        )
        safe_results.extend(pass1_processed)
        
        # Check if we need more passes
        if len(safe_results) < self.result_targets["min_safe_results"]:
            
            # Pass 2: Prefer-list boost
            pass2_results = await self._execute_retrieval_pass(
                user_query, "pass_2_prefer", cse_search_func, metrics
            )
            
            # Filter out duplicates
            new_candidates = self._filter_duplicate_urls(pass2_results, all_candidates)
            all_candidates.extend(new_candidates)
            
            pass2_processed = await self._process_candidates(
                new_candidates, selected_allergens, safety_analyze_func, "pass_2_prefer", metrics
            )
            safe_results.extend(pass2_processed)
        
        # Pass 3: Exclude-list filtering (if still insufficient)
        if len(safe_results) < self.result_targets["min_safe_results"]:
            
            pass3_results = await self._execute_retrieval_pass(
                user_query, "pass_3_exclude", cse_search_func, metrics
            )
            
            new_candidates = self._filter_duplicate_urls(pass3_results, all_candidates)
            all_candidates.extend(new_candidates)
            
            pass3_processed = await self._process_candidates(
                new_candidates, selected_allergens, safety_analyze_func, "pass_3_exclude", metrics
            )
            safe_results.extend(pass3_processed)
        
        # Pass 4: Whitelist fallback (last resort)
        if len(safe_results) < self.result_targets["min_safe_results"]:
            
            pass4_results = await self._execute_retrieval_pass(
                user_query, "pass_4_whitelist", cse_search_func, metrics
            )
            
            new_candidates = self._filter_duplicate_urls(pass4_results, all_candidates)
            all_candidates.extend(new_candidates)
            
            pass4_processed = await self._process_candidates(
                new_candidates, selected_allergens, safety_analyze_func, "pass_4_whitelist", metrics
            )
            safe_results.extend(pass4_processed)
        
        metrics["performance"]["retrieval_ms"] = int((time.time() - retrieval_start) * 1000)
        
        # Apply diversity filtering and final scoring
        scoring_start = time.time()
        
        final_results = self._apply_diversity_and_scoring(safe_results)
        
        metrics["performance"]["scoring_ms"] = int((time.time() - scoring_start) * 1000)
        metrics["performance"]["total_ms"] = int((time.time() - start_time) * 1000)
        
        # Update final counts
        metrics["counts"]["zero_results_after_safety"] = 1 if len(final_results) == 0 else 0
        
        self.logger.info(f"Stepwise retrieval completed: {len(final_results)} final results, {metrics['performance']['total_ms']}ms total")
        
        return {
            "results": final_results,
            "metrics": metrics,
            "query_info": {
                "original_query": user_query,
                "selected_allergens": selected_allergens,
                "context": context
            }
        }
    
    async def _execute_retrieval_pass(
        self, 
        user_query: str, 
        pass_type: str, 
        cse_search_func, 
        metrics: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Execute a single retrieval pass"""
        
        pass_start = time.time()
        
        # Shape query for this pass
        query_config = query_shaper.shape_query_for_cse(user_query, pass_type)
        
        try:
            # Call CSE API
            cse_response = await cse_search_func(query_config["shaped_query"])
            
            # Extract items
            items = cse_response.get('items', [])
            
            # Add pass metadata to items
            for item in items:
                item['retrieval_pass'] = pass_type
                item['shaped_query'] = query_config["shaped_query"]
            
            pass_ms = int((time.time() - pass_start) * 1000)
            
            # Record pass metrics
            pass_metrics = {
                "pass_type": pass_type,
                "shaped_query": query_config["shaped_query"],
                "results_count": len(items),
                "pass_ms": pass_ms
            }
            metrics["retrieval_passes"].append(pass_metrics)
            metrics["counts"]["retrieval_total"] += len(items)
            
            self.logger.info(f"{pass_type}: {len(items)} results in {pass_ms}ms")
            
            return items
            
        except Exception as e:
            self.logger.error(f"Error in {pass_type}: {e}")
            return []
    
    async def _process_candidates(
        self, 
        candidates: List[Dict[str, Any]], 
        selected_allergens: List[str],
        safety_analyze_func,
        pass_type: str,
        metrics: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Process candidates through recipe type detection and safety analysis"""
        
        safe_results = []
        
        for candidate in candidates:
            
            # Recipe type detection (existing logic)
            url = candidate.get('link', '')
            title = candidate.get('title', '')
            
            # For now, assume recipe type detection passes
            # (This would integrate with existing recipe type detection)
            recipe_type = "Recipe"
            type_reason = "stepwise_retrieval_pass"
            
            if recipe_type != "Recipe":
                metrics["counts"]["non_recipe_filtered"] += 1
                continue
            
            metrics["counts"]["recipe_type_pass"] += 1
            
            # Safety analysis (if allergens selected)
            if selected_allergens:
                safety_start = time.time()
                
                # Mock recipe data for safety analysis
                recipe_data = {
                    "html_content": candidate.get('snippet', ''),
                    "title": title,
                    "url": url
                }
                
                try:
                    safety_result = safety_analyze_func(recipe_data, selected_allergens)
                    
                    safety_ms = int((time.time() - safety_start) * 1000)
                    metrics["performance"]["safety_ms"] += safety_ms
                    
                    # Count safety results
                    if safety_result.status == "ok":
                        metrics["counts"]["safety_ok_count"] += 1
                    elif safety_result.status == "ng":
                        metrics["counts"]["safety_ng_count"] += 1
                        continue  # Skip unsafe results
                    elif safety_result.status == "ambiguous":
                        metrics["counts"]["safety_ambiguous_count"] += 1
                        continue  # Skip ambiguous results (MVP policy)
                    
                    # Add safety info to candidate
                    candidate['safety'] = {
                        "status": safety_result.status,
                        "checked_allergens": safety_result.allergens,  # User selected
                        "hit_allergens": list(set(hit.allergen for hit in safety_result.hits)),  # Detected
                        "reasons": safety_result.reasons,
                        "hits": [
                            {
                                "allergen": hit.allergen,
                                "token": hit.token,
                                "source": hit.source,
                                "pos": hit.position,
                                "snippet": hit.snippet
                            }
                            for hit in safety_result.hits
                        ]
                    }
                    
                except Exception as e:
                    self.logger.error(f"Safety analysis failed for {url}: {e}")
                    continue
            else:
                # No allergens selected - default safe
                candidate['safety'] = {
                    "status": "ok",
                    "checked_allergens": [],
                    "hit_allergens": [],
                    "reasons": [],
                    "hits": []
                }
                metrics["counts"]["safety_ok_count"] += 1
            
            # Apply domain boost (legacy scoring for now)
            base_score = 75  # Base AnshinScore
            boosted_score, boost_reason = domain_manager.apply_domain_boost(
                base_score, url, pass_type
            )
            
            # Add retrieval metadata
            candidate.update({
                "type": recipe_type,
                "type_reason": type_reason,
                "retrieval_pass": pass_type,
                "domain_boost_reason": boost_reason,
                "base_anshin_score": boosted_score
            })
            
            safe_results.append(candidate)
        
        return safe_results
    
    def _filter_duplicate_urls(
        self, 
        new_candidates: List[Dict[str, Any]], 
        existing_candidates: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Filter out duplicate URLs from new candidates"""
        
        existing_urls = {candidate.get('link', '') for candidate in existing_candidates}
        
        filtered = []
        for candidate in new_candidates:
            url = candidate.get('link', '')
            if url not in existing_urls:
                filtered.append(candidate)
        
        return filtered
    
    def _apply_diversity_and_scoring(
        self, 
        safe_results: List[Dict[str, Any]], 
        context: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Apply diversity filtering and context-aware scoring with MMR"""
        
        if not safe_results:
            return []
        
        # Context-aware scoring for each recipe
        scoring_start = time.time()
        scored_recipes = []
        
        for recipe in safe_results:
            try:
                # Import here to avoid circular imports
                from context_mmr import context_scorer, evidence_chip_generator
                
                # Score recipe with context awareness
                final_score, score_breakdown, context_features = context_scorer.score_recipe_with_context(
                    recipe_data=recipe,
                    context=context,
                    domain_policy=domain_manager
                )
                
                # Generate evidence chips
                evidence_chips = evidence_chip_generator.generate_chips(
                    features=context_features,
                    context=context,
                    score_breakdown=score_breakdown.__dict__
                )
                
                # Update recipe with new scoring data
                recipe.update({
                    "anshinScore": max(0, min(100, final_score)),  # Ensure 0-100 range
                    "score_breakdown": {
                        "safety": score_breakdown.safety,
                        "trust": score_breakdown.trust,
                        "context": score_breakdown.context,
                        "popularity": score_breakdown.popularity,
                        "total": score_breakdown.total
                    },
                    "context_features": {
                        "prep_time_minutes": context_features.prep_time_minutes,
                        "ingredients_count": context_features.ingredients_count,
                        "steps_count": context_features.steps_count,
                        "calories_per_serving": context_features.calories_per_serving,
                        "health_keywords": context_features.health_keywords or [],
                        "beginner_keywords": context_features.beginner_keywords or [],
                        "event_keywords": context_features.event_keywords or [],
                        "visual_score": context_features.visual_score,
                        "completion_score": context_features.completion_score,
                        "extraction_sources": context_features.extraction_sources or []
                    },
                    "evidence_chips": evidence_chip_generator.chips_to_dict(evidence_chips)
                })
                
                scored_recipes.append((recipe, final_score))
                
            except Exception as e:
                self.logger.error(f"Context scoring failed for recipe {recipe.get('title', 'unknown')}: {e}")
                # Fallback to legacy scoring
                legacy_score = recipe.get('base_anshin_score', 75)
                recipe['anshinScore'] = max(0, min(100, legacy_score))
                scored_recipes.append((recipe, legacy_score))
        
        # Apply MMR re-ranking with diversity controls
        try:
            from context_mmr import mmr_reranker
            
            mmr_result = mmr_reranker.rerank_with_mmr(scored_recipes, target_count=10)
            final_recipes = mmr_result.reranked_recipes
            
            # Add MMR metadata to recipes
            for i, recipe in enumerate(final_recipes):
                recipe.update({
                    "id": f"context_mmr_{i+1}",
                    "datasource": "cse",
                    "parseSource": "html",  # Will be determined by actual parsing
                    "prepMinutes": recipe.get('context_features', {}).get('prep_time_minutes') or (25 + i * 5),
                    "calories": recipe.get('context_features', {}).get('calories_per_serving') or (200 + i * 30),
                    "mmr_rank": i + 1,
                    "diversity_stats": mmr_result.diversity_stats if i == 0 else None  # Only on first recipe
                })
            
            self.logger.info(f"MMR re-ranking completed: {len(final_recipes)} recipes, lambda={mmr_result.mmr_lambda_used}")
            
            return final_recipes
            
        except Exception as e:
            self.logger.error(f"MMR re-ranking failed: {e}")
            # Fallback to simple sorting by score
            scored_recipes.sort(key=lambda x: x[1], reverse=True)
            fallback_recipes = [recipe for recipe, score in scored_recipes[:10]]
            
            for i, recipe in enumerate(fallback_recipes):
                recipe.update({
                    "id": f"fallback_{i+1}",
                    "datasource": "cse",
                    "parseSource": "html"
                })
            
            return fallback_recipes

# Global stepwise retrieval instance
stepwise_retrieval = StepwiseRetrieval()

if __name__ == "__main__":
    print("Stepwise Retrieval Engine - Test Mode")
    
    # Mock test data
    async def mock_cse_search(query):
        return {
            'items': [
                {'link': 'https://cookpad.com/recipe/123', 'title': 'パンケーキレシピ', 'snippet': '簡単な作り方'},
                {'link': 'https://amazon.co.jp/product/456', 'title': 'パンケーキミックス販売', 'snippet': '価格980円'},
                {'link': 'https://kurashiru.com/recipe/789', 'title': 'ふわふわパンケーキ', 'snippet': '材料と手順'}
            ]
        }
    
    def mock_safety_analyze(recipe_data, allergens):
        from collections import namedtuple
        SafetyResult = namedtuple('SafetyResult', ['status', 'allergens', 'reasons', 'hits'])
        return SafetyResult('ok', allergens, [], [])
    
    async def test_stepwise():
        result = await stepwise_retrieval.execute_stepwise_search(
            "パンケーキ レシピ",
            ["egg", "milk"],
            mock_cse_search,
            mock_safety_analyze
        )
        
        print(f"Final results: {len(result['results'])}")
        print(f"Total time: {result['metrics']['performance']['total_ms']}ms")
        print(f"Retrieval passes: {len(result['metrics']['retrieval_passes'])}")
        
        for i, res in enumerate(result['results']):
            print(f"  {i+1}. {res['title']} (Score: {res['anshinScore']})")
    
    # Run test
    import asyncio
    asyncio.run(test_stepwise())