#!/usr/bin/env python3
"""
CSE Enforcement Testing for 11.1 Implementation
Testing CSE-only enforcement, health endpoint enhancements, and debug field corrections
"""

import requests
import json
import os
import sys
from datetime import datetime
import re

# Configuration
BACKEND_URL = "https://recipe-dashboard.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def test_health_endpoint_structure():
    """Test the Health Endpoint Structure (/api/v1/health) for 11.1 requirements"""
    print("=" * 80)
    print("TESTING HEALTH ENDPOINT STRUCTURE - 11.1 CSE ENFORCEMENT")
    print("=" * 80)
    
    results = {
        "endpoint_tests": [],
        "datasource_tests": [],
        "env_flags_tests": [],
        "git_sha_tests": [],
        "timestamp_tests": [],
        "cse_quota_tests": [],
        "overall_status": "PASS"
    }
    
    print("\n1. Testing Health Endpoint Basic Structure")
    print("-" * 60)
    
    try:
        response = requests.get(f"{API_BASE}/v1/health", timeout=30)
        
        if response.status_code == 200:
            print("✅ Health endpoint: Successfully accessible (200)")
            results["endpoint_tests"].append({"test": "health_accessible", "status": "PASS", "code": 200})
            
            try:
                data = response.json()
                print("✅ Response is valid JSON")
                
                # Check required keys for 11.1
                required_keys = ["datasource", "envFlags", "gitSha", "timestamp", "cseQuota"]
                for key in required_keys:
                    if key in data:
                        print(f"✅ Has required key: {key}")
                        results["endpoint_tests"].append({"test": f"has_{key}", "status": "PASS"})
                    else:
                        print(f"❌ Missing required key: {key}")
                        results["endpoint_tests"].append({"test": f"has_{key}", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                
                # Test datasource field
                print("\n2. Testing Datasource Field")
                print("-" * 60)
                
                datasource = data.get("datasource", "")
                env_flags = data.get("envFlags", {})
                mock_mode = env_flags.get("MOCK_MODE", "")
                cse_key_present = env_flags.get("CSE_KEY_PRESENT", False)
                cse_cx_present = env_flags.get("CSE_CX_PRESENT", False)
                
                print(f"📊 Current Configuration:")
                print(f"   Datasource: {datasource}")
                print(f"   MOCK_MODE: {mock_mode}")
                print(f"   CSE_KEY_PRESENT: {cse_key_present}")
                print(f"   CSE_CX_PRESENT: {cse_cx_present}")
                
                # Verify datasource shows "cse" when MOCK_MODE=0 and CSE keys present
                if mock_mode == 0 and cse_key_present and cse_cx_present:
                    if datasource == "cse":
                        print("✅ Datasource correctly shows 'cse' with MOCK_MODE=0 and CSE keys present")
                        results["datasource_tests"].append({"test": "cse_datasource_production", "status": "PASS"})
                    else:
                        print(f"❌ Expected datasource 'cse' with production config, got '{datasource}'")
                        results["datasource_tests"].append({"test": "cse_datasource_production", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                else:
                    print(f"⚠️  Not in production CSE mode (MOCK_MODE={mock_mode}, CSE_KEY={cse_key_present}, CSE_CX={cse_cx_present})")
                    results["datasource_tests"].append({"test": "cse_datasource_production", "status": "WARNING"})
                
                # Test envFlags structure
                print("\n3. Testing envFlags Structure")
                print("-" * 60)
                
                if isinstance(env_flags, dict):
                    print("✅ envFlags is an object")
                    
                    # Check required envFlags fields
                    required_env_flags = ["MOCK_MODE", "CSE_KEY_PRESENT", "CSE_CX_PRESENT"]
                    for flag in required_env_flags:
                        if flag in env_flags:
                            print(f"✅ envFlags contains {flag}: {env_flags[flag]}")
                            results["env_flags_tests"].append({"test": f"has_{flag}", "status": "PASS"})
                        else:
                            print(f"❌ envFlags missing {flag}")
                            results["env_flags_tests"].append({"test": f"has_{flag}", "status": "FAIL"})
                            results["overall_status"] = "FAIL"
                    
                    # Verify MOCK_MODE is 0 for production
                    if env_flags.get("MOCK_MODE") == 0:
                        print("✅ MOCK_MODE is 0 (production mode)")
                        results["env_flags_tests"].append({"test": "mock_mode_production", "status": "PASS"})
                    else:
                        print(f"⚠️  MOCK_MODE is {env_flags.get('MOCK_MODE')} (not production mode)")
                        results["env_flags_tests"].append({"test": "mock_mode_production", "status": "WARNING"})
                    
                    # Verify CSE keys are present
                    if env_flags.get("CSE_KEY_PRESENT") and env_flags.get("CSE_CX_PRESENT"):
                        print("✅ Both CSE_KEY_PRESENT and CSE_CX_PRESENT are true")
                        results["env_flags_tests"].append({"test": "cse_keys_present", "status": "PASS"})
                    else:
                        print(f"❌ CSE keys not properly configured: KEY={env_flags.get('CSE_KEY_PRESENT')}, CX={env_flags.get('CSE_CX_PRESENT')}")
                        results["env_flags_tests"].append({"test": "cse_keys_present", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                        
                else:
                    print("❌ envFlags is not an object")
                    results["env_flags_tests"].append({"test": "env_flags_structure", "status": "FAIL"})
                    results["overall_status"] = "FAIL"
                
                # Test gitSha field
                print("\n4. Testing gitSha Field")
                print("-" * 60)
                
                git_sha = data.get("gitSha", "")
                if git_sha:
                    print(f"✅ gitSha field is present: {git_sha}")
                    results["git_sha_tests"].append({"test": "git_sha_present", "status": "PASS"})
                    
                    # Verify it looks like a git commit hash (7+ alphanumeric characters)
                    if re.match(r'^[a-f0-9]{7,}$', git_sha) or git_sha == "local-dev":
                        print("✅ gitSha format appears valid")
                        results["git_sha_tests"].append({"test": "git_sha_format", "status": "PASS"})
                    else:
                        print(f"⚠️  gitSha format may be invalid: {git_sha}")
                        results["git_sha_tests"].append({"test": "git_sha_format", "status": "WARNING"})
                else:
                    print("❌ gitSha field is missing or empty")
                    results["git_sha_tests"].append({"test": "git_sha_present", "status": "FAIL"})
                    results["overall_status"] = "FAIL"
                
                # Test timestamp field
                print("\n5. Testing Timestamp Field")
                print("-" * 60)
                
                timestamp = data.get("timestamp", "")
                if timestamp:
                    print(f"✅ timestamp field is present: {timestamp}")
                    results["timestamp_tests"].append({"test": "timestamp_present", "status": "PASS"})
                    
                    # Verify ISO8601 format
                    try:
                        datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                        print("✅ timestamp is in valid ISO8601 format")
                        results["timestamp_tests"].append({"test": "timestamp_iso8601", "status": "PASS"})
                    except ValueError:
                        print(f"❌ timestamp is not in valid ISO8601 format: {timestamp}")
                        results["timestamp_tests"].append({"test": "timestamp_iso8601", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                else:
                    print("❌ timestamp field is missing or empty")
                    results["timestamp_tests"].append({"test": "timestamp_present", "status": "FAIL"})
                    results["overall_status"] = "FAIL"
                
                # Test cseQuota field
                print("\n6. Testing cseQuota Field")
                print("-" * 60)
                
                cse_quota = data.get("cseQuota", "")
                if cse_quota:
                    print(f"✅ cseQuota field is present: {cse_quota}")
                    results["cse_quota_tests"].append({"test": "cse_quota_present", "status": "PASS"})
                    
                    # Verify valid status values
                    valid_statuses = ["ok", "limited", "error"]
                    if cse_quota in valid_statuses:
                        print(f"✅ cseQuota has valid status: {cse_quota}")
                        results["cse_quota_tests"].append({"test": "cse_quota_valid", "status": "PASS"})
                        
                        # For production mode with CSE keys, expect "ok" status
                        if mock_mode == 0 and cse_key_present and cse_cx_present:
                            if cse_quota == "ok":
                                print("✅ cseQuota shows 'ok' status for production CSE mode")
                                results["cse_quota_tests"].append({"test": "cse_quota_ok_production", "status": "PASS"})
                            else:
                                print(f"⚠️  cseQuota shows '{cse_quota}' status (may indicate quota issues)")
                                results["cse_quota_tests"].append({"test": "cse_quota_ok_production", "status": "WARNING"})
                    else:
                        print(f"❌ cseQuota has invalid status: {cse_quota}")
                        results["cse_quota_tests"].append({"test": "cse_quota_valid", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                else:
                    print("❌ cseQuota field is missing or empty")
                    results["cse_quota_tests"].append({"test": "cse_quota_present", "status": "FAIL"})
                    results["overall_status"] = "FAIL"
                
            except json.JSONDecodeError as e:
                print(f"❌ Response is not valid JSON: {e}")
                results["endpoint_tests"].append({"test": "valid_json", "status": "FAIL", "error": str(e)})
                results["overall_status"] = "FAIL"
                
        else:
            print(f"❌ Health endpoint failed: Expected 200, got {response.status_code}")
            results["endpoint_tests"].append({"test": "health_accessible", "status": "FAIL", "code": response.status_code})
            results["overall_status"] = "FAIL"
            
    except Exception as e:
        print(f"❌ Health endpoint test failed: {e}")
        results["endpoint_tests"].append({"test": "health_accessible", "status": "ERROR", "error": str(e)})
        results["overall_status"] = "FAIL"
    
    return results

def test_search_endpoint_debug_fields():
    """Test Search Endpoint Debug Fields (/api/v1/search?debug=1) for 11.1 requirements"""
    print("=" * 80)
    print("TESTING SEARCH ENDPOINT DEBUG FIELDS - 11.1 CSE ENFORCEMENT")
    print("=" * 80)
    
    results = {
        "search_tests": [],
        "debug_tests": [],
        "recipe_tests": [],
        "datasource_tests": [],
        "parse_source_tests": [],
        "overall_status": "PASS"
    }
    
    print("\n1. Testing Search with Debug Mode")
    print("-" * 60)
    
    try:
        # Use the specific query from requirements: "ケーキ レシピ"
        test_query = "ケーキ レシピ"
        response = requests.get(f"{API_BASE}/v1/search?q={test_query}&debug=1", timeout=30)
        
        if response.status_code == 200:
            print(f"✅ Search endpoint with debug: Successfully accessible (200)")
            print(f"   Query: {test_query}")
            results["search_tests"].append({"test": "search_debug_accessible", "status": "PASS", "code": 200})
            
            try:
                data = response.json()
                print("✅ Response is valid JSON")
                
                # Check basic response structure
                if "results" in data and "debug" in data:
                    print("✅ Response contains both results and debug information")
                    results["debug_tests"].append({"test": "has_debug_info", "status": "PASS"})
                    
                    results_list = data.get("results", [])
                    debug_info = data.get("debug", {})
                    
                    print(f"📊 Search Results Summary:")
                    print(f"   Results count: {len(results_list)}")
                    print(f"   Query: {data.get('query', 'N/A')}")
                    
                    # Test 2: Verify each recipe result contains required debug fields
                    print("\n2. Testing Recipe Result Debug Fields")
                    print("-" * 60)
                    
                    if len(results_list) > 0:
                        print(f"✅ Search returned {len(results_list)} results")
                        results["recipe_tests"].append({"test": "has_results", "status": "PASS", "count": len(results_list)})
                        
                        # Check each result for required fields
                        all_results_valid = True
                        datasource_values = set()
                        parse_source_values = set()
                        
                        for i, result in enumerate(results_list):
                            print(f"\n   Testing Result {i+1}:")
                            
                            # Check datasource field
                            datasource = result.get("datasource", "")
                            if datasource:
                                print(f"   ✅ Has datasource: {datasource}")
                                datasource_values.add(datasource)
                                
                                # Verify datasource is "cse" (not "mock") in production
                                if datasource == "cse":
                                    print(f"   ✅ Datasource is 'cse' (production CSE)")
                                elif datasource == "mock":
                                    print(f"   ⚠️  Datasource is 'mock' (fallback mode)")
                                else:
                                    print(f"   ❌ Unexpected datasource: {datasource}")
                                    all_results_valid = False
                            else:
                                print(f"   ❌ Missing datasource field")
                                all_results_valid = False
                            
                            # Check parseSource field
                            parse_source = result.get("parseSource", "")
                            if parse_source:
                                print(f"   ✅ Has parseSource: {parse_source}")
                                parse_source_values.add(parse_source)
                                
                                # Verify parseSource shows actual extraction method (NOT "cse")
                                valid_parse_sources = ["jsonld", "microdata", "html", "mock"]
                                if parse_source in valid_parse_sources:
                                    print(f"   ✅ parseSource shows extraction method: {parse_source}")
                                    if parse_source == "cse":
                                        print(f"   ❌ parseSource should NOT be 'cse' - should show extraction method")
                                        all_results_valid = False
                                else:
                                    print(f"   ❌ Invalid parseSource: {parse_source}")
                                    all_results_valid = False
                            else:
                                print(f"   ❌ Missing parseSource field")
                                all_results_valid = False
                            
                            # Check type field
                            result_type = result.get("type", "")
                            if result_type == "Recipe":
                                print(f"   ✅ Has type: Recipe")
                            else:
                                print(f"   ❌ Expected type 'Recipe', got '{result_type}'")
                                all_results_valid = False
                            
                            # Check type_reason field
                            type_reason = result.get("type_reason", "")
                            if type_reason:
                                print(f"   ✅ Has type_reason: {type_reason}")
                                
                                # Verify type_reason shows detection method
                                valid_patterns = ["jsonld", "microdata", "html_heuristics", "mock_data"]
                                if any(pattern in type_reason for pattern in valid_patterns):
                                    print(f"   ✅ type_reason shows detection method")
                                else:
                                    print(f"   ⚠️  type_reason may not show clear detection method: {type_reason}")
                            else:
                                print(f"   ❌ Missing type_reason field")
                                all_results_valid = False
                            
                            # Check anshinScore field
                            anshin_score = result.get("anshinScore", "")
                            if isinstance(anshin_score, (int, float)):
                                print(f"   ✅ Has anshinScore: {anshin_score}")
                            else:
                                print(f"   ❌ anshinScore is not numeric: {anshin_score}")
                                all_results_valid = False
                            
                            # Check safety field (if present)
                            safety = result.get("safety", {})
                            if safety and isinstance(safety, dict):
                                print(f"   ✅ Has safety object: {safety}")
                                if "status" in safety:
                                    print(f"   ✅ Safety has status: {safety['status']}")
                                if "reasons" in safety:
                                    print(f"   ✅ Safety has reasons: {safety['reasons']}")
                            else:
                                print(f"   ⚠️  No safety object (may be optional)")
                        
                        # Summary of datasource and parseSource values found
                        print(f"\n📊 Debug Fields Summary:")
                        print(f"   Datasource values found: {list(datasource_values)}")
                        print(f"   ParseSource values found: {list(parse_source_values)}")
                        
                        if all_results_valid:
                            print("✅ All recipe results have valid debug fields")
                            results["recipe_tests"].append({"test": "all_results_valid_debug", "status": "PASS"})
                        else:
                            print("❌ Some recipe results have invalid debug fields")
                            results["recipe_tests"].append({"test": "all_results_valid_debug", "status": "FAIL"})
                            results["overall_status"] = "FAIL"
                        
                        # Verify datasource separation from parseSource
                        if "cse" in datasource_values and "cse" not in parse_source_values:
                            print("✅ Datasource and parseSource are correctly separated")
                            results["parse_source_tests"].append({"test": "datasource_parsesource_separation", "status": "PASS"})
                        elif "cse" in parse_source_values:
                            print("❌ parseSource incorrectly shows 'cse' - should show extraction method")
                            results["parse_source_tests"].append({"test": "datasource_parsesource_separation", "status": "FAIL"})
                            results["overall_status"] = "FAIL"
                        else:
                            print("⚠️  Could not verify datasource/parseSource separation (may be in mock mode)")
                            results["parse_source_tests"].append({"test": "datasource_parsesource_separation", "status": "WARNING"})
                        
                    else:
                        print("⚠️  No results returned to test debug fields")
                        results["recipe_tests"].append({"test": "has_results", "status": "WARNING", "count": 0})
                    
                    # Test 3: Verify global debug information
                    print("\n3. Testing Global Debug Information")
                    print("-" * 60)
                    
                    debug_keys = ["datasource", "mockMode", "timestamp"]
                    for key in debug_keys:
                        if key in debug_info:
                            print(f"✅ Debug info has {key}: {debug_info[key]}")
                            results["debug_tests"].append({"test": f"debug_has_{key}", "status": "PASS"})
                        else:
                            print(f"❌ Debug info missing {key}")
                            results["debug_tests"].append({"test": f"debug_has_{key}", "status": "FAIL"})
                            results["overall_status"] = "FAIL"
                    
                    # Verify debug datasource matches production expectations
                    debug_datasource = debug_info.get("datasource", "")
                    if debug_datasource == "cse":
                        print("✅ Debug datasource shows 'cse' (production mode)")
                        results["datasource_tests"].append({"test": "debug_datasource_cse", "status": "PASS"})
                    elif debug_datasource == "mock":
                        print("⚠️  Debug datasource shows 'mock' (fallback mode)")
                        results["datasource_tests"].append({"test": "debug_datasource_cse", "status": "WARNING"})
                    else:
                        print(f"❌ Unexpected debug datasource: {debug_datasource}")
                        results["datasource_tests"].append({"test": "debug_datasource_cse", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                    
                else:
                    print("❌ Response missing results or debug information")
                    results["debug_tests"].append({"test": "has_debug_info", "status": "FAIL"})
                    results["overall_status"] = "FAIL"
                
            except json.JSONDecodeError as e:
                print(f"❌ Response is not valid JSON: {e}")
                results["search_tests"].append({"test": "valid_json", "status": "FAIL", "error": str(e)})
                results["overall_status"] = "FAIL"
                
        elif response.status_code == 502:
            print("⚠️  Search endpoint returned 502 - CSE may have failed")
            results["search_tests"].append({"test": "search_debug_accessible", "status": "WARNING", "code": 502})
            
            # This could be expected behavior for CSE-only enforcement
            try:
                error_data = response.json()
                if "error" in error_data and error_data["error"] == "cse_failed":
                    print("✅ Proper CSE error response structure (CSE-only enforcement working)")
                    results["search_tests"].append({"test": "cse_error_structure", "status": "PASS"})
                else:
                    print("❌ Unexpected error response structure")
                    results["search_tests"].append({"test": "cse_error_structure", "status": "FAIL"})
            except:
                print("❌ Error response is not valid JSON")
                results["search_tests"].append({"test": "cse_error_structure", "status": "FAIL"})
                
        else:
            print(f"❌ Search endpoint failed: Expected 200 or 502, got {response.status_code}")
            results["search_tests"].append({"test": "search_debug_accessible", "status": "FAIL", "code": response.status_code})
            results["overall_status"] = "FAIL"
            
    except Exception as e:
        print(f"❌ Search debug test failed: {e}")
        results["search_tests"].append({"test": "search_debug_accessible", "status": "ERROR", "error": str(e)})
        results["overall_status"] = "FAIL"
    
    return results

def test_cse_only_enforcement():
    """Test CSE-Only Enforcement (No Silent Fallback) for 11.1 requirements"""
    print("=" * 80)
    print("TESTING CSE-ONLY ENFORCEMENT - 11.1 CSE ENFORCEMENT")
    print("=" * 80)
    
    results = {
        "production_tests": [],
        "error_handling_tests": [],
        "fallback_tests": [],
        "overall_status": "PASS"
    }
    
    print("\n1. Testing Production Mode CSE Enforcement")
    print("-" * 60)
    
    try:
        # First check health endpoint to verify current configuration
        health_response = requests.get(f"{API_BASE}/v1/health", timeout=30)
        
        if health_response.status_code == 200:
            health_data = health_response.json()
            env_flags = health_data.get("envFlags", {})
            mock_mode = env_flags.get("MOCK_MODE", "")
            cse_key_present = env_flags.get("CSE_KEY_PRESENT", False)
            cse_cx_present = env_flags.get("CSE_CX_PRESENT", False)
            datasource = health_data.get("datasource", "")
            
            print(f"📊 Current Configuration:")
            print(f"   MOCK_MODE: {mock_mode}")
            print(f"   CSE_KEY_PRESENT: {cse_key_present}")
            print(f"   CSE_CX_PRESENT: {cse_cx_present}")
            print(f"   Datasource: {datasource}")
            
            # Test with MOCK_MODE=0 and valid CSE credentials
            if mock_mode == 0 and cse_key_present and cse_cx_present:
                print("\n✅ Configuration: MOCK_MODE=0 with valid CSE credentials")
                results["production_tests"].append({"test": "production_config", "status": "PASS"})
                
                # Test search should return real CSE results
                test_query = "ケーキ レシピ"
                search_response = requests.get(f"{API_BASE}/v1/search?q={test_query}", timeout=30)
                
                if search_response.status_code == 200:
                    print("✅ Search with valid CSE credentials: Success (200)")
                    results["production_tests"].append({"test": "cse_search_success", "status": "PASS"})
                    
                    try:
                        search_data = search_response.json()
                        results_list = search_data.get("results", [])
                        
                        if len(results_list) > 0:
                            print(f"✅ Search returned {len(results_list)} real CSE results")
                            
                            # Verify results are from CSE (not mock)
                            first_result = results_list[0]
                            result_datasource = first_result.get("datasource", "")
                            
                            if result_datasource == "cse":
                                print("✅ Results show datasource 'cse' (real CSE data)")
                                results["production_tests"].append({"test": "real_cse_results", "status": "PASS"})
                            elif result_datasource == "mock":
                                print("❌ Results show datasource 'mock' (silent fallback detected!)")
                                results["production_tests"].append({"test": "real_cse_results", "status": "FAIL"})
                                results["overall_status"] = "FAIL"
                            else:
                                print(f"⚠️  Unexpected datasource in results: {result_datasource}")
                                results["production_tests"].append({"test": "real_cse_results", "status": "WARNING"})
                            
                            # Check for real URLs (not mock patterns)
                            urls = [result.get("url", "") for result in results_list]
                            real_domains = any("cookpad.com" in url or "kurashiru.com" in url or 
                                             "delish-kitchen.tv" in url or "recipe.rakuten.co.jp" in url 
                                             for url in urls if url.startswith("http"))
                            
                            if real_domains:
                                print("✅ Results contain real domain URLs")
                                results["production_tests"].append({"test": "real_domain_urls", "status": "PASS"})
                            else:
                                print("⚠️  Results may not contain real domain URLs")
                                results["production_tests"].append({"test": "real_domain_urls", "status": "WARNING"})
                        else:
                            print("⚠️  Search returned no results (may be normal)")
                            results["production_tests"].append({"test": "cse_search_results", "status": "WARNING"})
                        
                    except json.JSONDecodeError:
                        print("❌ Search response is not valid JSON")
                        results["production_tests"].append({"test": "cse_search_json", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                        
                elif search_response.status_code == 502:
                    print("⚠️  Search returned 502 - CSE may have failed (testing error handling)")
                    results["production_tests"].append({"test": "cse_search_success", "status": "WARNING"})
                    
                    # This leads us to test error handling
                    print("\n2. Testing CSE Error Handling (502 Response)")
                    print("-" * 60)
                    
                    try:
                        error_data = search_response.json()
                        
                        # Check 502 response structure
                        required_error_fields = ["error", "reason", "requestEcho"]
                        all_fields_present = True
                        
                        for field in required_error_fields:
                            if field in error_data:
                                print(f"✅ Error response has {field}: {error_data[field]}")
                                results["error_handling_tests"].append({"test": f"error_has_{field}", "status": "PASS"})
                            else:
                                print(f"❌ Error response missing {field}")
                                results["error_handling_tests"].append({"test": f"error_has_{field}", "status": "FAIL"})
                                all_fields_present = False
                                results["overall_status"] = "FAIL"
                        
                        if all_fields_present:
                            print("✅ 502 error response has proper structure")
                            results["error_handling_tests"].append({"test": "error_structure_complete", "status": "PASS"})
                        
                        # Verify no silent fallback to mock
                        if error_data.get("error") == "cse_failed":
                            print("✅ CSE failure properly reported (no silent fallback)")
                            results["fallback_tests"].append({"test": "no_silent_fallback", "status": "PASS"})
                        else:
                            print(f"❌ Unexpected error type: {error_data.get('error')}")
                            results["fallback_tests"].append({"test": "no_silent_fallback", "status": "FAIL"})
                            results["overall_status"] = "FAIL"
                        
                    except json.JSONDecodeError:
                        print("❌ 502 error response is not valid JSON")
                        results["error_handling_tests"].append({"test": "error_json_valid", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                        
                else:
                    print(f"❌ Unexpected search response code: {search_response.status_code}")
                    results["production_tests"].append({"test": "cse_search_success", "status": "FAIL"})
                    results["overall_status"] = "FAIL"
                    
            elif mock_mode == 0 and (not cse_key_present or not cse_cx_present):
                print("\n⚠️  Configuration: MOCK_MODE=0 with missing CSE credentials")
                results["production_tests"].append({"test": "production_config", "status": "WARNING"})
                
                # Test should return HTTP 502 with structured error
                test_query = "ケーキ レシピ"
                search_response = requests.get(f"{API_BASE}/v1/search?q={test_query}", timeout=30)
                
                if search_response.status_code == 502:
                    print("✅ Search with missing CSE credentials: Proper 502 error")
                    results["error_handling_tests"].append({"test": "missing_credentials_502", "status": "PASS"})
                    
                    try:
                        error_data = search_response.json()
                        
                        if (error_data.get("error") == "cse_failed" and 
                            error_data.get("reason") == "missing_credentials"):
                            print("✅ Proper error structure for missing credentials")
                            results["error_handling_tests"].append({"test": "missing_credentials_structure", "status": "PASS"})
                        else:
                            print(f"❌ Unexpected error structure: {error_data}")
                            results["error_handling_tests"].append({"test": "missing_credentials_structure", "status": "FAIL"})
                            results["overall_status"] = "FAIL"
                        
                    except json.JSONDecodeError:
                        print("❌ Error response is not valid JSON")
                        results["error_handling_tests"].append({"test": "missing_credentials_json", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                        
                else:
                    print(f"❌ Expected 502 for missing credentials, got {search_response.status_code}")
                    results["error_handling_tests"].append({"test": "missing_credentials_502", "status": "FAIL"})
                    results["overall_status"] = "FAIL"
                    
            else:
                print(f"\n⚠️  Configuration: MOCK_MODE={mock_mode} (not production mode)")
                results["production_tests"].append({"test": "production_config", "status": "WARNING"})
                print("   Cannot test CSE-only enforcement in mock mode")
                
        else:
            print(f"❌ Health endpoint failed: {health_response.status_code}")
            results["production_tests"].append({"test": "health_check", "status": "FAIL"})
            results["overall_status"] = "FAIL"
            
    except Exception as e:
        print(f"❌ CSE enforcement test failed: {e}")
        results["production_tests"].append({"test": "cse_enforcement", "status": "ERROR", "error": str(e)})
        results["overall_status"] = "FAIL"
    
    return results

def test_error_handling_telemetry():
    """Test Error Handling and Telemetry Logging for 11.1 requirements"""
    print("=" * 80)
    print("TESTING ERROR HANDLING & TELEMETRY LOGGING - 11.1 CSE ENFORCEMENT")
    print("=" * 80)
    
    results = {
        "telemetry_tests": [],
        "error_structure_tests": [],
        "overall_status": "PASS"
    }
    
    print("\n1. Testing Telemetry Logging for Success Cases")
    print("-" * 60)
    
    try:
        # Test a search that should generate telemetry logs
        test_query = "ケーキ レシピ"
        search_response = requests.get(f"{API_BASE}/v1/search?q={test_query}", timeout=30)
        
        print(f"📊 Search Response: {search_response.status_code}")
        
        if search_response.status_code in [200, 502]:
            print("✅ Search completed (success or expected error)")
            results["telemetry_tests"].append({"test": "search_completed", "status": "PASS"})
            
            # Note: We can't directly verify telemetry logs from the API response,
            # but we can verify the response structure indicates proper logging
            
            if search_response.status_code == 200:
                try:
                    data = search_response.json()
                    if "debug" in data:
                        debug_info = data["debug"]
                        if "responseTimeMs" in debug_info:
                            print(f"✅ Response includes timing information: {debug_info['responseTimeMs']}ms")
                            results["telemetry_tests"].append({"test": "response_timing", "status": "PASS"})
                        else:
                            print("⚠️  Response missing timing information")
                            results["telemetry_tests"].append({"test": "response_timing", "status": "WARNING"})
                    else:
                        print("⚠️  No debug information to verify telemetry")
                        results["telemetry_tests"].append({"test": "debug_telemetry", "status": "WARNING"})
                        
                except json.JSONDecodeError:
                    print("❌ Success response is not valid JSON")
                    results["telemetry_tests"].append({"test": "success_json", "status": "FAIL"})
                    results["overall_status"] = "FAIL"
                    
        else:
            print(f"❌ Unexpected search response: {search_response.status_code}")
            results["telemetry_tests"].append({"test": "search_completed", "status": "FAIL"})
            results["overall_status"] = "FAIL"
        
        # Test 2: Verify Error Response Structure
        print("\n2. Testing Error Response Structure")
        print("-" * 60)
        
        if search_response.status_code == 502:
            print("✅ Testing 502 error response structure")
            
            try:
                error_data = search_response.json()
                
                # Check required error fields
                required_fields = ["error", "reason", "requestEcho"]
                for field in required_fields:
                    if field in error_data:
                        print(f"✅ Error response has {field}")
                        results["error_structure_tests"].append({"test": f"error_has_{field}", "status": "PASS"})
                    else:
                        print(f"❌ Error response missing {field}")
                        results["error_structure_tests"].append({"test": f"error_has_{field}", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                
                # Verify requestEcho structure
                request_echo = error_data.get("requestEcho", {})
                if isinstance(request_echo, dict):
                    echo_fields = ["cx", "q", "params"]
                    for field in echo_fields:
                        if field in request_echo:
                            print(f"✅ requestEcho has {field}")
                        else:
                            print(f"⚠️  requestEcho missing {field} (may be optional)")
                    
                    print(f"📊 Error Response Structure:")
                    print(f"   Error: {error_data.get('error', 'N/A')}")
                    print(f"   Reason: {error_data.get('reason', 'N/A')}")
                    print(f"   Query in requestEcho: {request_echo.get('q', 'N/A')}")
                    
                    results["error_structure_tests"].append({"test": "request_echo_structure", "status": "PASS"})
                else:
                    print("❌ requestEcho is not an object")
                    results["error_structure_tests"].append({"test": "request_echo_structure", "status": "FAIL"})
                    results["overall_status"] = "FAIL"
                
            except json.JSONDecodeError:
                print("❌ 502 error response is not valid JSON")
                results["error_structure_tests"].append({"test": "error_json_valid", "status": "FAIL"})
                results["overall_status"] = "FAIL"
                
        else:
            print("⚠️  No 502 error to test error structure")
            results["error_structure_tests"].append({"test": "error_response_available", "status": "WARNING"})
        
    except Exception as e:
        print(f"❌ Error handling test failed: {e}")
        results["telemetry_tests"].append({"test": "error_handling", "status": "ERROR", "error": str(e)})
        results["overall_status"] = "FAIL"
    
    return results

def main():
    """Main test execution for 11.1 CSE Enforcement"""
    print("🧪 11.1 CSE ENFORCEMENT TESTING")
    print(f"🌐 Backend URL: {BACKEND_URL}")
    print(f"🕒 Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Execute all 11.1 CSE Enforcement tests
    health_results = test_health_endpoint_structure()
    debug_results = test_search_endpoint_debug_fields()
    enforcement_results = test_cse_only_enforcement()
    telemetry_results = test_error_handling_telemetry()
    
    # Summary
    print("\n" + "=" * 80)
    print("11.1 CSE ENFORCEMENT TEST SUMMARY")
    print("=" * 80)
    
    all_results = {
        "health_endpoint": health_results,
        "debug_fields": debug_results,
        "cse_enforcement": enforcement_results,
        "error_telemetry": telemetry_results
    }
    
    overall_pass = True
    for test_name, result in all_results.items():
        status = "✅ PASS" if result['overall_status'] == 'PASS' else "❌ FAIL"
        print(f"{test_name.upper().replace('_', ' ')}: {status}")
        if result['overall_status'] != 'PASS':
            overall_pass = False
    
    print(f"\n🎯 OVERALL 11.1 CSE ENFORCEMENT STATUS: {'✅ ALL PASS' if overall_pass else '❌ SOME FAILED'}")
    
    # Detailed breakdown
    print(f"\n📊 Detailed Test Breakdown:")
    
    for test_name, result in all_results.items():
        print(f"\n{test_name.upper().replace('_', ' ')}:")
        
        # Count passes for each test category
        for category, tests in result.items():
            if category != 'overall_status' and isinstance(tests, list):
                pass_count = len([t for t in tests if t.get('status') == 'PASS'])
                total_count = len(tests)
                warning_count = len([t for t in tests if t.get('status') == 'WARNING'])
                
                status_icon = "✅" if pass_count == total_count else "⚠️" if warning_count > 0 else "❌"
                print(f"  {category.replace('_', ' ').title()}: {status_icon} {pass_count}/{total_count} passed")
                
                if warning_count > 0:
                    print(f"    ({warning_count} warnings)")
    
    return overall_pass

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)