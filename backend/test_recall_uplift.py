#!/usr/bin/env python3
"""
Recall Uplift v1 - Before/After Testing
Compare legacy CSE vs stepwise retrieval performance
"""

import requests
import json
import time
from typing import List, Dict

# Test configuration
BACKEND_URL = "https://recipe-shield.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Golden Set queries for comparison
GOLDEN_SET = [
    {
        "query": "卵 乳 小麦 なし パンケーキ レシピ",
        "allergens": "卵,乳,小麦",
        "description": "Time-saving pancake recipe"
    },
    {
        "query": "乳 小麦 なし スープ 高たんぱく レシピ", 
        "allergens": "乳,小麦",
        "description": "Health-focused soup recipe"
    },
    {
        "query": "卵 乳 なし クッキー 簡単 レシピ",
        "allergens": "卵,乳",
        "description": "Beginner cookie recipe"
    },
    {
        "query": "卵 乳 小麦 なし ケーキ パーティー レシピ",
        "allergens": "卵,乳,小麦",
        "description": "Event cake recipe"
    },
    {
        "query": "そば なし つゆ レシピ",
        "allergens": "そば",
        "description": "Buckwheat-free broth"
    },
    {
        "query": "ピーナッツ なし 和え物 レシピ",
        "allergens": "落花生",
        "description": "Peanut-free salad"
    }
]

def test_search_endpoint(query: str, allergens: str, use_stepwise: bool, timeout: int = 30) -> Dict:
    """Test a single search endpoint call"""
    
    params = {
        "q": query,
        "allergens": allergens,
        "debug": "1",
        "use_stepwise": "1" if use_stepwise else "0"
    }
    
    start_time = time.time()
    
    try:
        response = requests.get(f"{API_BASE}/v1/search", params=params, timeout=timeout)
        response_time_ms = int((time.time() - start_time) * 1000)
        
        if response.status_code == 200:
            data = response.json()
            
            results = data.get("results", [])
            debug_info = data.get("debug", {})
            
            # Extract metrics
            metrics = {
                "success": True,
                "response_time_ms": response_time_ms,
                "results_count": len(results),
                "zero_results_after_safety": 1 if len(results) == 0 else 0
            }
            
            # Extract exclusion stats
            exclusion_stats = debug_info.get("exclusionStats", {})
            if exclusion_stats:
                metrics.update({
                    "retrieval_total": exclusion_stats.get("total_processed", 0),
                    "recipe_type_pass": exclusion_stats.get("recipe_type_pass", 0),
                    "safety_ok_count": exclusion_stats.get("safety_ok_count", 0),
                    "safety_ng_count": exclusion_stats.get("safety_allergen", 0),
                    "safety_ambiguous_count": exclusion_stats.get("safety_ambiguous", 0),
                    "non_recipe_filtered": exclusion_stats.get("non_recipe_filtered", 0)
                })
            
            # Extract stepwise metrics
            stepwise_metrics = debug_info.get("stepwiseMetrics", {})
            if stepwise_metrics:
                retrieval_passes = stepwise_metrics.get("retrieval_passes", [])
                metrics["stepwise_passes_count"] = len(retrieval_passes)
                
                performance = stepwise_metrics.get("performance", {})
                metrics.update({
                    "retrieval_ms": performance.get("retrieval_ms", 0),
                    "safety_ms": performance.get("safety_ms", 0),
                    "scoring_ms": performance.get("scoring_ms", 0)
                })
            
            # Check AnshinScore normalization
            if results:
                scores = [r.get("anshinScore", 0) for r in results]
                metrics["min_anshin_score"] = min(scores)
                metrics["max_anshin_score"] = max(scores)
                metrics["avg_anshin_score"] = sum(scores) / len(scores)
            
            return metrics
            
        else:
            return {
                "success": False,
                "response_time_ms": response_time_ms,
                "error": f"HTTP {response.status_code}",
                "results_count": 0,
                "zero_results_after_safety": 1
            }
            
    except Exception as e:
        return {
            "success": False,
            "response_time_ms": int((time.time() - start_time) * 1000),
            "error": str(e),
            "results_count": 0,
            "zero_results_after_safety": 1
        }

def run_before_after_comparison():
    """Run comprehensive before/after comparison"""
    
    print("=" * 80)
    print("🚀 RECALL UPLIFT v1 - COMPREHENSIVE BEFORE/AFTER TESTING")
    print("=" * 80)
    
    results = []
    
    for i, test_case in enumerate(GOLDEN_SET, 1):
        print(f"\n📋 Test Case {i}/6: {test_case['description']}")
        print(f"Query: {test_case['query']}")
        print(f"Allergens: {test_case['allergens']}")
        print("-" * 60)
        
        # BEFORE: Legacy CSE
        print("🔍 Testing BEFORE (Legacy CSE)...")
        before_metrics = test_search_endpoint(
            test_case["query"], 
            test_case["allergens"], 
            use_stepwise=False
        )
        
        time.sleep(2)  # Brief pause between tests
        
        # AFTER: Stepwise Retrieval
        print("🔍 Testing AFTER (Stepwise v1)...")
        after_metrics = test_search_endpoint(
            test_case["query"], 
            test_case["allergens"], 
            use_stepwise=True
        )
        
        # Compare results
        comparison = {
            "query": test_case["query"],
            "description": test_case["description"],
            "allergens": test_case["allergens"],
            "before": before_metrics,
            "after": after_metrics
        }
        
        results.append(comparison)
        
        # Print comparison
        print(f"\n📊 RESULTS COMPARISON:")
        print(f"   Results Count:     BEFORE {before_metrics['results_count']} → AFTER {after_metrics['results_count']}")
        print(f"   Response Time:     BEFORE {before_metrics['response_time_ms']}ms → AFTER {after_metrics['response_time_ms']}ms")
        
        if before_metrics.get('safety_ok_count') is not None and after_metrics.get('safety_ok_count') is not None:
            print(f"   Safety OK Count:   BEFORE {before_metrics['safety_ok_count']} → AFTER {after_metrics['safety_ok_count']}")
        
        if after_metrics.get('stepwise_passes_count'):
            print(f"   Stepwise Passes:   {after_metrics['stepwise_passes_count']}")
        
        # Show improvement
        result_improvement = after_metrics['results_count'] - before_metrics['results_count']
        if result_improvement > 0:
            print(f"   🎉 IMPROVEMENT: +{result_improvement} results")
        elif result_improvement == 0:
            print(f"   ➡️  STABLE: No change")
        else:
            print(f"   ⚠️  REGRESSION: {result_improvement} results")
        
        time.sleep(1)  # Brief pause between test cases
    
    # Overall summary
    print("\n" + "=" * 80)
    print("📊 OVERALL BEFORE/AFTER SUMMARY")
    print("=" * 80)
    
    total_before_results = sum(r["before"]["results_count"] for r in results)
    total_after_results = sum(r["after"]["results_count"] for r in results)
    
    before_zero_count = sum(r["before"]["zero_results_after_safety"] for r in results)
    after_zero_count = sum(r["after"]["zero_results_after_safety"] for r in results)
    
    avg_before_time = sum(r["before"]["response_time_ms"] for r in results) / len(results)
    avg_after_time = sum(r["after"]["response_time_ms"] for r in results) / len(results)
    
    print(f"📈 Total Results:           BEFORE {total_before_results} → AFTER {total_after_results}")
    print(f"📉 Zero Results Cases:      BEFORE {before_zero_count} → AFTER {after_zero_count}")
    print(f"⏱️  Average Response Time:   BEFORE {avg_before_time:.0f}ms → AFTER {avg_after_time:.0f}ms")
    
    overall_improvement = total_after_results - total_before_results
    zero_improvement = before_zero_count - after_zero_count
    
    print(f"\n🎯 KEY IMPROVEMENTS:")
    print(f"   • Total Result Increase: +{overall_improvement} recipes")
    print(f"   • Zero Result Reduction: -{zero_improvement} cases")
    
    if overall_improvement > 0:
        print(f"   • Recall Improvement: +{(overall_improvement/max(1,total_before_results)*100):.1f}%")
    
    # AnshinScore normalization check
    all_scores = []
    for result in results:
        if result["after"].get("max_anshin_score"):
            all_scores.append(result["after"]["max_anshin_score"])
    
    if all_scores:
        print(f"\n🎨 SCORE NORMALIZATION:")
        print(f"   • Max AnshinScore: {max(all_scores)} (should be ≤100)")
        print(f"   • Min AnshinScore: {min(all_scores)} (should be ≥0)")
        
        if max(all_scores) <= 100 and min(all_scores) >= 0:
            print(f"   ✅ Score normalization working correctly")
        else:
            print(f"   ❌ Score normalization needs fixing")
    
    return results

if __name__ == "__main__":
    results = run_before_after_comparison()
    print(f"\n✅ Testing completed. {len(results)} test cases processed.")