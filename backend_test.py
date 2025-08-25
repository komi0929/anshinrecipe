#!/usr/bin/env python3
"""
Backend API Testing for Anshin Recipe Admin Dashboard
Testing all admin dashboard API endpoints including Funnel, Extract, Domains, and Export functionality
"""

import requests
import json
import os
import sys
from datetime import datetime
import base64
import csv
import io

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

def test_funnel_metrics_endpoint():
    """Test the Funnel Metrics API endpoint comprehensively"""
    print("=" * 80)
    print("TESTING FUNNEL METRICS API ENDPOINT")
    print("=" * 80)
    
    results = {
        "auth_tests": [],
        "data_structure_tests": [],
        "date_range_tests": [],
        "overall_status": "PASS"
    }
    
    # Test 1: Basic Auth Protection
    print("\n1. Testing Basic Auth Protection")
    print("-" * 60)
    
    try:
        # Test with no auth
        response = requests.get(f"{API_BASE}/admin/funnel-metrics", timeout=30)
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
    
    # Test 2: Valid Authentication and Default Response
    print("\n2. Testing Valid Authentication and Default Response")
    print("-" * 60)
    
    try:
        auth_header = create_auth_header(ADMIN_USER, ADMIN_PASS)
        response = requests.get(f"{API_BASE}/admin/funnel-metrics", headers=auth_header, timeout=30)
        
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
                required_keys = ["period_days", "funnel_stages", "conversion_rates", "summary"]
                for key in required_keys:
                    if key in data:
                        print(f"✅ Has required key: {key}")
                        results["data_structure_tests"].append({"test": f"has_{key}", "status": "PASS"})
                    else:
                        print(f"❌ Missing required key: {key}")
                        results["data_structure_tests"].append({"test": f"has_{key}", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                
                # Validate funnel_stages structure
                if "funnel_stages" in data and isinstance(data["funnel_stages"], dict):
                    print("✅ funnel_stages is an object")
                    expected_stages = ["search_submitted", "top3_impression", "top3_click", "dwell_5s_plus"]
                    for stage in expected_stages:
                        if stage in data["funnel_stages"]:
                            stage_data = data["funnel_stages"][stage]
                            if "count" in stage_data and "percentage" in stage_data:
                                print(f"✅ funnel_stages[{stage}] has count and percentage")
                            else:
                                print(f"❌ funnel_stages[{stage}] missing count or percentage")
                                results["overall_status"] = "FAIL"
                        else:
                            print(f"❌ funnel_stages missing stage: {stage}")
                            results["overall_status"] = "FAIL"
                    results["data_structure_tests"].append({"test": "funnel_stages_structure", "status": "PASS"})
                else:
                    print("❌ funnel_stages is not an object")
                    results["data_structure_tests"].append({"test": "funnel_stages_structure", "status": "FAIL"})
                    results["overall_status"] = "FAIL"
                
                # Validate conversion_rates structure
                if "conversion_rates" in data and isinstance(data["conversion_rates"], dict):
                    print("✅ conversion_rates is an object")
                    expected_rates = ["search_to_impression", "impression_to_click", "click_to_dwell", "overall_conversion"]
                    for rate in expected_rates:
                        if rate in data["conversion_rates"]:
                            print(f"✅ conversion_rates has {rate}")
                        else:
                            print(f"❌ conversion_rates missing {rate}")
                            results["overall_status"] = "FAIL"
                    results["data_structure_tests"].append({"test": "conversion_rates_structure", "status": "PASS"})
                else:
                    print("❌ conversion_rates is not an object")
                    results["data_structure_tests"].append({"test": "conversion_rates_structure", "status": "FAIL"})
                    results["overall_status"] = "FAIL"
                
                # Validate summary structure
                if "summary" in data and isinstance(data["summary"], dict):
                    print("✅ summary is an object")
                    summary_keys = ["total_searches", "successful_conversions", "conversion_rate"]
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
                print(f"\n📊 Sample Funnel Data:")
                print(f"   Period: {data.get('period_days', 'N/A')} days")
                print(f"   Total searches: {data.get('summary', {}).get('total_searches', 'N/A')}")
                print(f"   Successful conversions: {data.get('summary', {}).get('successful_conversions', 'N/A')}")
                print(f"   Overall conversion rate: {data.get('summary', {}).get('conversion_rate', 'N/A')}%")
                
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
            response = requests.get(f"{API_BASE}/admin/funnel-metrics?days={days}", headers=auth_header, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                period_days = data.get('period_days', 0)
                total_searches = data.get('summary', {}).get('total_searches', 0)
                print(f"✅ {days} days: Success (200) - Period: {period_days}, Searches: {total_searches}")
                results["date_range_tests"].append({
                    "test": f"{days}_days", 
                    "status": "PASS", 
                    "code": 200,
                    "period_days": period_days,
                    "total_searches": total_searches
                })
                
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
    
    return results

def test_extract_metrics_endpoint():
    """Test the Extract Metrics API endpoint"""
    print("=" * 80)
    print("TESTING EXTRACT METRICS API ENDPOINT")
    print("=" * 80)
    
    results = {
        "auth_tests": [],
        "data_structure_tests": [],
        "overall_status": "PASS"
    }
    
    # Test 1: Basic Auth Protection
    print("\n1. Testing Basic Auth Protection")
    print("-" * 60)
    
    try:
        # Test with no auth
        response = requests.get(f"{API_BASE}/admin/extract-metrics", timeout=30)
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
    
    # Test 2: Valid Authentication and Response Structure
    print("\n2. Testing Valid Authentication and Response Structure")
    print("-" * 60)
    
    try:
        auth_header = create_auth_header(ADMIN_USER, ADMIN_PASS)
        response = requests.get(f"{API_BASE}/admin/extract-metrics", headers=auth_header, timeout=30)
        
        if response.status_code == 200:
            print("✅ Valid auth: Successfully authenticated (200)")
            results["auth_tests"].append({"test": "valid_auth", "status": "PASS", "code": 200})
            
            # Parse JSON response
            try:
                data = response.json()
                print("✅ Response is valid JSON")
                
                # Check required top-level keys
                required_keys = ["parse_source_distribution", "catchphrase_coverage", "extraction_sources", "quality_indicators"]
                for key in required_keys:
                    if key in data:
                        print(f"✅ Has required key: {key}")
                        results["data_structure_tests"].append({"test": f"has_{key}", "status": "PASS"})
                    else:
                        print(f"❌ Missing required key: {key}")
                        results["data_structure_tests"].append({"test": f"has_{key}", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                
                # Validate parse_source_distribution
                if "parse_source_distribution" in data and isinstance(data["parse_source_distribution"], dict):
                    print("✅ parse_source_distribution is an object")
                    expected_sources = ["jsonld", "microdata", "html"]
                    for source in expected_sources:
                        if source in data["parse_source_distribution"]:
                            print(f"✅ parse_source_distribution has {source}")
                        else:
                            print(f"⚠️  parse_source_distribution missing {source}")
                else:
                    print("❌ parse_source_distribution is not an object")
                    results["overall_status"] = "FAIL"
                
                # Validate catchphrase_coverage
                if "catchphrase_coverage" in data and isinstance(data["catchphrase_coverage"], dict):
                    print("✅ catchphrase_coverage is an object")
                    coverage_keys = ["total_recipes", "with_catchphrase", "coverage_rate"]
                    for key in coverage_keys:
                        if key in data["catchphrase_coverage"]:
                            print(f"✅ catchphrase_coverage has {key}")
                        else:
                            print(f"❌ catchphrase_coverage missing {key}")
                            results["overall_status"] = "FAIL"
                else:
                    print("❌ catchphrase_coverage is not an object")
                    results["overall_status"] = "FAIL"
                
                # Print sample data
                print(f"\n📊 Sample Extract Data:")
                coverage = data.get('catchphrase_coverage', {})
                print(f"   Total recipes: {coverage.get('total_recipes', 'N/A')}")
                print(f"   Coverage rate: {coverage.get('coverage_rate', 'N/A')}%")
                quality = data.get('quality_indicators', {})
                print(f"   Avg extraction confidence: {quality.get('avg_extraction_confidence', 'N/A')}%")
                
            except json.JSONDecodeError as e:
                print(f"❌ Response is not valid JSON: {e}")
                results["data_structure_tests"].append({"test": "valid_json", "status": "FAIL", "error": str(e)})
                results["overall_status"] = "FAIL"
                
        else:
            print(f"❌ Valid auth failed: Expected 200, got {response.status_code}")
            results["auth_tests"].append({"test": "valid_auth", "status": "FAIL", "code": response.status_code})
            results["overall_status"] = "FAIL"
            
    except Exception as e:
        print(f"❌ Valid auth test failed: {e}")
        results["auth_tests"].append({"test": "valid_auth", "status": "ERROR", "error": str(e)})
        results["overall_status"] = "FAIL"
    
    return results

def test_domains_metrics_endpoint():
    """Test the Domains Metrics API endpoint"""
    print("=" * 80)
    print("TESTING DOMAINS METRICS API ENDPOINT")
    print("=" * 80)
    
    results = {
        "auth_tests": [],
        "data_structure_tests": [],
        "overall_status": "PASS"
    }
    
    # Test 1: Basic Auth Protection
    print("\n1. Testing Basic Auth Protection")
    print("-" * 60)
    
    try:
        # Test with no auth
        response = requests.get(f"{API_BASE}/admin/domains-metrics", timeout=30)
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
    
    # Test 2: Valid Authentication and Response Structure
    print("\n2. Testing Valid Authentication and Response Structure")
    print("-" * 60)
    
    try:
        auth_header = create_auth_header(ADMIN_USER, ADMIN_PASS)
        response = requests.get(f"{API_BASE}/admin/domains-metrics", headers=auth_header, timeout=30)
        
        if response.status_code == 200:
            print("✅ Valid auth: Successfully authenticated (200)")
            results["auth_tests"].append({"test": "valid_auth", "status": "PASS", "code": 200})
            
            # Parse JSON response
            try:
                data = response.json()
                print("✅ Response is valid JSON")
                
                # Check required top-level keys
                required_keys = ["top_domains", "summary", "violations"]
                for key in required_keys:
                    if key in data:
                        print(f"✅ Has required key: {key}")
                        results["data_structure_tests"].append({"test": f"has_{key}", "status": "PASS"})
                    else:
                        print(f"❌ Missing required key: {key}")
                        results["data_structure_tests"].append({"test": f"has_{key}", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                
                # Validate top_domains structure
                if "top_domains" in data and isinstance(data["top_domains"], list):
                    print("✅ top_domains is an array")
                    if len(data["top_domains"]) > 0:
                        domain = data["top_domains"][0]
                        domain_keys = ["domain", "impressions", "clicks", "ctr", "avg_anshin_score", "violation_flag"]
                        for key in domain_keys:
                            if key in domain:
                                print(f"✅ top_domains[0] has key: {key}")
                            else:
                                print(f"❌ top_domains[0] missing key: {key}")
                                results["overall_status"] = "FAIL"
                    results["data_structure_tests"].append({"test": "top_domains_structure", "status": "PASS"})
                else:
                    print("❌ top_domains is not an array")
                    results["data_structure_tests"].append({"test": "top_domains_structure", "status": "FAIL"})
                    results["overall_status"] = "FAIL"
                
                # Validate summary structure
                if "summary" in data and isinstance(data["summary"], dict):
                    print("✅ summary is an object")
                    summary_keys = ["total_domains", "domains_with_violations", "avg_ctr", "avg_anshin_score"]
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
                print(f"\n📊 Sample Domains Data:")
                summary = data.get('summary', {})
                print(f"   Total domains: {summary.get('total_domains', 'N/A')}")
                print(f"   Domains with violations: {summary.get('domains_with_violations', 'N/A')}")
                print(f"   Average CTR: {summary.get('avg_ctr', 'N/A')}%")
                print(f"   Average Anshin score: {summary.get('avg_anshin_score', 'N/A')}")
                print(f"   Top domains count: {len(data.get('top_domains', []))}")
                
            except json.JSONDecodeError as e:
                print(f"❌ Response is not valid JSON: {e}")
                results["data_structure_tests"].append({"test": "valid_json", "status": "FAIL", "error": str(e)})
                results["overall_status"] = "FAIL"
                
        else:
            print(f"❌ Valid auth failed: Expected 200, got {response.status_code}")
            results["auth_tests"].append({"test": "valid_auth", "status": "FAIL", "code": response.status_code})
            results["overall_status"] = "FAIL"
            
    except Exception as e:
        print(f"❌ Valid auth test failed: {e}")
        results["auth_tests"].append({"test": "valid_auth", "status": "ERROR", "error": str(e)})
        results["overall_status"] = "FAIL"
    
    return results

def test_export_csv_endpoint():
    """Test the Export CSV API endpoint"""
    print("=" * 80)
    print("TESTING EXPORT CSV API ENDPOINT")
    print("=" * 80)
    
    results = {
        "auth_tests": [],
        "csv_tests": [],
        "date_range_tests": [],
        "overall_status": "PASS"
    }
    
    # Test 1: Basic Auth Protection
    print("\n1. Testing Basic Auth Protection")
    print("-" * 60)
    
    try:
        # Test with no auth
        response = requests.get(f"{API_BASE}/admin/export-csv", timeout=30)
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
    
    # Test 2: Valid Authentication and Default CSV Export
    print("\n2. Testing Valid Authentication and Default CSV Export")
    print("-" * 60)
    
    try:
        auth_header = create_auth_header(ADMIN_USER, ADMIN_PASS)
        response = requests.get(f"{API_BASE}/admin/export-csv", headers=auth_header, timeout=30)
        
        if response.status_code == 200:
            print("✅ Valid auth: Successfully authenticated (200)")
            results["auth_tests"].append({"test": "valid_auth", "status": "PASS", "code": 200})
            
            # Check content type
            content_type = response.headers.get('content-type', '')
            if 'text/csv' in content_type:
                print("✅ Response content type is CSV")
                results["csv_tests"].append({"test": "content_type", "status": "PASS"})
            else:
                print(f"❌ Expected CSV content type, got: {content_type}")
                results["csv_tests"].append({"test": "content_type", "status": "FAIL"})
                results["overall_status"] = "FAIL"
            
            # Check content disposition header
            content_disposition = response.headers.get('content-disposition', '')
            if 'attachment' in content_disposition and 'filename=' in content_disposition:
                print("✅ Response has proper download headers")
                results["csv_tests"].append({"test": "download_headers", "status": "PASS"})
            else:
                print(f"❌ Missing or invalid content-disposition header: {content_disposition}")
                results["csv_tests"].append({"test": "download_headers", "status": "FAIL"})
                results["overall_status"] = "FAIL"
            
            # Parse CSV content
            try:
                csv_content = response.text
                csv_reader = csv.reader(io.StringIO(csv_content))
                rows = list(csv_reader)
                
                if len(rows) > 0:
                    headers = rows[0]
                    expected_headers = ['ts', 'session_id', 'context', 'datasource', 'axisShift', 'event_type', 'value']
                    
                    # Check CSV headers
                    if headers == expected_headers:
                        print("✅ CSV headers match expected format")
                        results["csv_tests"].append({"test": "csv_headers", "status": "PASS"})
                    else:
                        print(f"❌ CSV headers mismatch. Expected: {expected_headers}, Got: {headers}")
                        results["csv_tests"].append({"test": "csv_headers", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                    
                    # Check data rows
                    data_rows = len(rows) - 1  # Exclude header
                    print(f"✅ CSV contains {data_rows} data rows")
                    results["csv_tests"].append({"test": "csv_data", "status": "PASS", "rows": data_rows})
                    
                    # Sample first few data rows
                    if data_rows > 0:
                        print(f"📊 Sample CSV data (first 3 rows):")
                        for i, row in enumerate(rows[1:4], 1):  # Skip header, show first 3 data rows
                            print(f"   Row {i}: {row}")
                    
                else:
                    print("⚠️  CSV is empty (no headers)")
                    results["csv_tests"].append({"test": "csv_data", "status": "PASS", "rows": 0})
                
            except Exception as e:
                print(f"❌ Failed to parse CSV content: {e}")
                results["csv_tests"].append({"test": "csv_parsing", "status": "FAIL", "error": str(e)})
                results["overall_status"] = "FAIL"
                
        else:
            print(f"❌ Valid auth failed: Expected 200, got {response.status_code}")
            results["auth_tests"].append({"test": "valid_auth", "status": "FAIL", "code": response.status_code})
            results["overall_status"] = "FAIL"
            
    except Exception as e:
        print(f"❌ Valid auth test failed: {e}")
        results["auth_tests"].append({"test": "valid_auth", "status": "ERROR", "error": str(e)})
        results["overall_status"] = "FAIL"
    
    # Test 3: Date Range Parameters
    print("\n3. Testing Date Range Parameters")
    print("-" * 60)
    
    auth_header = create_auth_header(ADMIN_USER, ADMIN_PASS)
    
    # Test with specific date range
    try:
        response = requests.get(f"{API_BASE}/admin/export-csv?start_date=2024-01-01&end_date=2024-01-31", 
                              headers=auth_header, timeout=30)
        
        if response.status_code == 200:
            print("✅ Date range parameters: Success (200)")
            results["date_range_tests"].append({"test": "date_range", "status": "PASS", "code": 200})
            
            # Check filename contains date range
            content_disposition = response.headers.get('content-disposition', '')
            if '20240101' in content_disposition and '20240131' in content_disposition:
                print("✅ Filename contains date range")
            else:
                print(f"⚠️  Filename may not contain expected date range: {content_disposition}")
                
        else:
            print(f"❌ Date range test failed: {response.status_code}")
            results["date_range_tests"].append({"test": "date_range", "status": "FAIL", "code": response.status_code})
            results["overall_status"] = "FAIL"
            
    except Exception as e:
        print(f"❌ Date range test failed: {e}")
        results["date_range_tests"].append({"test": "date_range", "status": "ERROR", "error": str(e)})
        results["overall_status"] = "FAIL"
    
    return results

def main():
    """Main test execution"""
    print("🧪 ANSHIN RECIPE ADMIN DASHBOARD - BACKEND API TESTING")
    print(f"🌐 Backend URL: {BACKEND_URL}")
    print(f"👤 Admin User: {ADMIN_USER}")
    print(f"🕒 Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test all new admin endpoints
    funnel_results = test_funnel_metrics_endpoint()
    extract_results = test_extract_metrics_endpoint()
    domains_results = test_domains_metrics_endpoint()
    export_results = test_export_csv_endpoint()
    
    # Summary
    print("\n" + "=" * 80)
    print("COMPREHENSIVE TEST SUMMARY")
    print("=" * 80)
    
    all_results = {
        "funnel": funnel_results,
        "extract": extract_results,
        "domains": domains_results,
        "export": export_results
    }
    
    overall_pass = True
    for endpoint, result in all_results.items():
        status = "✅ PASS" if result['overall_status'] == 'PASS' else "❌ FAIL"
        print(f"{endpoint.upper()} Endpoint: {status}")
        if result['overall_status'] != 'PASS':
            overall_pass = False
    
    print(f"\n🎯 OVERALL TEST STATUS: {'✅ ALL PASS' if overall_pass else '❌ SOME FAILED'}")
    
    # Detailed breakdown
    print(f"\n📊 Test Breakdown:")
    for endpoint, result in all_results.items():
        print(f"\n{endpoint.upper()}:")
        if 'auth_tests' in result:
            auth_pass = len([t for t in result['auth_tests'] if t['status'] == 'PASS'])
            auth_total = len(result['auth_tests'])
            print(f"  Auth Tests: {auth_pass}/{auth_total} passed")
        
        if 'data_structure_tests' in result:
            data_pass = len([t for t in result['data_structure_tests'] if t['status'] == 'PASS'])
            data_total = len(result['data_structure_tests'])
            print(f"  Data Structure Tests: {data_pass}/{data_total} passed")
        
        if 'date_range_tests' in result:
            date_pass = len([t for t in result['date_range_tests'] if t['status'] == 'PASS'])
            date_total = len(result['date_range_tests'])
            print(f"  Date Range Tests: {date_pass}/{date_total} passed")
        
        if 'csv_tests' in result:
            csv_pass = len([t for t in result['csv_tests'] if t['status'] == 'PASS'])
            csv_total = len(result['csv_tests'])
            print(f"  CSV Tests: {csv_pass}/{csv_total} passed")
    
    return overall_pass

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)