#!/usr/bin/env python3
"""
Safety Gate 2.0 - CLI Test Script
Test the safety gate with Golden Set test cases
"""

import requests
import json
import time
from typing import List, Dict

# Test configuration
BACKEND_URL = "https://recipe-dashboard.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Golden Set test cases from specification
GOLDEN_SET = [
    {
        "query": "卵 乳 小麦 なし パンケーキ レシピ",
        "context": "時短",
        "allergens": "卵,乳,小麦",
        "expected_violations": 0,
        "description": "Time-saving pancake recipe without egg, milk, wheat"
    },
    {
        "query": "乳 小麦 なし スープ 高たんぱく レシピ",
        "context": "健康", 
        "allergens": "乳,小麦",
        "expected_violations": 0,
        "description": "Health-focused high-protein soup without milk, wheat"
    },
    {
        "query": "卵 乳 なし クッキー 簡単 レシピ",
        "context": "初心者",
        "allergens": "卵,乳",
        "expected_violations": 0,
        "description": "Beginner-friendly cookie recipe without egg, milk"
    },
    {
        "query": "卵 乳 小麦 なし ケーキ パーティー レシピ",
        "context": "イベント",
        "allergens": "卵,乳,小麦", 
        "expected_violations": 0,
        "description": "Event cake recipe without egg, milk, wheat"
    },
    {
        "query": "そば なし つゆ レシピ",
        "context": None,
        "allergens": "そば",
        "expected_violations": 0,
        "description": "Broth recipe without buckwheat"
    },
    {
        "query": "ピーナッツ なし 和え物 レシピ",
        "context": None,
        "allergens": "落花生",
        "expected_violations": 0,
        "description": "Dressed salad recipe without peanuts"
    }
]

def test_safety_gate_golden_set():
    """Test Safety Gate 2.0 with Golden Set cases"""
    
    print("=" * 80)
    print("SAFETY GATE 2.0 - GOLDEN SET TESTING")
    print("=" * 80)
    
    total_tests = len(GOLDEN_SET)
    passed_tests = 0
    
    for i, test_case in enumerate(GOLDEN_SET, 1):
        print(f"\n🧪 Test {i}/{total_tests}: {test_case['description']}")
        print("-" * 60)
        
        # Build query parameters
        params = {
            "q": test_case["query"],
            "debug": "1"  # Enable debug mode to see safety info
        }
        
        if test_case["context"]:
            params["context"] = test_case["context"]
            
        if test_case["allergens"]:
            params["allergens"] = test_case["allergens"]
        
        print(f"Query: {test_case['query']}")
        print(f"Context: {test_case['context'] or 'None'}")
        print(f"Selected allergens: {test_case['allergens'] or 'None'}")
        
        try:
            # Make API request
            print("\n🔍 Calling search API...")
            response = requests.get(f"{API_BASE}/v1/search", params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                debug_info = data.get("debug", {})
                
                print(f"✅ API Success: {len(results)} results returned")
                
                # Analyze safety violations
                violations = 0
                violation_details = []
                
                for j, recipe in enumerate(results):
                    safety = recipe.get("safety", {})
                    status = safety.get("status", "unknown")
                    
                    if status != "ok":
                        violations += 1
                        violation_details.append({
                            "position": j + 1,
                            "title": recipe.get("title", "Unknown"),
                            "status": status,
                            "allergens": safety.get("allergens", []),
                            "reasons": safety.get("reasons", []),
                            "hits": len(safety.get("hits", []))
                        })
                
                # Check acceptance criteria
                expected_violations = test_case["expected_violations"]
                
                print(f"\n📊 Safety Analysis:")
                print(f"   Expected violations: {expected_violations}")
                print(f"   Actual violations: {violations}")
                
                if violations == expected_violations:
                    print("✅ PASS - No safety violations found")
                    passed_tests += 1
                else:
                    print("❌ FAIL - Safety violations detected")
                    for violation in violation_details:
                        print(f"   └─ Position {violation['position']}: {violation['title'][:50]}...")
                        print(f"      Status: {violation['status']}, Hits: {violation['hits']}")
                        print(f"      Reasons: {violation['reasons']}")
                
                # Show exclusion stats if available
                exclusion_stats = debug_info.get("exclusionStats", {})
                if exclusion_stats:
                    print(f"\n📈 Exclusion Statistics:")
                    print(f"   Total processed: {exclusion_stats.get('total_processed', 0)}")
                    print(f"   Safety allergen: {exclusion_stats.get('safety_allergen', 0)}")
                    print(f"   Safety ambiguous: {exclusion_stats.get('safety_ambiguous', 0)}")
                    print(f"   Non-recipe schema: {exclusion_stats.get('non_recipe_schema', 0)}")
                    print(f"   Non-recipe layout: {exclusion_stats.get('non_recipe_layout', 0)}")
                
                # Show sample safety info from first result
                if results and len(results) > 0:
                    first_result = results[0]
                    safety_info = first_result.get("safety", {})
                    
                    print(f"\n🔍 Sample Safety Analysis (Result #1):")
                    print(f"   Title: {first_result.get('title', 'Unknown')[:60]}...")
                    print(f"   Safety Status: {safety_info.get('status', 'unknown')}")
                    print(f"   Checked Allergens: {safety_info.get('allergens', [])}")
                    print(f"   Reasons: {safety_info.get('reasons', [])}")
                    print(f"   Hits Count: {len(safety_info.get('hits', []))}")
                
            else:
                print(f"❌ API Error: {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                
        except requests.exceptions.Timeout:
            print("❌ TIMEOUT - API request timed out after 30 seconds")
            
        except Exception as e:
            print(f"❌ ERROR - {str(e)}")
        
        # Brief pause between tests
        time.sleep(2)
    
    # Summary
    print("\n" + "=" * 80)
    print("GOLDEN SET TEST SUMMARY")
    print("=" * 80)
    print(f"Total tests: {total_tests}")
    print(f"Passed tests: {passed_tests}")
    print(f"Failed tests: {total_tests - passed_tests}")
    print(f"Success rate: {(passed_tests / total_tests * 100):.1f}%")
    
    if passed_tests == total_tests:
        print("\n🎉 ALL GOLDEN SET TESTS PASSED!")
        print("Safety Gate 2.0 implementation is working correctly.")
    else:
        print(f"\n⚠️  {total_tests - passed_tests} tests failed.")
        print("Safety Gate 2.0 implementation needs review.")
    
    return passed_tests == total_tests

def test_health_endpoint():
    """Test health endpoint to verify Safety Gate integration"""
    
    print("\n" + "=" * 80)
    print("HEALTH ENDPOINT - SAFETY GATE STATUS")
    print("=" * 80)
    
    try:
        response = requests.get(f"{API_BASE}/v1/health", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Health endpoint accessible")
            print(f"   Datasource: {data.get('datasource', 'unknown')}")
            print(f"   CSE Quota: {data.get('cseQuota', 'unknown')}")
            print(f"   Git SHA: {data.get('gitSha', 'unknown')}")
            print(f"   Timestamp: {data.get('timestamp', 'unknown')}")
            
            env_flags = data.get('envFlags', {})
            print(f"   Environment:")
            print(f"     MOCK_MODE: {env_flags.get('MOCK_MODE', 'unknown')}")
            print(f"     CSE_KEY_PRESENT: {env_flags.get('CSE_KEY_PRESENT', 'unknown')}")
            print(f"     CSE_CX_PRESENT: {env_flags.get('CSE_CX_PRESENT', 'unknown')}")
            
            return True
            
        else:
            print(f"❌ Health endpoint error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Health endpoint failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Safety Gate 2.0 CLI Testing")
    
    # Test health endpoint first
    health_ok = test_health_endpoint()
    
    if health_ok:
        # Run Golden Set tests
        golden_set_ok = test_safety_gate_golden_set()
        
        if golden_set_ok:
            print("\n🎯 Ready for Phase 2 acceptance!")
        else:
            print("\n🔧 Phase 2 needs fixes before acceptance.")
    else:
        print("\n⚠️  Backend health check failed. Fix backend issues first.")