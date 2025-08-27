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
BACKEND_URL = "https://recipe-dashboard.preview.emergentagent.com"
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

def test_health_endpoint():
    """Test the Health Check API endpoint for datasource configuration"""
    print("=" * 80)
    print("TESTING HEALTH CHECK API ENDPOINT")
    print("=" * 80)
    
    results = {
        "endpoint_tests": [],
        "datasource_tests": [],
        "overall_status": "PASS"
    }
    
    # Test 1: Basic Health Check
    print("\n1. Testing Basic Health Check")
    print("-" * 60)
    
    try:
        response = requests.get(f"{API_BASE}/v1/health", timeout=30)
        
        if response.status_code == 200:
            print("✅ Health endpoint: Successfully accessible (200)")
            results["endpoint_tests"].append({"test": "health_accessible", "status": "PASS", "code": 200})
            
            # Parse JSON response
            try:
                data = response.json()
                print("✅ Response is valid JSON")
                
                # Check required keys
                required_keys = ["status", "datasource", "envFlags", "gitSha", "timestamp"]
                for key in required_keys:
                    if key in data:
                        print(f"✅ Has required key: {key}")
                        results["endpoint_tests"].append({"test": f"has_{key}", "status": "PASS"})
                    else:
                        print(f"❌ Missing required key: {key}")
                        results["endpoint_tests"].append({"test": f"has_{key}", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                
                # Check datasource configuration
                datasource = data.get("datasource", "")
                env_flags = data.get("envFlags", {})
                mock_mode = env_flags.get("MOCK_MODE", "")
                cse_key_present = env_flags.get("CSE_KEY_PRESENT", False)
                cse_cx_present = env_flags.get("CSE_CX_PRESENT", False)
                
                print(f"\n📊 Datasource Configuration:")
                print(f"   Datasource: {datasource}")
                print(f"   MOCK_MODE: {mock_mode}")
                print(f"   CSE_KEY_PRESENT: {cse_key_present}")
                print(f"   CSE_CX_PRESENT: {cse_cx_present}")
                
                # Validate datasource logic
                if mock_mode == "0" and cse_key_present and cse_cx_present:
                    if datasource == "cse":
                        print("✅ Datasource correctly set to 'cse' for production mode with keys")
                        results["datasource_tests"].append({"test": "production_datasource", "status": "PASS"})
                    else:
                        print(f"❌ Expected datasource 'cse' for production mode, got '{datasource}'")
                        results["datasource_tests"].append({"test": "production_datasource", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                else:
                    if datasource == "mock":
                        print("✅ Datasource correctly set to 'mock' for fallback conditions")
                        results["datasource_tests"].append({"test": "fallback_datasource", "status": "PASS"})
                    else:
                        print(f"❌ Expected datasource 'mock' for fallback conditions, got '{datasource}'")
                        results["datasource_tests"].append({"test": "fallback_datasource", "status": "FAIL"})
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

def test_recipe_type_gate_functionality():
    """Test the Recipe Type Gate & Debug Surface functionality"""
    print("=" * 80)
    print("TESTING RECIPE TYPE GATE & DEBUG SURFACE FUNCTIONALITY")
    print("=" * 80)
    
    results = {
        "recipe_filtering_tests": [],
        "type_detection_tests": [],
        "debug_surface_tests": [],
        "exclusion_stats_tests": [],
        "overall_status": "PASS"
    }
    
    # Test 1: Search with Recipe Filtering
    print("\n1. Testing Search Endpoint with Recipe Filtering")
    print("-" * 60)
    
    try:
        test_query = "卵 乳 不使用 ケーキ"
        response = requests.get(f"{API_BASE}/v1/search?q={test_query}&debug=1", timeout=30)
        
        if response.status_code == 200:
            print("✅ Search endpoint with debug: Successfully accessible (200)")
            results["recipe_filtering_tests"].append({"test": "search_accessible", "status": "PASS", "code": 200})
            
            try:
                data = response.json()
                print("✅ Response is valid JSON")
                
                # Check that all results have type:"Recipe"
                results_list = data.get("results", [])
                if len(results_list) > 0:
                    all_recipes = True
                    type_reasons_found = []
                    
                    for i, result in enumerate(results_list):
                        result_type = result.get("type", "")
                        type_reason = result.get("type_reason", "")
                        
                        if result_type != "Recipe":
                            print(f"❌ Result {i+1} has type '{result_type}', expected 'Recipe'")
                            all_recipes = False
                            results["overall_status"] = "FAIL"
                        else:
                            print(f"✅ Result {i+1} has type 'Recipe'")
                        
                        if type_reason:
                            print(f"✅ Result {i+1} has type_reason: {type_reason}")
                            type_reasons_found.append(type_reason)
                        else:
                            print(f"❌ Result {i+1} missing type_reason field")
                            results["overall_status"] = "FAIL"
                    
                    if all_recipes:
                        print("✅ All results have type:'Recipe' as expected")
                        results["recipe_filtering_tests"].append({"test": "all_results_recipe_type", "status": "PASS"})
                    else:
                        print("❌ Some results do not have type:'Recipe'")
                        results["recipe_filtering_tests"].append({"test": "all_results_recipe_type", "status": "FAIL"})
                    
                    if type_reasons_found:
                        print("✅ All results have type_reason field")
                        results["type_detection_tests"].append({"test": "type_reason_present", "status": "PASS"})
                        print(f"📊 Type detection methods found: {list(set(type_reasons_found))}")
                    else:
                        print("❌ No type_reason fields found")
                        results["type_detection_tests"].append({"test": "type_reason_present", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                    
                else:
                    print("⚠️  No results returned to test recipe filtering")
                    results["recipe_filtering_tests"].append({"test": "has_results", "status": "WARNING"})
                
                # Test 2: Debug Surface with Exclusion Stats
                print("\n2. Testing Debug Surface with Exclusion Statistics")
                print("-" * 60)
                
                if "debug" in data:
                    print("✅ Response contains debug information")
                    results["debug_surface_tests"].append({"test": "has_debug", "status": "PASS"})
                    
                    debug_info = data["debug"]
                    
                    # Check for exclusionStats in debug
                    if "exclusionStats" in debug_info:
                        print("✅ Debug contains exclusionStats")
                        results["exclusion_stats_tests"].append({"test": "has_exclusion_stats", "status": "PASS"})
                        
                        exclusion_stats = debug_info["exclusionStats"]
                        expected_stats = [
                            "non_recipe_schema", "non_recipe_layout", "safety_allergen", 
                            "safety_ambiguous", "fetch_error", "parse_failed", 
                            "ambiguous_layout", "total_processed"
                        ]
                        
                        for stat in expected_stats:
                            if stat in exclusion_stats:
                                print(f"✅ exclusionStats has {stat}: {exclusion_stats[stat]}")
                            else:
                                print(f"❌ exclusionStats missing {stat}")
                                results["overall_status"] = "FAIL"
                        
                        print(f"\n📊 Exclusion Statistics:")
                        print(f"   Total processed: {exclusion_stats.get('total_processed', 0)}")
                        print(f"   Non-recipe schema: {exclusion_stats.get('non_recipe_schema', 0)}")
                        print(f"   Non-recipe layout: {exclusion_stats.get('non_recipe_layout', 0)}")
                        print(f"   Ambiguous layout: {exclusion_stats.get('ambiguous_layout', 0)}")
                        print(f"   Fetch errors: {exclusion_stats.get('fetch_error', 0)}")
                        
                        results["exclusion_stats_tests"].append({"test": "exclusion_stats_structure", "status": "PASS"})
                        
                    else:
                        print("❌ Debug missing exclusionStats")
                        results["exclusion_stats_tests"].append({"test": "has_exclusion_stats", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                    
                    # Check other debug fields
                    debug_keys = ["datasource", "parseSource", "mockMode", "timestamp"]
                    for key in debug_keys:
                        if key in debug_info:
                            print(f"✅ Debug has {key}: {debug_info[key]}")
                        else:
                            print(f"❌ Debug missing {key}")
                            results["overall_status"] = "FAIL"
                    
                else:
                    print("❌ Response missing debug information")
                    results["debug_surface_tests"].append({"test": "has_debug", "status": "FAIL"})
                    results["overall_status"] = "FAIL"
                
            except json.JSONDecodeError as e:
                print(f"❌ Response is not valid JSON: {e}")
                results["recipe_filtering_tests"].append({"test": "valid_json", "status": "FAIL", "error": str(e)})
                results["overall_status"] = "FAIL"
                
        elif response.status_code == 502:
            print("⚠️  Search endpoint returned 502 - CSE may have failed")
            results["recipe_filtering_tests"].append({"test": "search_accessible", "status": "WARNING", "code": 502})
        else:
            print(f"❌ Search endpoint failed: Expected 200 or 502, got {response.status_code}")
            results["recipe_filtering_tests"].append({"test": "search_accessible", "status": "FAIL", "code": response.status_code})
            results["overall_status"] = "FAIL"
            
    except Exception as e:
        print(f"❌ Recipe type gate test failed: {e}")
        results["recipe_filtering_tests"].append({"test": "search_accessible", "status": "ERROR", "error": str(e)})
        results["overall_status"] = "FAIL"
    
    return results

def test_quality_metrics_with_exclusions():
    """Test Quality Metrics API endpoint with daily exclusions data"""
    print("=" * 80)
    print("TESTING QUALITY METRICS API WITH EXCLUSION DATA")
    print("=" * 80)
    
    results = {
        "auth_tests": [],
        "exclusion_data_tests": [],
        "overall_status": "PASS"
    }
    
    # Test 1: Basic Auth Protection
    print("\n1. Testing Basic Auth Protection")
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
    
    # Test 2: Valid Authentication and Exclusion Data
    print("\n2. Testing Valid Authentication and Exclusion Data")
    print("-" * 60)
    
    try:
        auth_header = create_auth_header(ADMIN_USER, ADMIN_PASS)
        response = requests.get(f"{API_BASE}/admin/quality-metrics", headers=auth_header, timeout=30)
        
        if response.status_code == 200:
            print("✅ Valid auth: Successfully authenticated (200)")
            results["auth_tests"].append({"test": "valid_auth", "status": "PASS", "code": 200})
            
            try:
                data = response.json()
                print("✅ Response is valid JSON")
                
                # Check for daily_exclusions in response
                if "daily_exclusions" in data:
                    print("✅ Response contains daily_exclusions data")
                    results["exclusion_data_tests"].append({"test": "has_daily_exclusions", "status": "PASS"})
                    
                    daily_exclusions = data["daily_exclusions"]
                    if isinstance(daily_exclusions, list):
                        print("✅ daily_exclusions is an array")
                        results["exclusion_data_tests"].append({"test": "daily_exclusions_array", "status": "PASS"})
                        
                        if len(daily_exclusions) > 0:
                            print(f"✅ daily_exclusions contains {len(daily_exclusions)} entries")
                            
                            # Check structure of first exclusion entry
                            first_entry = daily_exclusions[0]
                            expected_keys = ["date", "exclusion_reasons"]
                            for key in expected_keys:
                                if key in first_entry:
                                    print(f"✅ daily_exclusions entry has {key}")
                                else:
                                    print(f"❌ daily_exclusions entry missing {key}")
                                    results["overall_status"] = "FAIL"
                            
                            # Check exclusion reasons structure
                            if "exclusion_reasons" in first_entry:
                                exclusion_reasons = first_entry["exclusion_reasons"]
                                expected_reasons = [
                                    "non_recipe_schema", "non_recipe_layout", 
                                    "safety_allergen", "safety_ambiguous", 
                                    "fetch_error", "parse_failed", "ambiguous_layout"
                                ]
                                
                                for reason in expected_reasons:
                                    if reason in exclusion_reasons:
                                        print(f"✅ exclusion_reasons has {reason}: {exclusion_reasons[reason]}")
                                    else:
                                        print(f"⚠️  exclusion_reasons missing {reason} (may be 0)")
                                
                                print(f"\n📊 Sample Exclusion Data:")
                                print(f"   Date: {first_entry.get('date', 'N/A')}")
                                print(f"   Non-recipe schema: {exclusion_reasons.get('non_recipe_schema', 0)}")
                                print(f"   Non-recipe layout: {exclusion_reasons.get('non_recipe_layout', 0)}")
                                print(f"   Fetch errors: {exclusion_reasons.get('fetch_error', 0)}")
                                
                                results["exclusion_data_tests"].append({"test": "exclusion_reasons_structure", "status": "PASS"})
                            
                        else:
                            print("⚠️  daily_exclusions array is empty")
                            results["exclusion_data_tests"].append({"test": "daily_exclusions_data", "status": "WARNING"})
                    else:
                        print("❌ daily_exclusions is not an array")
                        results["exclusion_data_tests"].append({"test": "daily_exclusions_array", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                else:
                    print("❌ Response missing daily_exclusions data")
                    results["exclusion_data_tests"].append({"test": "has_daily_exclusions", "status": "FAIL"})
                    results["overall_status"] = "FAIL"
                
                # Check other expected quality metrics fields
                expected_fields = ["daily_verdicts", "mismatch_reports", "expansion_candidates", "summary"]
                for field in expected_fields:
                    if field in data:
                        print(f"✅ Response has {field}")
                    else:
                        print(f"⚠️  Response missing {field}")
                
            except json.JSONDecodeError as e:
                print(f"❌ Response is not valid JSON: {e}")
                results["exclusion_data_tests"].append({"test": "valid_json", "status": "FAIL", "error": str(e)})
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

def test_search_endpoint_production():
    """Test the Search API endpoint in production mode (MOCK_MODE=0)"""
    print("=" * 80)
    print("TESTING SEARCH API ENDPOINT - PRODUCTION MODE")
    print("=" * 80)
    
    results = {
        "search_tests": [],
        "debug_tests": [],
        "error_tests": [],
        "overall_status": "PASS"
    }
    
    # Test 1: Basic Search Query
    print("\n1. Testing Basic Search Query")
    print("-" * 60)
    
    try:
        test_query = "卵 乳 不使用 ケーキ"
        response = requests.get(f"{API_BASE}/v1/search?q={test_query}", timeout=30)
        
        if response.status_code == 200:
            print("✅ Search endpoint: Successfully accessible (200)")
            results["search_tests"].append({"test": "search_accessible", "status": "PASS", "code": 200})
            
            # Parse JSON response
            try:
                data = response.json()
                print("✅ Response is valid JSON")
                
                # Check required keys
                required_keys = ["results", "count", "query"]
                for key in required_keys:
                    if key in data:
                        print(f"✅ Has required key: {key}")
                        results["search_tests"].append({"test": f"has_{key}", "status": "PASS"})
                    else:
                        print(f"❌ Missing required key: {key}")
                        results["search_tests"].append({"test": f"has_{key}", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                
                # Check results structure
                results_list = data.get("results", [])
                count = data.get("count", 0)
                query = data.get("query", "")
                
                print(f"\n📊 Search Results:")
                print(f"   Query: {query}")
                print(f"   Count: {count}")
                print(f"   Results length: {len(results_list)}")
                
                if len(results_list) > 0:
                    print("✅ Search returned results")
                    results["search_tests"].append({"test": "has_results", "status": "PASS", "count": len(results_list)})
                    
                    # Check first result structure
                    first_result = results_list[0]
                    result_keys = ["id", "title", "source", "anshinScore", "url"]
                    for key in result_keys:
                        if key in first_result:
                            print(f"✅ First result has key: {key}")
                        else:
                            print(f"❌ First result missing key: {key}")
                            results["overall_status"] = "FAIL"
                    
                    # Check if results are from real domains (not mock data)
                    real_domains = ["cookpad.com", "kurashiru.com", "delish-kitchen.tv", "recipe.rakuten.co.jp", "orangepage.net"]
                    mock_domains = ["cookpad.com", "kurashiru.com", "delish-kitchen.tv"]  # These appear in mock data too
                    
                    sources = [result.get("source", "") for result in results_list]
                    print(f"   Sources found: {list(set(sources))}")
                    
                    # Check for real URLs (not mock patterns)
                    urls = [result.get("url", "") for result in results_list]
                    real_url_patterns = ["https://", "http://"]
                    has_real_urls = any(any(pattern in url for pattern in real_url_patterns) for url in urls)
                    
                    if has_real_urls:
                        print("✅ Results contain real URLs")
                        results["search_tests"].append({"test": "real_urls", "status": "PASS"})
                    else:
                        print("⚠️  Results may not contain real URLs")
                        results["search_tests"].append({"test": "real_urls", "status": "WARNING"})
                    
                    # Sample first result
                    print(f"\n📋 Sample Result:")
                    print(f"   Title: {first_result.get('title', 'N/A')}")
                    print(f"   Source: {first_result.get('source', 'N/A')}")
                    print(f"   URL: {first_result.get('url', 'N/A')}")
                    print(f"   AnshinScore: {first_result.get('anshinScore', 'N/A')}")
                    
                else:
                    print("⚠️  Search returned no results")
                    results["search_tests"].append({"test": "has_results", "status": "WARNING", "count": 0})
                
            except json.JSONDecodeError as e:
                print(f"❌ Response is not valid JSON: {e}")
                results["search_tests"].append({"test": "valid_json", "status": "FAIL", "error": str(e)})
                results["overall_status"] = "FAIL"
                
        elif response.status_code == 502:
            print("⚠️  Search endpoint returned 502 - CSE may have failed")
            results["search_tests"].append({"test": "search_accessible", "status": "WARNING", "code": 502})
            
            # Check if it's a proper CSE error response
            try:
                error_data = response.json()
                if "error" in error_data and error_data["error"] == "cse_failed":
                    print("✅ Proper CSE error response structure")
                    results["error_tests"].append({"test": "cse_error_structure", "status": "PASS"})
                else:
                    print("❌ Unexpected error response structure")
                    results["error_tests"].append({"test": "cse_error_structure", "status": "FAIL"})
            except:
                print("❌ Error response is not valid JSON")
                results["error_tests"].append({"test": "cse_error_structure", "status": "FAIL"})
                
        else:
            print(f"❌ Search endpoint failed: Expected 200 or 502, got {response.status_code}")
            results["search_tests"].append({"test": "search_accessible", "status": "FAIL", "code": response.status_code})
            results["overall_status"] = "FAIL"
            
    except Exception as e:
        print(f"❌ Search endpoint test failed: {e}")
        results["search_tests"].append({"test": "search_accessible", "status": "ERROR", "error": str(e)})
        results["overall_status"] = "FAIL"
    
    # Test 2: Debug Mode
    print("\n2. Testing Debug Mode")
    print("-" * 60)
    
    try:
        test_query = "卵 乳 不使用 ケーキ"
        response = requests.get(f"{API_BASE}/v1/search?q={test_query}&debug=1", timeout=30)
        
        if response.status_code == 200:
            print("✅ Debug mode: Successfully accessible (200)")
            results["debug_tests"].append({"test": "debug_accessible", "status": "PASS", "code": 200})
            
            try:
                data = response.json()
                
                # Check for debug information
                if "debug" in data:
                    print("✅ Response contains debug information")
                    results["debug_tests"].append({"test": "has_debug", "status": "PASS"})
                    
                    debug_info = data["debug"]
                    debug_keys = ["datasource", "parseSource", "mockMode", "timestamp"]
                    for key in debug_keys:
                        if key in debug_info:
                            print(f"✅ Debug info has key: {key}")
                        else:
                            print(f"❌ Debug info missing key: {key}")
                            results["overall_status"] = "FAIL"
                    
                    # Check datasource in debug
                    datasource = debug_info.get("datasource", "")
                    if datasource == "cse":
                        print("✅ Debug shows datasource as 'cse' (production mode)")
                        results["debug_tests"].append({"test": "debug_datasource_cse", "status": "PASS"})
                    elif datasource == "mock":
                        print("⚠️  Debug shows datasource as 'mock' (fallback mode)")
                        results["debug_tests"].append({"test": "debug_datasource_mock", "status": "WARNING"})
                    else:
                        print(f"❌ Unexpected datasource in debug: {datasource}")
                        results["debug_tests"].append({"test": "debug_datasource", "status": "FAIL"})
                        results["overall_status"] = "FAIL"
                    
                    print(f"\n🔍 Debug Information:")
                    print(f"   Datasource: {debug_info.get('datasource', 'N/A')}")
                    print(f"   ParseSource: {debug_info.get('parseSource', 'N/A')}")
                    print(f"   MockMode: {debug_info.get('mockMode', 'N/A')}")
                    print(f"   FallbackReason: {debug_info.get('fallbackReason', 'N/A')}")
                    
                else:
                    print("❌ Response missing debug information")
                    results["debug_tests"].append({"test": "has_debug", "status": "FAIL"})
                    results["overall_status"] = "FAIL"
                
            except json.JSONDecodeError as e:
                print(f"❌ Debug response is not valid JSON: {e}")
                results["debug_tests"].append({"test": "debug_valid_json", "status": "FAIL", "error": str(e)})
                results["overall_status"] = "FAIL"
                
        elif response.status_code == 502:
            print("⚠️  Debug mode returned 502 - CSE may have failed")
            results["debug_tests"].append({"test": "debug_accessible", "status": "WARNING", "code": 502})
        else:
            print(f"❌ Debug mode failed: Expected 200 or 502, got {response.status_code}")
            results["debug_tests"].append({"test": "debug_accessible", "status": "FAIL", "code": response.status_code})
            results["overall_status"] = "FAIL"
            
    except Exception as e:
        print(f"❌ Debug mode test failed: {e}")
        results["debug_tests"].append({"test": "debug_accessible", "status": "ERROR", "error": str(e)})
        results["overall_status"] = "FAIL"
    
    return results

def main():
    """Main test execution"""
    print("🧪 ANSHIN RECIPE SEARCH DATASOURCE - BACKEND API TESTING")
    print(f"🌐 Backend URL: {BACKEND_URL}")
    print(f"🕒 Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test NEW Recipe Type Gate & Debug Surface functionality
    recipe_gate_results = test_recipe_type_gate_functionality()
    quality_exclusions_results = test_quality_metrics_with_exclusions()
    
    # Test search datasource functionality
    health_results = test_health_endpoint()
    search_results = test_search_endpoint_production()
    
    # Test all admin endpoints (existing functionality)
    funnel_results = test_funnel_metrics_endpoint()
    extract_results = test_extract_metrics_endpoint()
    domains_results = test_domains_metrics_endpoint()
    export_results = test_export_csv_endpoint()
    
    # Summary
    print("\n" + "=" * 80)
    print("COMPREHENSIVE TEST SUMMARY")
    print("=" * 80)
    
    all_results = {
        "recipe_gate": recipe_gate_results,
        "quality_exclusions": quality_exclusions_results,
        "health": health_results,
        "search": search_results,
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
        
        # Recipe Gate specific tests
        if 'recipe_filtering_tests' in result:
            filtering_pass = len([t for t in result['recipe_filtering_tests'] if t['status'] == 'PASS'])
            filtering_total = len(result['recipe_filtering_tests'])
            print(f"  Recipe Filtering Tests: {filtering_pass}/{filtering_total} passed")
        
        if 'type_detection_tests' in result:
            detection_pass = len([t for t in result['type_detection_tests'] if t['status'] == 'PASS'])
            detection_total = len(result['type_detection_tests'])
            print(f"  Type Detection Tests: {detection_pass}/{detection_total} passed")
        
        if 'debug_surface_tests' in result:
            debug_surface_pass = len([t for t in result['debug_surface_tests'] if t['status'] == 'PASS'])
            debug_surface_total = len(result['debug_surface_tests'])
            print(f"  Debug Surface Tests: {debug_surface_pass}/{debug_surface_total} passed")
        
        if 'exclusion_stats_tests' in result:
            exclusion_pass = len([t for t in result['exclusion_stats_tests'] if t['status'] == 'PASS'])
            exclusion_total = len(result['exclusion_stats_tests'])
            print(f"  Exclusion Stats Tests: {exclusion_pass}/{exclusion_total} passed")
        
        if 'exclusion_data_tests' in result:
            exclusion_data_pass = len([t for t in result['exclusion_data_tests'] if t['status'] == 'PASS'])
            exclusion_data_total = len(result['exclusion_data_tests'])
            print(f"  Exclusion Data Tests: {exclusion_data_pass}/{exclusion_data_total} passed")
        
        # Existing test categories
        if 'endpoint_tests' in result:
            endpoint_pass = len([t for t in result['endpoint_tests'] if t['status'] == 'PASS'])
            endpoint_total = len(result['endpoint_tests'])
            print(f"  Endpoint Tests: {endpoint_pass}/{endpoint_total} passed")
        
        if 'datasource_tests' in result:
            datasource_pass = len([t for t in result['datasource_tests'] if t['status'] == 'PASS'])
            datasource_total = len(result['datasource_tests'])
            print(f"  Datasource Tests: {datasource_pass}/{datasource_total} passed")
        
        if 'search_tests' in result:
            search_pass = len([t for t in result['search_tests'] if t['status'] == 'PASS'])
            search_total = len(result['search_tests'])
            print(f"  Search Tests: {search_pass}/{search_total} passed")
        
        if 'debug_tests' in result:
            debug_pass = len([t for t in result['debug_tests'] if t['status'] == 'PASS'])
            debug_total = len(result['debug_tests'])
            print(f"  Debug Tests: {debug_pass}/{debug_total} passed")
        
        if 'error_tests' in result:
            error_pass = len([t for t in result['error_tests'] if t['status'] == 'PASS'])
            error_total = len(result['error_tests'])
            print(f"  Error Tests: {error_pass}/{error_total} passed")
        
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