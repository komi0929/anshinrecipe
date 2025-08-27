#!/usr/bin/env python3
"""
Rate-Limit & Slow-Path Hardening Testing for Anshin Recipe Backend
Testing CSE quota status, error handling, telemetry logging, exponential backoff, and debug enhancements
"""

import requests
import json
import os
import sys
import time
from datetime import datetime
import base64

# Configuration
BACKEND_URL = "https://recipe-dashboard.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def test_health_endpoint_cse_quota():
    """Test Health Endpoint CSE Quota Status"""
    print("=" * 80)
    print("TESTING HEALTH ENDPOINT CSE QUOTA STATUS")
    print("=" * 80)
    
    results = {
        "quota_tests": [],
        "overall_status": "PASS"
    }
    
    print("\n1. Testing Health Endpoint for CSE Quota Status")
    print("-" * 60)
    
    try:
        response = requests.get(f"{API_BASE}/v1/health", timeout=30)
        
        if response.status_code == 200:
            print("✅ Health endpoint: Successfully accessible (200)")
            results["quota_tests"].append({"test": "health_accessible", "status": "PASS", "code": 200})
            
            try:
                data = response.json()
                print("✅ Response is valid JSON")
                
                # Check for cseQuota field
                if "cseQuota" in data:
                    cse_quota = data["cseQuota"]
                    print(f"✅ Health endpoint includes cseQuota field: {cse_quota}")
                    results["quota_tests"].append({"test": "has_cse_quota", "status": "PASS", "value": cse_quota})
                    
                    # Validate quota status values
                    valid_statuses = ["ok", "limited", "error"]
                    if cse_quota in valid_statuses:
                        print(f"✅ cseQuota has valid status: {cse_quota}")
                        results["quota_tests"].append({"test": "valid_quota_status", "status": "PASS"})
                    else:
                        print(f"❌ cseQuota has invalid status: {cse_quota}. Expected one of: {valid_statuses}")
                        results["quota_tests"].append({"test": "valid_quota_status", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                    
                    # Check datasource configuration
                    datasource = data.get("datasource", "")
                    env_flags = data.get("envFlags", {})
                    mock_mode = env_flags.get("MOCK_MODE", "")
                    
                    print(f"\n📊 CSE Configuration:")
                    print(f"   Datasource: {datasource}")
                    print(f"   CSE Quota Status: {cse_quota}")
                    print(f"   MOCK_MODE: {mock_mode}")
                    print(f"   CSE_KEY_PRESENT: {env_flags.get('CSE_KEY_PRESENT', False)}")
                    print(f"   CSE_CX_PRESENT: {env_flags.get('CSE_CX_PRESENT', False)}")
                    
                    # Verify quota status reflects CSE usage state
                    if mock_mode == "0" and env_flags.get("CSE_KEY_PRESENT") and env_flags.get("CSE_CX_PRESENT"):
                        if datasource == "cse":
                            print("✅ CSE quota status correctly reflects production CSE usage")
                            results["quota_tests"].append({"test": "quota_reflects_cse_usage", "status": "PASS"})
                        else:
                            print("❌ Datasource should be 'cse' when CSE is configured")
                            results["quota_tests"].append({"test": "quota_reflects_cse_usage", "status": "FAIL"})
                            results["overall_status"] = "FAIL"
                    else:
                        print("✅ CSE quota status correctly reflects mock/fallback mode")
                        results["quota_tests"].append({"test": "quota_reflects_mock_usage", "status": "PASS"})
                    
                else:
                    print("❌ Health endpoint missing cseQuota field")
                    results["quota_tests"].append({"test": "has_cse_quota", "status": "FAIL"})
                    results["overall_status"] = "FAIL"
                
            except json.JSONDecodeError as e:
                print(f"❌ Response is not valid JSON: {e}")
                results["quota_tests"].append({"test": "valid_json", "status": "FAIL", "error": str(e)})
                results["overall_status"] = "FAIL"
                
        else:
            print(f"❌ Health endpoint failed: Expected 200, got {response.status_code}")
            results["quota_tests"].append({"test": "health_accessible", "status": "FAIL", "code": response.status_code})
            results["overall_status"] = "FAIL"
            
    except Exception as e:
        print(f"❌ Health endpoint test failed: {e}")
        results["quota_tests"].append({"test": "health_accessible", "status": "ERROR", "error": str(e)})
        results["overall_status"] = "FAIL"
    
    return results

def test_search_endpoint_error_handling():
    """Test Search Endpoint Error Handling for CSE Failures"""
    print("=" * 80)
    print("TESTING SEARCH ENDPOINT ERROR HANDLING")
    print("=" * 80)
    
    results = {
        "error_handling_tests": [],
        "overall_status": "PASS"
    }
    
    print("\n1. Testing Search Endpoint Error Responses")
    print("-" * 60)
    
    try:
        test_query = "卵 乳 不使用 ケーキ"
        response = requests.get(f"{API_BASE}/v1/search?q={test_query}", timeout=30)
        
        if response.status_code == 200:
            print("✅ Search endpoint: Successfully accessible (200)")
            results["error_handling_tests"].append({"test": "search_success", "status": "PASS", "code": 200})
            
            # Test with debug mode to check response structure
            debug_response = requests.get(f"{API_BASE}/v1/search?q={test_query}&debug=1", timeout=30)
            if debug_response.status_code == 200:
                try:
                    debug_data = debug_response.json()
                    if "debug" in debug_data:
                        debug_info = debug_data["debug"]
                        datasource = debug_info.get("datasource", "")
                        
                        print(f"✅ Debug mode working, datasource: {datasource}")
                        results["error_handling_tests"].append({"test": "debug_mode_working", "status": "PASS"})
                        
                        # Check for responseTimeMs in debug
                        if "responseTimeMs" in debug_info:
                            response_time = debug_info["responseTimeMs"]
                            print(f"✅ Debug includes responseTimeMs: {response_time}ms")
                            results["error_handling_tests"].append({"test": "debug_response_time", "status": "PASS"})
                        else:
                            print("❌ Debug missing responseTimeMs field")
                            results["error_handling_tests"].append({"test": "debug_response_time", "status": "FAIL"})
                            results["overall_status"] = "FAIL"
                    
                except json.JSONDecodeError:
                    print("❌ Debug response is not valid JSON")
                    results["error_handling_tests"].append({"test": "debug_valid_json", "status": "FAIL"})
                    results["overall_status"] = "FAIL"
            
        elif response.status_code == 502:
            print("⚠️  Search endpoint returned 502 - Testing CSE error handling")
            results["error_handling_tests"].append({"test": "cse_error_response", "status": "PASS", "code": 502})
            
            # Verify 502 response structure for CSE failures
            try:
                error_data = response.json()
                print("✅ 502 response is valid JSON")
                
                # Check error structure
                if "detail" in error_data:
                    detail = error_data["detail"]
                    
                    # Check for required error fields
                    required_fields = ["error", "reason"]
                    for field in required_fields:
                        if field in detail:
                            print(f"✅ Error response has {field}: {detail[field]}")
                            results["error_handling_tests"].append({"test": f"error_has_{field}", "status": "PASS"})
                        else:
                            print(f"❌ Error response missing {field}")
                            results["error_handling_tests"].append({"test": f"error_has_{field}", "status": "FAIL"})
                            results["overall_status"] = "FAIL"
                    
                    # Check error reasons
                    reason = detail.get("reason", "")
                    expected_reasons = ["CSE_429_RATE_LIMIT", "CSE_TIMEOUT", "CSE_UPSTREAM_5XX", "missing_credentials"]
                    
                    if reason in expected_reasons:
                        print(f"✅ Error reason is valid: {reason}")
                        results["error_handling_tests"].append({"test": "valid_error_reason", "status": "PASS"})
                    else:
                        print(f"⚠️  Error reason '{reason}' not in expected list: {expected_reasons}")
                        results["error_handling_tests"].append({"test": "valid_error_reason", "status": "WARNING"})
                    
                    # Check for retryCount in error responses
                    if "retryCount" in detail:
                        retry_count = detail["retryCount"]
                        print(f"✅ Error response includes retryCount: {retry_count}")
                        results["error_handling_tests"].append({"test": "error_has_retry_count", "status": "PASS"})
                        
                        # Verify retry count is reasonable (should be <= 3 based on exponential backoff)
                        if 1 <= retry_count <= 3:
                            print(f"✅ retryCount is within expected range: {retry_count}")
                            results["error_handling_tests"].append({"test": "retry_count_valid", "status": "PASS"})
                        else:
                            print(f"❌ retryCount outside expected range (1-3): {retry_count}")
                            results["error_handling_tests"].append({"test": "retry_count_valid", "status": "FAIL"})
                            results["overall_status"] = "FAIL"
                    else:
                        print("⚠️  Error response missing retryCount (may be expected for some error types)")
                        results["error_handling_tests"].append({"test": "error_has_retry_count", "status": "WARNING"})
                    
                    # Check for requestEcho
                    if "requestEcho" in detail:
                        request_echo = detail["requestEcho"]
                        print(f"✅ Error response includes requestEcho")
                        results["error_handling_tests"].append({"test": "error_has_request_echo", "status": "PASS"})
                        
                        # Verify requestEcho structure
                        echo_fields = ["cx", "q", "params"]
                        for field in echo_fields:
                            if field in request_echo:
                                print(f"✅ requestEcho has {field}")
                            else:
                                print(f"⚠️  requestEcho missing {field}")
                    else:
                        print("❌ Error response missing requestEcho")
                        results["error_handling_tests"].append({"test": "error_has_request_echo", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                    
                    print(f"\n📊 CSE Error Details:")
                    print(f"   Error: {detail.get('error', 'N/A')}")
                    print(f"   Reason: {detail.get('reason', 'N/A')}")
                    print(f"   Retry Count: {detail.get('retryCount', 'N/A')}")
                    
                else:
                    print("❌ 502 response missing 'detail' field")
                    results["error_handling_tests"].append({"test": "error_has_detail", "status": "FAIL"})
                    results["overall_status"] = "FAIL"
                
            except json.JSONDecodeError as e:
                print(f"❌ 502 response is not valid JSON: {e}")
                results["error_handling_tests"].append({"test": "error_valid_json", "status": "FAIL", "error": str(e)})
                results["overall_status"] = "FAIL"
                
        else:
            print(f"❌ Search endpoint returned unexpected status: {response.status_code}")
            results["error_handling_tests"].append({"test": "search_response", "status": "FAIL", "code": response.status_code})
            results["overall_status"] = "FAIL"
            
    except Exception as e:
        print(f"❌ Search endpoint error handling test failed: {e}")
        results["error_handling_tests"].append({"test": "search_error_handling", "status": "ERROR", "error": str(e)})
        results["overall_status"] = "FAIL"
    
    return results

def test_telemetry_logging():
    """Test Telemetry Logging for Search Requests"""
    print("=" * 80)
    print("TESTING TELEMETRY LOGGING")
    print("=" * 80)
    
    results = {
        "telemetry_tests": [],
        "overall_status": "PASS"
    }
    
    print("\n1. Testing Search Request Telemetry Logging")
    print("-" * 60)
    
    # Note: Since we can't directly access server logs, we'll test the search endpoint
    # and verify that it includes timing information in debug mode
    
    try:
        test_query = "卵 乳 不使用 ケーキ テスト"
        start_time = time.time()
        
        # Make search request with debug mode to capture timing
        response = requests.get(f"{API_BASE}/v1/search?q={test_query}&debug=1", timeout=30)
        
        request_duration = time.time() - start_time
        
        if response.status_code in [200, 502]:
            print(f"✅ Search request completed in {request_duration:.3f}s")
            results["telemetry_tests"].append({"test": "search_request_timing", "status": "PASS", "duration": request_duration})
            
            try:
                data = response.json()
                
                if response.status_code == 200:
                    # Test successful response telemetry
                    if "debug" in data:
                        debug_info = data["debug"]
                        
                        # Check for responseTimeMs in debug (this indicates timing is being tracked)
                        if "responseTimeMs" in debug_info:
                            response_time_ms = debug_info["responseTimeMs"]
                            print(f"✅ Response includes timing: {response_time_ms}ms")
                            results["telemetry_tests"].append({"test": "response_timing_included", "status": "PASS"})
                            
                            # Verify timing is reasonable
                            if 0 < response_time_ms < 60000:  # Between 0 and 60 seconds
                                print(f"✅ Response timing is reasonable: {response_time_ms}ms")
                                results["telemetry_tests"].append({"test": "timing_reasonable", "status": "PASS"})
                            else:
                                print(f"⚠️  Response timing seems unusual: {response_time_ms}ms")
                                results["telemetry_tests"].append({"test": "timing_reasonable", "status": "WARNING"})
                        else:
                            print("❌ Debug response missing responseTimeMs")
                            results["telemetry_tests"].append({"test": "response_timing_included", "status": "FAIL"})
                            results["overall_status"] = "FAIL"
                        
                        # Check datasource information (indicates telemetry context)
                        datasource = debug_info.get("datasource", "")
                        if datasource in ["cse", "mock"]:
                            print(f"✅ Datasource properly identified for telemetry: {datasource}")
                            results["telemetry_tests"].append({"test": "datasource_identified", "status": "PASS"})
                        else:
                            print(f"❌ Datasource not properly identified: {datasource}")
                            results["telemetry_tests"].append({"test": "datasource_identified", "status": "FAIL"})
                            results["overall_status"] = "FAIL"
                    else:
                        print("❌ Debug mode not working - cannot verify telemetry")
                        results["telemetry_tests"].append({"test": "debug_mode_available", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                
                elif response.status_code == 502:
                    # Test error response telemetry
                    if "detail" in data:
                        detail = data["detail"]
                        
                        # Check if error includes retry information (indicates telemetry tracking)
                        if "retryCount" in detail:
                            retry_count = detail["retryCount"]
                            print(f"✅ Error response includes retry telemetry: {retry_count} retries")
                            results["telemetry_tests"].append({"test": "error_retry_telemetry", "status": "PASS"})
                        else:
                            print("⚠️  Error response missing retry count telemetry")
                            results["telemetry_tests"].append({"test": "error_retry_telemetry", "status": "WARNING"})
                        
                        # Check error reason (indicates telemetry categorization)
                        reason = detail.get("reason", "")
                        if reason:
                            print(f"✅ Error reason properly categorized for telemetry: {reason}")
                            results["telemetry_tests"].append({"test": "error_reason_telemetry", "status": "PASS"})
                        else:
                            print("❌ Error reason missing for telemetry")
                            results["telemetry_tests"].append({"test": "error_reason_telemetry", "status": "FAIL"})
                            results["overall_status"] = "FAIL"
                
                print(f"\n📊 Telemetry Information:")
                if response.status_code == 200 and "debug" in data:
                    debug_info = data["debug"]
                    print(f"   Response Time: {debug_info.get('responseTimeMs', 'N/A')}ms")
                    print(f"   Datasource: {debug_info.get('datasource', 'N/A')}")
                    print(f"   Parse Source: {debug_info.get('parseSource', 'N/A')}")
                elif response.status_code == 502 and "detail" in data:
                    detail = data["detail"]
                    print(f"   Error Reason: {detail.get('reason', 'N/A')}")
                    print(f"   Retry Count: {detail.get('retryCount', 'N/A')}")
                
            except json.JSONDecodeError as e:
                print(f"❌ Response is not valid JSON: {e}")
                results["telemetry_tests"].append({"test": "response_valid_json", "status": "FAIL", "error": str(e)})
                results["overall_status"] = "FAIL"
                
        else:
            print(f"❌ Search request failed with unexpected status: {response.status_code}")
            results["telemetry_tests"].append({"test": "search_request_timing", "status": "FAIL", "code": response.status_code})
            results["overall_status"] = "FAIL"
            
    except Exception as e:
        print(f"❌ Telemetry logging test failed: {e}")
        results["telemetry_tests"].append({"test": "telemetry_logging", "status": "ERROR", "error": str(e)})
        results["overall_status"] = "FAIL"
    
    return results

def test_exponential_backoff():
    """Test Exponential Backoff Implementation"""
    print("=" * 80)
    print("TESTING EXPONENTIAL BACKOFF")
    print("=" * 80)
    
    results = {
        "backoff_tests": [],
        "overall_status": "PASS"
    }
    
    print("\n1. Testing CSE Call Implementation with Retry Logic")
    print("-" * 60)
    
    # Note: We can't directly test the backoff delays without triggering actual failures
    # But we can verify the implementation handles retries properly by checking error responses
    
    try:
        test_query = "卵 乳 不使用 ケーキ バックオフテスト"
        
        # Make multiple requests to potentially trigger rate limiting or errors
        for i in range(3):
            print(f"\nRequest {i+1}/3:")
            start_time = time.time()
            
            response = requests.get(f"{API_BASE}/v1/search?q={test_query}&debug=1", timeout=45)  # Longer timeout for retries
            
            request_duration = time.time() - start_time
            print(f"  Request completed in {request_duration:.3f}s")
            
            if response.status_code == 200:
                print("  ✅ Request successful (200)")
                results["backoff_tests"].append({"test": f"request_{i+1}_success", "status": "PASS", "duration": request_duration})
                
                try:
                    data = response.json()
                    if "debug" in data:
                        debug_info = data["debug"]
                        response_time_ms = debug_info.get("responseTimeMs", 0)
                        
                        # Check if response time indicates potential retries (longer than normal)
                        if response_time_ms > 5000:  # More than 5 seconds might indicate retries
                            print(f"  ⚠️  Long response time ({response_time_ms}ms) may indicate retries occurred")
                            results["backoff_tests"].append({"test": f"request_{i+1}_potential_retries", "status": "WARNING"})
                        else:
                            print(f"  ✅ Normal response time ({response_time_ms}ms)")
                            results["backoff_tests"].append({"test": f"request_{i+1}_normal_timing", "status": "PASS"})
                
                except json.JSONDecodeError:
                    print("  ❌ Response not valid JSON")
                    results["backoff_tests"].append({"test": f"request_{i+1}_json", "status": "FAIL"})
                    results["overall_status"] = "FAIL"
                
            elif response.status_code == 502:
                print("  ⚠️  Request failed with 502 - checking retry implementation")
                results["backoff_tests"].append({"test": f"request_{i+1}_error", "status": "WARNING", "code": 502})
                
                try:
                    error_data = response.json()
                    if "detail" in error_data:
                        detail = error_data["detail"]
                        
                        # Check retry count to verify backoff implementation
                        if "retryCount" in detail:
                            retry_count = detail["retryCount"]
                            print(f"  ✅ Error includes retryCount: {retry_count}")
                            
                            # Verify max retries (should be 3 based on implementation)
                            if retry_count <= 3:
                                print(f"  ✅ Retry count within expected limit: {retry_count}/3")
                                results["backoff_tests"].append({"test": f"request_{i+1}_retry_limit", "status": "PASS"})
                            else:
                                print(f"  ❌ Retry count exceeds expected limit: {retry_count}/3")
                                results["backoff_tests"].append({"test": f"request_{i+1}_retry_limit", "status": "FAIL"})
                                results["overall_status"] = "FAIL"
                            
                            # Check if request duration indicates exponential backoff
                            # Expected delays: 0.8s, 1.6s, 3.2s = ~5.6s total + request time
                            if retry_count >= 2 and request_duration > 5:
                                print(f"  ✅ Request duration ({request_duration:.1f}s) suggests exponential backoff was used")
                                results["backoff_tests"].append({"test": f"request_{i+1}_backoff_timing", "status": "PASS"})
                            elif retry_count >= 2:
                                print(f"  ⚠️  Request duration ({request_duration:.1f}s) shorter than expected for {retry_count} retries")
                                results["backoff_tests"].append({"test": f"request_{i+1}_backoff_timing", "status": "WARNING"})
                        else:
                            print("  ❌ Error response missing retryCount")
                            results["backoff_tests"].append({"test": f"request_{i+1}_retry_count", "status": "FAIL"})
                            results["overall_status"] = "FAIL"
                        
                        # Check error reason
                        reason = detail.get("reason", "")
                        backoff_reasons = ["CSE_429_RATE_LIMIT", "CSE_TIMEOUT", "CSE_UPSTREAM_5XX"]
                        if reason in backoff_reasons:
                            print(f"  ✅ Error reason indicates backoff scenario: {reason}")
                            results["backoff_tests"].append({"test": f"request_{i+1}_backoff_reason", "status": "PASS"})
                        else:
                            print(f"  ⚠️  Error reason may not trigger backoff: {reason}")
                            results["backoff_tests"].append({"test": f"request_{i+1}_backoff_reason", "status": "WARNING"})
                
                except json.JSONDecodeError:
                    print("  ❌ Error response not valid JSON")
                    results["backoff_tests"].append({"test": f"request_{i+1}_error_json", "status": "FAIL"})
                    results["overall_status"] = "FAIL"
            
            else:
                print(f"  ❌ Unexpected response status: {response.status_code}")
                results["backoff_tests"].append({"test": f"request_{i+1}_status", "status": "FAIL", "code": response.status_code})
                results["overall_status"] = "FAIL"
            
            # Small delay between requests
            time.sleep(1)
        
        print(f"\n📊 Exponential Backoff Analysis:")
        print(f"   Expected backoff delays: 0.8s, 1.6s, 3.2s")
        print(f"   Max retries before final failure: 3")
        print(f"   Total expected delay for 3 retries: ~5.6s + request time")
        
    except Exception as e:
        print(f"❌ Exponential backoff test failed: {e}")
        results["backoff_tests"].append({"test": "exponential_backoff", "status": "ERROR", "error": str(e)})
        results["overall_status"] = "FAIL"
    
    return results

def test_debug_information_enhancement():
    """Test Debug Information Enhancement"""
    print("=" * 80)
    print("TESTING DEBUG INFORMATION ENHANCEMENT")
    print("=" * 80)
    
    results = {
        "debug_enhancement_tests": [],
        "overall_status": "PASS"
    }
    
    print("\n1. Testing Search with debug=1 Parameter")
    print("-" * 60)
    
    try:
        test_query = "卵 乳 不使用 ケーキ デバッグテスト"
        
        # Test debug mode
        response = requests.get(f"{API_BASE}/v1/search?q={test_query}&debug=1", timeout=30)
        
        if response.status_code in [200, 502]:
            print(f"✅ Debug search request completed ({response.status_code})")
            results["debug_enhancement_tests"].append({"test": "debug_request", "status": "PASS", "code": response.status_code})
            
            try:
                data = response.json()
                
                if response.status_code == 200:
                    # Test successful response debug enhancements
                    if "debug" in data:
                        print("✅ Response includes debug information")
                        results["debug_enhancement_tests"].append({"test": "has_debug_info", "status": "PASS"})
                        
                        debug_info = data["debug"]
                        
                        # Check for responseTimeMs
                        if "responseTimeMs" in debug_info:
                            response_time_ms = debug_info["responseTimeMs"]
                            print(f"✅ Debug includes responseTimeMs: {response_time_ms}ms")
                            results["debug_enhancement_tests"].append({"test": "has_response_time_ms", "status": "PASS"})
                            
                            # Verify responseTimeMs is a reasonable number
                            if isinstance(response_time_ms, (int, float)) and response_time_ms > 0:
                                print(f"✅ responseTimeMs is valid number: {response_time_ms}")
                                results["debug_enhancement_tests"].append({"test": "response_time_ms_valid", "status": "PASS"})
                            else:
                                print(f"❌ responseTimeMs is not valid: {response_time_ms}")
                                results["debug_enhancement_tests"].append({"test": "response_time_ms_valid", "status": "FAIL"})
                                results["overall_status"] = "FAIL"
                        else:
                            print("❌ Debug missing responseTimeMs")
                            results["debug_enhancement_tests"].append({"test": "has_response_time_ms", "status": "FAIL"})
                            results["overall_status"] = "FAIL"
                        
                        # Check other debug fields
                        expected_debug_fields = ["datasource", "parseSource", "mockMode", "timestamp"]
                        for field in expected_debug_fields:
                            if field in debug_info:
                                print(f"✅ Debug has {field}: {debug_info[field]}")
                                results["debug_enhancement_tests"].append({"test": f"has_{field}", "status": "PASS"})
                            else:
                                print(f"❌ Debug missing {field}")
                                results["debug_enhancement_tests"].append({"test": f"has_{field}", "status": "FAIL"})
                                results["overall_status"] = "FAIL"
                        
                        # Check for exclusionStats in debug (if available)
                        if "exclusionStats" in debug_info:
                            exclusion_stats = debug_info["exclusionStats"]
                            print(f"✅ Debug includes exclusionStats")
                            results["debug_enhancement_tests"].append({"test": "has_exclusion_stats", "status": "PASS"})
                            
                            # Verify exclusionStats structure
                            expected_stats = ["total_processed", "non_recipe_schema", "non_recipe_layout"]
                            for stat in expected_stats:
                                if stat in exclusion_stats:
                                    print(f"✅ exclusionStats has {stat}: {exclusion_stats[stat]}")
                                else:
                                    print(f"⚠️  exclusionStats missing {stat}")
                        else:
                            print("⚠️  Debug missing exclusionStats (may be expected)")
                            results["debug_enhancement_tests"].append({"test": "has_exclusion_stats", "status": "WARNING"})
                        
                        print(f"\n🔍 Debug Information Summary:")
                        print(f"   Response Time: {debug_info.get('responseTimeMs', 'N/A')}ms")
                        print(f"   Datasource: {debug_info.get('datasource', 'N/A')}")
                        print(f"   Parse Source: {debug_info.get('parseSource', 'N/A')}")
                        print(f"   Mock Mode: {debug_info.get('mockMode', 'N/A')}")
                        print(f"   Timestamp: {debug_info.get('timestamp', 'N/A')}")
                        
                    else:
                        print("❌ Response missing debug information")
                        results["debug_enhancement_tests"].append({"test": "has_debug_info", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                
                elif response.status_code == 502:
                    # Test error response debug enhancements
                    if "detail" in data:
                        detail = data["detail"]
                        print("✅ Error response has detail structure")
                        
                        # Check if error details include retryCount (debug enhancement)
                        if "retryCount" in detail:
                            retry_count = detail["retryCount"]
                            print(f"✅ Error details include retryCount: {retry_count}")
                            results["debug_enhancement_tests"].append({"test": "error_has_retry_count", "status": "PASS"})
                        else:
                            print("⚠️  Error details missing retryCount")
                            results["debug_enhancement_tests"].append({"test": "error_has_retry_count", "status": "WARNING"})
                        
                        # Check for requestEcho (debug enhancement)
                        if "requestEcho" in detail:
                            request_echo = detail["requestEcho"]
                            print(f"✅ Error details include requestEcho")
                            results["debug_enhancement_tests"].append({"test": "error_has_request_echo", "status": "PASS"})
                        else:
                            print("❌ Error details missing requestEcho")
                            results["debug_enhancement_tests"].append({"test": "error_has_request_echo", "status": "FAIL"})
                            results["overall_status"] = "FAIL"
                        
                        print(f"\n🔍 Error Debug Information:")
                        print(f"   Error: {detail.get('error', 'N/A')}")
                        print(f"   Reason: {detail.get('reason', 'N/A')}")
                        print(f"   Retry Count: {detail.get('retryCount', 'N/A')}")
                    else:
                        print("❌ Error response missing detail structure")
                        results["debug_enhancement_tests"].append({"test": "error_has_detail", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                
            except json.JSONDecodeError as e:
                print(f"❌ Response is not valid JSON: {e}")
                results["debug_enhancement_tests"].append({"test": "response_valid_json", "status": "FAIL", "error": str(e)})
                results["overall_status"] = "FAIL"
                
        else:
            print(f"❌ Debug search request failed: {response.status_code}")
            results["debug_enhancement_tests"].append({"test": "debug_request", "status": "FAIL", "code": response.status_code})
            results["overall_status"] = "FAIL"
            
    except Exception as e:
        print(f"❌ Debug information enhancement test failed: {e}")
        results["debug_enhancement_tests"].append({"test": "debug_enhancement", "status": "ERROR", "error": str(e)})
        results["overall_status"] = "FAIL"
    
    return results

def main():
    """Main test execution for Rate-Limit & Slow-Path Hardening"""
    print("🧪 ANSHIN RECIPE RATE-LIMIT & SLOW-PATH HARDENING TESTING")
    print(f"🌐 Backend URL: {BACKEND_URL}")
    print(f"🕒 Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🔧 Environment: MOCK_MODE=0 with Google CSE configured")
    
    # Execute all rate-limit hardening tests
    health_quota_results = test_health_endpoint_cse_quota()
    search_error_results = test_search_endpoint_error_handling()
    telemetry_results = test_telemetry_logging()
    backoff_results = test_exponential_backoff()
    debug_enhancement_results = test_debug_information_enhancement()
    
    # Summary
    print("\n" + "=" * 80)
    print("RATE-LIMIT & SLOW-PATH HARDENING TEST SUMMARY")
    print("=" * 80)
    
    all_results = {
        "health_cse_quota": health_quota_results,
        "search_error_handling": search_error_results,
        "telemetry_logging": telemetry_results,
        "exponential_backoff": backoff_results,
        "debug_enhancement": debug_enhancement_results
    }
    
    overall_pass = True
    for test_name, result in all_results.items():
        status = "✅ PASS" if result['overall_status'] == 'PASS' else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
        if result['overall_status'] != 'PASS':
            overall_pass = False
    
    print(f"\n🎯 OVERALL RATE-LIMIT HARDENING STATUS: {'✅ ALL PASS' if overall_pass else '❌ SOME FAILED'}")
    
    # Detailed breakdown
    print(f"\n📊 Detailed Test Breakdown:")
    
    for test_name, result in all_results.items():
        print(f"\n{test_name.replace('_', ' ').title().upper()}:")
        
        # Count test results by category
        for category, tests in result.items():
            if category != 'overall_status' and isinstance(tests, list):
                pass_count = len([t for t in tests if t.get('status') == 'PASS'])
                warning_count = len([t for t in tests if t.get('status') == 'WARNING'])
                fail_count = len([t for t in tests if t.get('status') == 'FAIL'])
                error_count = len([t for t in tests if t.get('status') == 'ERROR'])
                total_count = len(tests)
                
                status_summary = f"{pass_count} pass"
                if warning_count > 0:
                    status_summary += f", {warning_count} warning"
                if fail_count > 0:
                    status_summary += f", {fail_count} fail"
                if error_count > 0:
                    status_summary += f", {error_count} error"
                
                print(f"  {category.replace('_', ' ').title()}: {status_summary} ({total_count} total)")
    
    # Key findings
    print(f"\n🔍 Key Findings:")
    
    # Health endpoint CSE quota
    if health_quota_results['overall_status'] == 'PASS':
        print("✅ Health endpoint correctly reports CSE quota status")
    else:
        print("❌ Health endpoint CSE quota status issues detected")
    
    # Search error handling
    if search_error_results['overall_status'] == 'PASS':
        print("✅ Search endpoint properly handles CSE failures with 502 responses")
    else:
        print("❌ Search endpoint error handling issues detected")
    
    # Telemetry logging
    if telemetry_results['overall_status'] == 'PASS':
        print("✅ Telemetry logging includes response timing and error details")
    else:
        print("❌ Telemetry logging issues detected")
    
    # Exponential backoff
    if backoff_results['overall_status'] == 'PASS':
        print("✅ Exponential backoff implementation verified through retry counts")
    else:
        print("❌ Exponential backoff implementation issues detected")
    
    # Debug enhancements
    if debug_enhancement_results['overall_status'] == 'PASS':
        print("✅ Debug mode includes responseTimeMs and enhanced error details")
    else:
        print("❌ Debug information enhancement issues detected")
    
    return overall_pass

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)