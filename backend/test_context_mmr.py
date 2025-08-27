#!/usr/bin/env python3
"""
Context Scoring & MMR Uplift v1 - Golden 8 Test Suite
Test P@3 ≥ 0.85 achievement with context-aware scoring and MMR diversity
"""

import requests
import json
import time
from typing import List, Dict, Any

# Test configuration
BACKEND_URL = "https://recipe-dashboard.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Golden 8 test cases (2 per context)
GOLDEN_8 = [
    # Time-saving (時短)
    {
        "query": "卵 乳 小麦 なし パンケーキ レシピ",
        "context": "時短", 
        "allergens": "卵,乳,小麦",
        "expected_evidence": ["分", "材料", "手順"],
        "description": "Time-saving pancake recipe"
    },
    {
        "query": "卵 乳 小麦 なし 炒め物 10分 レシピ",
        "context": "時短",
        "allergens": "卵,乳,小麦", 
        "expected_evidence": ["10分", "材料", "簡単"],
        "description": "Time-saving stir-fry recipe"
    },
    
    # Health (健康)
    {
        "query": "乳 小麦 なし スープ 高たんぱく レシピ",
        "context": "健康",
        "allergens": "乳,小麦",
        "expected_evidence": ["高たんぱく", "栄養", "低カロリー"],
        "description": "Health-focused high-protein soup"
    },
    {
        "query": "卵 乳 小麦 なし サラダ 低糖質 レシピ", 
        "context": "健康",
        "allergens": "卵,乳,小麦",
        "expected_evidence": ["低糖質", "栄養", "ヘルシー"],
        "description": "Health-focused low-carb salad"
    },
    
    # Beginner (初心者)
    {
        "query": "卵 乳 なし クッキー 簡単 レシピ",
        "context": "初心者",
        "allergens": "卵,乳",
        "expected_evidence": ["簡単", "手順", "初心者"],
        "description": "Beginner-friendly cookie recipe"
    },
    {
        "query": "卵 乳 小麦 なし プリン 初心者 レシピ",
        "context": "初心者", 
        "allergens": "卵,乳,小麦",
        "expected_evidence": ["初心者", "簡単", "丁寧"],
        "description": "Beginner-friendly pudding recipe"
    },
    
    # Event (イベント)
    {
        "query": "卵 乳 小麦 なし ケーキ パーティー レシピ",
        "context": "イベント",
        "allergens": "卵,乳,小麦",
        "expected_evidence": ["パーティー", "映え", "華やか"],
        "description": "Event-focused party cake"
    },
    {
        "query": "卵 乳 小麦 なし タルト 映える レシピ",
        "context": "イベント",
        "allergens": "卵,乳,小麦", 
        "expected_evidence": ["映える", "華やか", "写真"],
        "description": "Event-focused photogenic tart"
    }
]

def test_context_mmr_endpoint(
    query: str, 
    context: str,
    allergens: str, 
    expected_evidence: List[str],
    timeout: int = 30
) -> Dict[str, Any]:
    """Test a single Context MMR search"""
    
    params = {
        "q": query,
        "context": context,
        "allergens": allergens, 
        "debug": "1",
        "use_stepwise": "1"  # Ensure stepwise retrieval is used
    }
    
    start_time = time.time()
    
    try:
        response = requests.get(f"{API_BASE}/v1/search", params=params, timeout=timeout)
        response_time_ms = int((time.time() - start_time) * 1000)
        
        if response.status_code == 200:
            data = response.json()
            
            results = data.get("results", [])
            debug_info = data.get("debug", {})
            
            # Calculate P@3 estimate (proxy based on context relevance)
            p_at_3_estimate = calculate_p_at_3_estimate(results[:3], context, expected_evidence)
            
            # Extract diversity metrics
            diversity_violations = count_diversity_violations(results)
            
            # Extract context features and scoring
            context_scoring_working = check_context_scoring_features(results, debug_info)
            
            # Check evidence chips
            evidence_chips_found = check_evidence_chips(results)
            
            # Check MMR indicators
            mmr_working = check_mmr_indicators(debug_info, results)
            
            return {
                "success": True,
                "response_time_ms": response_time_ms,
                "results_count": len(results),
                "p_at_3_estimate": p_at_3_estimate,
                "diversity_violations": diversity_violations,
                "context_scoring_working": context_scoring_working,
                "evidence_chips_found": evidence_chips_found,
                "mmr_working": mmr_working,
                "top3_scores": [r.get("anshinScore", 0) for r in results[:3]],
                "top3_domains": [extract_domain(r.get("url", "")) for r in results[:3]],
                "zero_results_after_safety": 1 if len(results) == 0 else 0
            }
            
        else:
            return {
                "success": False,
                "response_time_ms": response_time_ms,
                "error": f"HTTP {response.status_code}",
                "results_count": 0,
                "p_at_3_estimate": 0.0,
                "zero_results_after_safety": 1
            }
            
    except Exception as e:
        return {
            "success": False,
            "response_time_ms": int((time.time() - start_time) * 1000),
            "error": str(e),
            "results_count": 0,
            "p_at_3_estimate": 0.0,
            "zero_results_after_safety": 1
        }

def calculate_p_at_3_estimate(top3_results: List[Dict], context: str, expected_evidence: List[str]) -> float:
    """Calculate P@3 estimate based on context relevance"""
    
    if not top3_results:
        return 0.0
    
    relevant_count = 0
    
    for result in top3_results:
        # Check if result matches context expectations
        title = result.get("title", "").lower()
        
        # Context-specific relevance checks
        if context == "時短":
            # Time-saving: look for time indicators, simplicity
            if any(indicator in title for indicator in ["分", "簡単", "時短", "手軽"]):
                relevant_count += 1
            elif "パンケーキ" in title or "炒め物" in title:  # Query matches
                relevant_count += 0.7  # Partial relevance
                
        elif context == "健康":
            # Health: look for health keywords
            if any(indicator in title for indicator in ["高たんぱく", "低糖質", "ヘルシー", "栄養"]):
                relevant_count += 1
            elif "スープ" in title or "サラダ" in title:  # Query matches
                relevant_count += 0.7
                
        elif context == "初心者":
            # Beginner: look for simplicity indicators
            if any(indicator in title for indicator in ["簡単", "初心者", "基本", "easy"]):
                relevant_count += 1
            elif "クッキー" in title or "プリン" in title:  # Query matches
                relevant_count += 0.7
                
        elif context == "イベント":
            # Event: look for special occasion keywords
            if any(indicator in title for indicator in ["パーティー", "映え", "華やか", "特別"]):
                relevant_count += 1
            elif "ケーキ" in title or "タルト" in title:  # Query matches
                relevant_count += 0.7
        else:
            # No context or unknown - assume 0.5 relevance
            relevant_count += 0.5
    
    return min(1.0, relevant_count / 3.0)  # Normalize to 0-1

def count_diversity_violations(results: List[Dict]) -> int:
    """Count diversity violations in results"""
    
    violations = 0
    seen_domains = set()
    
    for i, result in enumerate(results):
        domain = extract_domain(result.get("url", ""))
        
        if i < 3:  # Top3 should have unique domains
            if domain in seen_domains:
                violations += 1
        
        seen_domains.add(domain)
    
    return violations

def extract_domain(url: str) -> str:
    """Extract domain from URL"""
    try:
        from urllib.parse import urlparse
        domain = urlparse(url).netloc.lower()
        if domain.startswith('www.'):
            domain = domain[4:]
        return domain
    except:
        return "unknown"

def check_context_scoring_features(results: List[Dict], debug_info: Dict) -> bool:
    """Check if context scoring features are present"""
    
    for result in results:
        # Check for score breakdown
        if "score_breakdown" in result:
            breakdown = result["score_breakdown"]
            required_fields = ["safety", "trust", "context", "popularity"]
            if all(field in breakdown for field in required_fields):
                return True
        
        # Check for context features
        if "context_features" in result:
            features = result["context_features"]
            if any(features.get(field) is not None for field in ["prep_time_minutes", "ingredients_count", "health_keywords"]):
                return True
    
    return False

def check_evidence_chips(results: List[Dict]) -> int:
    """Count evidence chips found in results"""
    
    chip_count = 0
    
    for result in results:
        if "evidence_chips" in result:
            chips = result["evidence_chips"]
            if isinstance(chips, list) and len(chips) > 0:
                chip_count += len(chips)
    
    return chip_count

def check_mmr_indicators(debug_info: Dict, results: List[Dict]) -> bool:
    """Check for MMR re-ranking indicators"""
    
    # Check debug info for MMR metrics
    if "stepwiseMetrics" in debug_info:
        metrics = debug_info["stepwiseMetrics"]
        if "diversity_stats" in metrics:
            return True
    
    # Check results for MMR metadata
    for result in results:
        if "mmr_rank" in result or "diversity_stats" in result:
            return True
    
    return False

def run_golden_8_test_suite():
    """Run comprehensive Golden 8 test suite"""
    
    print("=" * 80)
    print("🎯 CONTEXT SCORING & MMR UPLIFT v1 - GOLDEN 8 TEST SUITE")
    print("Target: P@3 ≥ 0.85 with context relevance and diversity")
    print("=" * 80)
    
    results = []
    total_p_at_3 = 0.0
    total_diversity_violations = 0
    
    for i, test_case in enumerate(GOLDEN_8, 1):
        print(f"\n📋 Test Case {i}/8: {test_case['description']}")
        print(f"Query: {test_case['query']}")
        print(f"Context: {test_case['context']}")
        print(f"Allergens: {test_case['allergens']}")
        print("-" * 60)
        
        # Run test
        result = test_context_mmr_endpoint(
            test_case["query"],
            test_case["context"], 
            test_case["allergens"],
            test_case["expected_evidence"]
        )
        
        results.append({
            "test_case": test_case,
            "result": result
        })
        
        # Print results
        if result["success"]:
            print(f"✅ SUCCESS: {result['results_count']} results in {result['response_time_ms']}ms")
            print(f"   P@3 Estimate: {result['p_at_3_estimate']:.2f}")
            print(f"   Diversity Violations: {result['diversity_violations']}")
            print(f"   Context Scoring: {'✅' if result['context_scoring_working'] else '❌'}")
            print(f"   Evidence Chips: {result['evidence_chips_found']} found")
            print(f"   MMR Working: {'✅' if result['mmr_working'] else '❌'}")
            print(f"   Top3 Scores: {result['top3_scores']}")
            
            total_p_at_3 += result['p_at_3_estimate']
            total_diversity_violations += result['diversity_violations']
            
        else:
            print(f"❌ FAILED: {result.get('error', 'Unknown error')}")
        
        time.sleep(1.5)  # Brief pause between tests
    
    # Overall results
    print("\n" + "=" * 80)
    print("📊 GOLDEN 8 TEST SUITE RESULTS")
    print("=" * 80)
    
    success_count = sum(1 for r in results if r["result"]["success"])
    avg_p_at_3 = total_p_at_3 / len(GOLDEN_8) if GOLDEN_8 else 0
    
    print(f"✅ Successful tests: {success_count}/{len(GOLDEN_8)}")
    print(f"📈 Average P@3: {avg_p_at_3:.3f} (Target: ≥ 0.850)")
    print(f"🎯 Diversity violations: {total_diversity_violations}")
    
    # Check acceptance criteria
    acceptance_criteria = {
        "p_at_3_target": avg_p_at_3 >= 0.85,
        "zero_diversity_violations": total_diversity_violations == 0,
        "all_tests_successful": success_count == len(GOLDEN_8)
    }
    
    print(f"\n🎯 ACCEPTANCE CRITERIA:")
    print(f"   P@3 ≥ 0.85: {'✅ PASS' if acceptance_criteria['p_at_3_target'] else '❌ FAIL'}")
    print(f"   Top3 domain diversity: {'✅ PASS' if acceptance_criteria['zero_diversity_violations'] else '❌ FAIL'}")
    print(f"   All tests successful: {'✅ PASS' if acceptance_criteria['all_tests_successful'] else '❌ FAIL'}")
    
    overall_pass = all(acceptance_criteria.values())
    print(f"\n🏆 OVERALL RESULT: {'✅ PASS - Context MMR Uplift v1 Accepted!' if overall_pass else '❌ FAIL - Needs improvement'}")
    
    return results, acceptance_criteria

if __name__ == "__main__":
    results, criteria = run_golden_8_test_suite()
    
    print(f"\n✅ Testing completed. {len(results)} test cases processed.")
    
    # Show top performing test case
    successful_results = [r for r in results if r["result"]["success"]]
    if successful_results:
        best_result = max(successful_results, key=lambda x: x["result"]["p_at_3_estimate"])
        print(f"\n🏅 Best performing case: {best_result['test_case']['description']}")
        print(f"   P@3: {best_result['result']['p_at_3_estimate']:.3f}")
        print(f"   Context: {best_result['test_case']['context']}")