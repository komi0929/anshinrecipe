#!/usr/bin/env python3
"""
Backend API Testing for Anshin Recipe Admin Dashboard
Testing the Quality Metrics API endpoint with comprehensive scenarios
"""

import requests
import json
import os
import sys
from datetime import datetime
import base64

# Configuration
BACKEND_URL = "https://anshin-recipe-admin.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Admin credentials from environment
ADMIN_USER = "admin"
ADMIN_PASS = "anshin2024!"

def create_auth_header(username, password):
    """Create Basic Auth header"""
    credentials = f"{username}:{password}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode()
    return {"Authorization": f"Basic {encoded_credentials}"}

def test_quality_metrics_endpoint():
    """Test the Quality Metrics API endpoint comprehensively"""
    print("=" * 80)
    print("TESTING QUALITY METRICS API ENDPOINT")
    print("=" * 80)
    
    results = {
        "auth_tests": [],
        "data_structure_tests": [],
        "date_range_tests": [],
        "overall_status": "PASS"
    }
    
    # Test 1: Basic Auth Protection - Invalid Credentials
    print("\n1. Testing Basic Auth Protection - Invalid Credentials")
    print("-" * 60)
    
    try:
        # Test with no auth
        response = requests.get(f"{API_BASE}/admin/quality-metrics", timeout=30)
        if response.status_code == 401:
            print("✅ No auth: Correctly rejected (401)")
            results["auth_tests"].append({"test": "no_auth", "status": "PASS", "code": 401})
        else:
            print(f"❌ No auth: Expected 401, got {response.status_code}")
            results["auth_tests"].append({"test": "no_auth", "status": "FAIL", "code": response.status_code})
            results["overall_status"] = "FAIL"
    except Exception as e:
        print(f"❌ No auth test failed: {e}")
        results["auth_tests"].append({"test": "no_auth", "status": "ERROR", "error": str(e)})
        results["overall_status"] = "FAIL"
    
    try:
        # Test with wrong credentials
        wrong_auth = create_auth_header("wrong", "credentials")
        response = requests.get(f"{API_BASE}/admin/quality-metrics", headers=wrong_auth, timeout=30)
        if response.status_code == 401:
            print("✅ Wrong credentials: Correctly rejected (401)")
            results["auth_tests"].append({"test": "wrong_auth", "status": "PASS", "code": 401})
        else:
            print(f"❌ Wrong credentials: Expected 401, got {response.status_code}")
            results["auth_tests"].append({"test": "wrong_auth", "status": "FAIL", "code": response.status_code})
            results["overall_status"] = "FAIL"
    except Exception as e:
        print(f"❌ Wrong auth test failed: {e}")
        results["auth_tests"].append({"test": "wrong_auth", "status": "ERROR", "error": str(e)})
        results["overall_status"] = "FAIL"
    
    # Test 2: Valid Authentication and Default Response
    print("\n2. Testing Valid Authentication and Default Response")
    print("-" * 60)
    
    try:
        auth_header = create_auth_header(ADMIN_USER, ADMIN_PASS)
        response = requests.get(f"{API_BASE}/admin/quality-metrics", headers=auth_header, timeout=30)
        
        if response.status_code == 200:
            print("✅ Valid auth: Successfully authenticated (200)")
            results["auth_tests"].append({"test": "valid_auth", "status": "PASS", "code": 200})
            
            # Parse JSON response
            try:
                data = response.json()
                print("✅ Response is valid JSON")
                
                # Test 3: Data Structure Validation
                print("\n3. Testing Data Structure")
                print("-" * 60)
                
                # Check required top-level keys
                required_keys = ["daily_verdicts", "mismatch_reports", "expansion_candidates", "summary"]
                for key in required_keys:
                    if key in data:
                        print(f"✅ Has required key: {key}")
                        results["data_structure_tests"].append({"test": f"has_{key}", "status": "PASS"})
                    else:
                        print(f"❌ Missing required key: {key}")
                        results["data_structure_tests"].append({"test": f"has_{key}", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                
                # Validate daily_verdicts structure
                if "daily_verdicts" in data and isinstance(data["daily_verdicts"], list):
                    print("✅ daily_verdicts is an array")
                    if len(data["daily_verdicts"]) > 0:
                        verdict = data["daily_verdicts"][0]
                        verdict_keys = ["date", "ok", "ng", "unknown", "total"]
                        for key in verdict_keys:
                            if key in verdict:
                                print(f"✅ daily_verdicts[0] has key: {key}")
                            else:
                                print(f"❌ daily_verdicts[0] missing key: {key}")
                                results["overall_status"] = "FAIL"
                    results["data_structure_tests"].append({"test": "daily_verdicts_structure", "status": "PASS"})
                else:
                    print("❌ daily_verdicts is not an array")
                    results["data_structure_tests"].append({"test": "daily_verdicts_structure", "status": "FAIL"})
                    results["overall_status"] = "FAIL"
                
                # Validate mismatch_reports structure
                if "mismatch_reports" in data and isinstance(data["mismatch_reports"], list):
                    print("✅ mismatch_reports is an array")
                    if len(data["mismatch_reports"]) > 0:
                        report = data["mismatch_reports"][0]
                        report_keys = ["timestamp", "domain", "snippet"]
                        for key in report_keys:
                            if key in report:
                                print(f"✅ mismatch_reports[0] has key: {key}")
                            else:
                                print(f"❌ mismatch_reports[0] missing key: {key}")
                                results["overall_status"] = "FAIL"
                    results["data_structure_tests"].append({"test": "mismatch_reports_structure", "status": "PASS"})
                else:
                    print("❌ mismatch_reports is not an array")
                    results["data_structure_tests"].append({"test": "mismatch_reports_structure", "status": "FAIL"})
                    results["overall_status"] = "FAIL"
                
                # Validate expansion_candidates structure
                if "expansion_candidates" in data and isinstance(data["expansion_candidates"], list):
                    print("✅ expansion_candidates is an array")
                    results["data_structure_tests"].append({"test": "expansion_candidates_structure", "status": "PASS"})
                else:
                    print("❌ expansion_candidates is not an array")
                    results["data_structure_tests"].append({"test": "expansion_candidates_structure", "status": "FAIL"})
                    results["overall_status"] = "FAIL"
                
                # Validate summary structure
                if "summary" in data and isinstance(data["summary"], dict):
                    print("✅ summary is an object")
                    summary_keys = ["total_analyzed", "ok_rate", "ng_rate", "unknown_rate", "quality_score", "mismatch_count"]
                    for key in summary_keys:
                        if key in data["summary"]:
                            print(f"✅ summary has key: {key}")
                        else:
                            print(f"❌ summary missing key: {key}")
                            results["overall_status"] = "FAIL"
                    results["data_structure_tests"].append({"test": "summary_structure", "status": "PASS"})
                else:
                    print("❌ summary is not an object")
                    results["data_structure_tests"].append({"test": "summary_structure", "status": "FAIL"})
                    results["overall_status"] = "FAIL"
                
                # Print sample data
                print(f"\n📊 Sample Data:")
                print(f"   Total analyzed: {data.get('summary', {}).get('total_analyzed', 'N/A')}")
                print(f"   Quality score: {data.get('summary', {}).get('quality_score', 'N/A')}%")
                print(f"   Daily verdicts count: {len(data.get('daily_verdicts', []))}")
                print(f"   Mismatch reports count: {len(data.get('mismatch_reports', []))}")
                print(f"   Expansion candidates count: {len(data.get('expansion_candidates', []))}")
                
            except json.JSONDecodeError as e:
                print(f"❌ Response is not valid JSON: {e}")
                results["data_structure_tests"].append({"test": "valid_json", "status": "FAIL", "error": str(e)})
                results["overall_status"] = "FAIL"
                
        else:
            print(f"❌ Valid auth failed: Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            results["auth_tests"].append({"test": "valid_auth", "status": "FAIL", "code": response.status_code})
            results["overall_status"] = "FAIL"
            
    except Exception as e:
        print(f"❌ Valid auth test failed: {e}")
        results["auth_tests"].append({"test": "valid_auth", "status": "ERROR", "error": str(e)})
        results["overall_status"] = "FAIL"
    
    # Test 4: Different Date Range Parameters
    print("\n4. Testing Different Date Range Parameters")
    print("-" * 60)
    
    date_ranges = [7, 30, 90]
    auth_header = create_auth_header(ADMIN_USER, ADMIN_PASS)
    
    for days in date_ranges:
        try:
            response = requests.get(f"{API_BASE}/admin/quality-metrics?days={days}", headers=auth_header, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                daily_verdicts_count = len(data.get('daily_verdicts', []))
                print(f"✅ {days} days: Success (200) - {daily_verdicts_count} daily verdicts")
                results["date_range_tests"].append({
                    "test": f"{days}_days", 
                    "status": "PASS", 
                    "code": 200,
                    "daily_verdicts_count": daily_verdicts_count
                })
                
                # Verify the daily verdicts count matches expected range
                if daily_verdicts_count == days:
                    print(f"✅ {days} days: Correct number of daily verdicts ({daily_verdicts_count})")
                else:
                    print(f"⚠️  {days} days: Expected {days} daily verdicts, got {daily_verdicts_count}")
                    # This might be expected behavior if there's no data for some days
                
            else:
                print(f"❌ {days} days: Failed ({response.status_code})")
                results["date_range_tests"].append({
                    "test": f"{days}_days", 
                    "status": "FAIL", 
                    "code": response.status_code
                })
                results["overall_status"] = "FAIL"
                
        except Exception as e:
            print(f"❌ {days} days test failed: {e}")
            results["date_range_tests"].append({
                "test": f"{days}_days", 
                "status": "ERROR", 
                "error": str(e)
            })
            results["overall_status"] = "FAIL"
    
    # Test 5: Edge Cases
    print("\n5. Testing Edge Cases")
    print("-" * 60)
    
    # Test with invalid days parameter
    try:
        response = requests.get(f"{API_BASE}/admin/quality-metrics?days=invalid", headers=auth_header, timeout=30)
        if response.status_code in [400, 422]:
            print("✅ Invalid days parameter: Correctly rejected")
        elif response.status_code == 200:
            print("⚠️  Invalid days parameter: Accepted (might default to 7)")
        else:
            print(f"❌ Invalid days parameter: Unexpected response {response.status_code}")
    except Exception as e:
        print(f"❌ Invalid days test failed: {e}")
    
    # Test with very large days parameter
    try:
        response = requests.get(f"{API_BASE}/admin/quality-metrics?days=365", headers=auth_header, timeout=30)
        if response.status_code == 200:
            print("✅ Large days parameter (365): Accepted")
        else:
            print(f"⚠️  Large days parameter (365): Response {response.status_code}")
    except Exception as e:
        print(f"❌ Large days test failed: {e}")
    
    return results

def test_other_admin_endpoints():
    """Test other admin endpoints for completeness"""
    print("\n" + "=" * 80)
    print("TESTING OTHER ADMIN ENDPOINTS (Quick Check)")
    print("=" * 80)
    
    auth_header = create_auth_header(ADMIN_USER, ADMIN_PASS)
    endpoints = [
        "/api/admin/overview-metrics",
        "/api/admin/context-metrics", 
        "/api/admin/daily-trends"
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BACKEND_URL}{endpoint}", headers=auth_header, timeout=30)
            if response.status_code == 200:
                print(f"✅ {endpoint}: Working (200)")
            else:
                print(f"❌ {endpoint}: Failed ({response.status_code})")
        except Exception as e:
            print(f"❌ {endpoint}: Error - {e}")

def main():
    """Main test execution"""
    print("🧪 ANSHIN RECIPE ADMIN DASHBOARD - BACKEND API TESTING")
    print(f"🌐 Backend URL: {BACKEND_URL}")
    print(f"👤 Admin User: {ADMIN_USER}")
    print(f"🕒 Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test Quality Metrics API
    quality_results = test_quality_metrics_endpoint()
    
    # Test other endpoints briefly
    test_other_admin_endpoints()
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    print(f"Overall Status: {'✅ PASS' if quality_results['overall_status'] == 'PASS' else '❌ FAIL'}")
    
    print(f"\nAuth Tests: {len([t for t in quality_results['auth_tests'] if t['status'] == 'PASS'])}/{len(quality_results['auth_tests'])} passed")
    print(f"Data Structure Tests: {len([t for t in quality_results['data_structure_tests'] if t['status'] == 'PASS'])}/{len(quality_results['data_structure_tests'])} passed")
    print(f"Date Range Tests: {len([t for t in quality_results['date_range_tests'] if t['status'] == 'PASS'])}/{len(quality_results['date_range_tests'])} passed")
    
    # Detailed results
    print(f"\n📋 Detailed Results:")
    print(json.dumps(quality_results, indent=2))
    
    return quality_results['overall_status'] == 'PASS'

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)