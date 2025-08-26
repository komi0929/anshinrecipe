#!/usr/bin/env python3
"""
Test Error Handling for CSE failures in Anshin Recipe Search
"""

import requests
import json
import os
import subprocess
import time

# Configuration
BACKEND_URL = "https://anshin-recipe-admin.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def test_cse_error_handling():
    """Test CSE error handling when credentials are missing"""
    print("=" * 80)
    print("TESTING CSE ERROR HANDLING")
    print("=" * 80)
    
    # First, temporarily remove CSE credentials
    print("\n1. Temporarily removing CSE credentials")
    print("-" * 60)
    
    original_content = ""
    
    try:
        # Backup original content
        with open('/app/backend/.env', 'r') as f:
            original_content = f.read()
        
        # Remove CSE credentials by commenting them out
        updated_content = original_content.replace(
            'GOOGLE_CSE_KEY=AIzaSyC7SllJjdKmcEUYXABRPhdUjWW-uOWkx2Q',
            '#GOOGLE_CSE_KEY=AIzaSyC7SllJjdKmcEUYXABRPhdUjWW-uOWkx2Q'
        ).replace(
            'GOOGLE_CSE_CX=76346e000bb674e01',
            '#GOOGLE_CSE_CX=76346e000bb674e01'
        )
        
        with open('/app/backend/.env', 'w') as f:
            f.write(updated_content)
        
        print("✅ Removed CSE credentials")
        
        # Restart backend to pick up new environment
        print("🔄 Restarting backend service...")
        subprocess.run(['sudo', 'supervisorctl', 'restart', 'backend'], check=True)
        time.sleep(5)  # Wait for service to restart
        
        # Test health endpoint to verify fallback to mock
        print("\n2. Testing Health Endpoint without CSE credentials")
        print("-" * 60)
        
        response = requests.get(f"{API_BASE}/v1/health", timeout=30)
        if response.status_code == 200:
            data = response.json()
            datasource = data.get("datasource", "")
            env_flags = data.get("envFlags", {})
            mock_mode = env_flags.get("MOCK_MODE", "")
            cse_key_present = env_flags.get("CSE_KEY_PRESENT", False)
            cse_cx_present = env_flags.get("CSE_CX_PRESENT", False)
            
            print(f"   Datasource: {datasource}")
            print(f"   MOCK_MODE: {mock_mode}")
            print(f"   CSE_KEY_PRESENT: {cse_key_present}")
            print(f"   CSE_CX_PRESENT: {cse_cx_present}")
            
            if datasource == "mock" and not cse_key_present and not cse_cx_present:
                print("✅ Health endpoint correctly shows fallback to mock when CSE credentials missing")
            else:
                print(f"❌ Expected fallback to mock, got datasource={datasource}")
        
        # Test search endpoint error handling
        print("\n3. Testing Search Endpoint Error Handling")
        print("-" * 60)
        
        test_query = "卵 乳 不使用 ケーキ"
        response = requests.get(f"{API_BASE}/v1/search?q={test_query}", timeout=30)
        
        if response.status_code == 502:
            print("✅ Search endpoint correctly returns 502 for CSE failure")
            
            try:
                error_data = response.json()
                print(f"   Error response: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
                
                # Check error structure (FastAPI wraps in 'detail')
                detail = error_data.get("detail", {})
                
                if "error" in detail and detail["error"] == "cse_failed":
                    print("✅ Error response has correct 'error' field")
                else:
                    print(f"❌ Expected error='cse_failed', got {detail.get('error')}")
                
                if "reason" in detail:
                    print("✅ Error response has 'reason' field")
                    print(f"   Reason: {detail['reason']}")
                else:
                    print("❌ Error response missing 'reason' field")
                
                if "requestEcho" in detail:
                    print("✅ Error response has 'requestEcho' field")
                    request_echo = detail["requestEcho"]
                    if "q" in request_echo and request_echo["q"] == test_query:
                        print("✅ RequestEcho contains original query")
                    else:
                        print("❌ RequestEcho missing or incorrect query")
                else:
                    print("❌ Error response missing 'requestEcho' field")
                
            except json.JSONDecodeError:
                print("❌ Error response is not valid JSON")
                
        elif response.status_code == 200:
            print("⚠️  Search endpoint returned 200 - may have fallen back to mock data")
            try:
                data = response.json()
                debug_info = data.get("debug", {}) if "debug" in data else {}
                print(f"   Response datasource: {debug_info.get('datasource', 'N/A')}")
            except:
                pass
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
            print(f"   Response: {response.text}")
        
    except Exception as e:
        print(f"❌ CSE error handling test failed: {e}")
    
    finally:
        # Restore original credentials
        print("\n4. Restoring CSE credentials")
        print("-" * 60)
        
        try:
            with open('/app/backend/.env', 'w') as f:
                f.write(original_content)
            
            print("✅ Restored CSE credentials")
            
            # Restart backend again
            print("🔄 Restarting backend service...")
            subprocess.run(['sudo', 'supervisorctl', 'restart', 'backend'], check=True)
            time.sleep(5)  # Wait for service to restart
            
            # Verify restoration
            response = requests.get(f"{API_BASE}/v1/health", timeout=30)
            if response.status_code == 200:
                data = response.json()
                datasource = data.get("datasource", "")
                if datasource == "cse":
                    print("✅ Successfully restored to production mode (CSE)")
                else:
                    print(f"⚠️  Datasource after restoration: {datasource}")
            
        except Exception as e:
            print(f"❌ Failed to restore CSE credentials: {e}")

if __name__ == "__main__":
    test_cse_error_handling()