#!/usr/bin/env python3
"""
Context Scoring & MMR Uplift v1 - MMR Re-ranking Engine
Maximum Marginal Relevance with diversity controls for Top3/Top10
"""

import logging
import numpy as np
from typing import Dict, List, Any, Tuple, Set
from dataclasses import dataclass
from collections import defaultdict, Counter
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

@dataclass
class MMRResult:
    """Result of MMR re-ranking"""
    reranked_recipes: List[Dict[str, Any]]
    diversity_stats: Dict[str, Any]
    mmr_lambda_used: float
    violations: List[str]

class MMRReranker:
    """Maximum Marginal Relevance re-ranking with diversity controls"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # MMR parameters
        self.lambda_relevance = 0.7  # Weight for relevance vs novelty
        self.lambda_novelty = 0.3    # Weight for novelty (1 - relevance)
        
        # Diversity limits
        self.diversity_limits = {
            "top3_max_per_domain": 1,
            "top10_max_per_domain": 2,
            "min_title_similarity": 0.8,      # Threshold for near-duplicate titles
            "min_ingredient_similarity": 0.7  # Threshold for similar recipes
        }
        
        # TF-IDF vectorizer for text similarity
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words=None,  # Keep Japanese text as-is
            ngram_range=(1, 2)
        )
    
    def rerank_with_mmr(
        self, 
        scored_recipes: List[Tuple[Dict[str, Any], float]], 
        target_count: int = 10
    ) -> MMRResult:
        """
        Apply MMR re-ranking with diversity controls
        
        Args:
            scored_recipes: List of (recipe_dict, relevance_score) tuples
            target_count: Target number of results (default 10)
            
        Returns:
            MMRResult with reranked recipes and diversity stats
        """
        
        if not scored_recipes:
            return MMRResult([], {}, self.lambda_relevance, [])
        
        # Separate recipes and scores
        recipes = [item[0] for item in scored_recipes]
        relevance_scores = np.array([item[1] for item in scored_recipes])
        
        # Normalize relevance scores to 0-1 range
        if len(relevance_scores) > 1:
            score_min, score_max = relevance_scores.min(), relevance_scores.max()
            if score_max > score_min:
                relevance_scores = (relevance_scores - score_min) / (score_max - score_min)
        else:
            relevance_scores = np.array([1.0])
        
        # Calculate similarity matrix
        similarity_matrix = self._calculate_similarity_matrix(recipes)
        
        # Apply MMR algorithm
        selected_indices, diversity_stats = self._mmr_selection(
            relevance_scores, 
            similarity_matrix, 
            recipes,
            target_count
        )
        
        # Get selected recipes
        reranked_recipes = [recipes[i] for i in selected_indices]
        
        # Apply final diversity controls
        final_recipes, violations = self._apply_diversity_controls(reranked_recipes)
        
        # Update diversity stats
        diversity_stats.update({
            "final_count": len(final_recipes),
            "diversity_violations": len(violations),
            "mmr_lambda": self.lambda_relevance
        })
        
        return MMRResult(
            reranked_recipes=final_recipes,
            diversity_stats=diversity_stats,
            mmr_lambda_used=self.lambda_relevance,
            violations=violations
        )
    
    def _calculate_similarity_matrix(self, recipes: List[Dict[str, Any]]) -> np.ndarray:
        """Calculate similarity matrix between recipes"""
        
        # Extract text features for similarity calculation
        recipe_texts = []
        
        for recipe in recipes:
            # Combine title and available ingredients/description
            text_parts = []
            
            # Title
            title = recipe.get("title", "")
            if title:
                text_parts.append(title)
            
            # Extract ingredients if available in safety hits
            safety_hits = recipe.get("safety", {}).get("hits", [])
            for hit in safety_hits:
                snippet = hit.get("snippet", "")
                if snippet:
                    text_parts.append(snippet)
            
            # Use catchphrase or snippet
            catchphrase = recipe.get("catchphrase", "")
            if catchphrase:
                text_parts.append(catchphrase)
            
            recipe_text = " ".join(text_parts) if text_parts else title
            recipe_texts.append(recipe_text)
        
        # Calculate TF-IDF similarity matrix
        try:
            if len(recipe_texts) > 1:
                tfidf_matrix = self.vectorizer.fit_transform(recipe_texts)
                similarity_matrix = cosine_similarity(tfidf_matrix)
            else:
                similarity_matrix = np.array([[1.0]])
            
            return similarity_matrix
            
        except Exception as e:
            self.logger.warning(f"Failed to calculate similarity matrix: {e}")
            # Fallback: zero similarity matrix
            n = len(recipes)
            return np.zeros((n, n))
    
    def _mmr_selection(
        self,
        relevance_scores: np.ndarray,
        similarity_matrix: np.ndarray,
        recipes: List[Dict[str, Any]],
        target_count: int
    ) -> Tuple[List[int], Dict[str, Any]]:
        """Apply MMR selection algorithm"""
        
        selected_indices = []
        remaining_indices = list(range(len(recipes)))
        
        diversity_stats = {
            "iterations": 0,
            "avg_relevance": 0.0,
            "avg_novelty": 0.0,
            "domain_distribution": {}
        }
        
        # Select items using MMR
        while len(selected_indices) < target_count and remaining_indices:
            
            best_score = -1
            best_idx = None
            iteration_relevance = []
            iteration_novelty = []
            
            for candidate_idx in remaining_indices:
                
                # Relevance component
                relevance = relevance_scores[candidate_idx]
                
                # Novelty component (minimize similarity to selected items)
                if selected_indices:
                    max_similarity = max(
                        similarity_matrix[candidate_idx][selected_idx] 
                        for selected_idx in selected_indices
                    )
                    novelty = 1.0 - max_similarity
                else:
                    novelty = 1.0  # First item has maximum novelty
                
                # MMR score
                mmr_score = (
                    self.lambda_relevance * relevance + 
                    self.lambda_novelty * novelty
                )
                
                iteration_relevance.append(relevance)
                iteration_novelty.append(novelty)
                
                if mmr_score > best_score:
                    best_score = mmr_score
                    best_idx = candidate_idx
            
            if best_idx is not None:
                selected_indices.append(best_idx)
                remaining_indices.remove(best_idx)
                
                # Update stats
                diversity_stats["iterations"] += 1
                if iteration_relevance:
                    diversity_stats["avg_relevance"] = np.mean(iteration_relevance)
                    diversity_stats["avg_novelty"] = np.mean(iteration_novelty)
        
        # Calculate domain distribution
        domain_counts = Counter()
        for idx in selected_indices:
            domain = self._get_domain(recipes[idx].get("url", ""))
            domain_counts[domain] += 1
        
        diversity_stats["domain_distribution"] = dict(domain_counts)
        
        return selected_indices, diversity_stats
    
    def _apply_diversity_controls(
        self, 
        recipes: List[Dict[str, Any]]
    ) -> Tuple[List[Dict[str, Any]], List[str]]:
        """Apply final diversity controls (domain limits, duplicate detection)"""
        
        final_recipes = []
        violations = []
        domain_counts = defaultdict(int)
        seen_titles = []
        
        for i, recipe in enumerate(recipes):
            
            # Get domain
            domain = self._get_domain(recipe.get("url", ""))
            
            # Check domain diversity limits
            position_group = "top3" if i < 3 else "top10"
            max_per_domain = (
                self.diversity_limits["top3_max_per_domain"] 
                if position_group == "top3" 
                else self.diversity_limits["top10_max_per_domain"]
            )
            
            if domain_counts[domain] >= max_per_domain:
                violations.append(f"domain_limit_exceeded_{domain}_{position_group}")
                continue
            
            # Check for near-duplicate titles
            title = recipe.get("title", "")
            is_duplicate = False
            
            for seen_title in seen_titles:
                similarity = self._calculate_text_similarity(title, seen_title)
                if similarity >= self.diversity_limits["min_title_similarity"]:
                    violations.append(f"duplicate_title_similarity_{similarity:.2f}")
                    is_duplicate = True
                    break
            
            if is_duplicate:
                continue
            
            # Recipe passes all diversity checks
            final_recipes.append(recipe)
            domain_counts[domain] += 1
            seen_titles.append(title)
            
            # Stop at target count
            if len(final_recipes) >= 10:
                break
        
        return final_recipes, violations
    
    def _get_domain(self, url: str) -> str:
        """Extract domain from URL for diversity tracking"""
        
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            
            # Remove www prefix
            if domain.startswith('www.'):
                domain = domain[4:]
            
            return domain
        except:
            return "unknown"
    
    def _calculate_text_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two text strings"""
        
        if not text1 or not text2:
            return 0.0
        
        try:
            # Simple character-level similarity for duplicate detection
            set1 = set(text1.lower())
            set2 = set(text2.lower())
            
            intersection = set1.intersection(set2)
            union = set1.union(set2)
            
            return len(intersection) / len(union) if union else 0.0
            
        except:
            return 0.0
    
    def adjust_mmr_parameters(
        self, 
        performance_metrics: Dict[str, float]
    ) -> Dict[str, float]:
        """Adjust MMR parameters based on performance metrics"""
        
        # Simple adaptive adjustment based on diversity vs relevance trade-off
        p_at_3 = performance_metrics.get("p_at_3_estimate", 0.0)
        diversity_violations = performance_metrics.get("diversity_violations", 0)
        
        new_lambda = self.lambda_relevance
        
        # If P@3 is too low, increase relevance weight
        if p_at_3 < 0.8:
            new_lambda = min(0.9, self.lambda_relevance + 0.05)
        
        # If too many diversity violations, increase novelty weight  
        elif diversity_violations > 2:
            new_lambda = max(0.5, self.lambda_relevance - 0.05)
        
        # Update parameters
        if abs(new_lambda - self.lambda_relevance) > 0.01:
            self.lambda_relevance = new_lambda
            self.lambda_novelty = 1.0 - new_lambda
            
            self.logger.info(f"Adjusted MMR lambda: relevance={self.lambda_relevance:.2f}, novelty={self.lambda_novelty:.2f}")
        
        return {
            "lambda_relevance": self.lambda_relevance,
            "lambda_novelty": self.lambda_novelty,
            "adjustment_reason": "p_at_3_low" if p_at_3 < 0.8 else "diversity_violations" if diversity_violations > 2 else "no_change"
        }
    
    def calculate_diversity_metrics(self, recipes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate diversity metrics for the final result set"""
        
        if not recipes:
            return {}
        
        # Domain diversity
        domains = [self._get_domain(r.get("url", "")) for r in recipes]
        unique_domains = len(set(domains))
        
        # Title diversity (average pairwise dissimilarity)
        titles = [r.get("title", "") for r in recipes]
        title_similarities = []
        
        for i in range(len(titles)):
            for j in range(i+1, len(titles)):
                similarity = self._calculate_text_similarity(titles[i], titles[j])
                title_similarities.append(similarity)
        
        avg_title_similarity = np.mean(title_similarities) if title_similarities else 0.0
        
        return {
            "unique_domains": unique_domains,
            "total_recipes": len(recipes),
            "domain_diversity_ratio": unique_domains / len(recipes),
            "avg_title_similarity": avg_title_similarity,
            "title_diversity_score": 1.0 - avg_title_similarity
        }

# Global MMR reranker instance
mmr_reranker = MMRReranker()

if __name__ == "__main__":
    # Test MMR reranker
    
    # Mock scored recipes
    mock_recipes = []
    for i in range(15):
        recipe = {
            "id": f"recipe_{i}",
            "title": f"パンケーキレシピ {i}",
            "url": f"https://domain{i%5}.com/recipe/{i}",
            "catchphrase": f"おいしいパンケーキ {i}",
            "safety": {"hits": []},
            "anshinScore": 90 - i * 2
        }
        mock_recipes.append((recipe, 90 - i * 2))
    
    reranker = MMRReranker()
    
    print("=== MMR Reranker Test ===")
    
    # Test MMR reranking
    result = reranker.rerank_with_mmr(mock_recipes, target_count=10)
    
    print(f"Original recipes: {len(mock_recipes)}")
    print(f"Reranked recipes: {len(result.reranked_recipes)}")
    print(f"MMR lambda used: {result.mmr_lambda_used}")
    print(f"Diversity violations: {len(result.violations)}")
    
    print("\nTop 5 reranked recipes:")
    for i, recipe in enumerate(result.reranked_recipes[:5]):
        print(f"  {i+1}. {recipe['title']} (Score: {recipe['anshinScore']})")
    
    print(f"\nDiversity stats: {result.diversity_stats}")
    
    # Test diversity metrics
    diversity_metrics = reranker.calculate_diversity_metrics(result.reranked_recipes)
    print(f"Diversity metrics: {diversity_metrics}")