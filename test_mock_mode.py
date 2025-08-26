#!/usr/bin/env python3
"""
Test Mock Mode functionality for Anshin Recipe Search
"""

import requests
import json
import os
import subprocess
import time

# Configuration
BACKEND_URL = "https://anshin-recipe-admin.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def test_mock_mode():
    """Test search endpoint in mock mode"""
    print("=" * 80)
    print("TESTING SEARCH API ENDPOINT - MOCK MODE")
    print("=" * 80)
    
    # First, temporarily change MOCK_MODE to 1
    print("\n1. Temporarily setting MOCK_MODE=1")
    print("-" * 60)
    
    try:
        # Update the environment file
        with open('/app/backend/.env', 'r') as f:
            content = f.read()
        
        # Replace MOCK_MODE=0 with MOCK_MODE=1
        updated_content = content.replace('MOCK_MODE=0', 'MOCK_MODE=1')
        
        with open('/app/backend/.env', 'w') as f:
            f.write(updated_content)
        
        print("✅ Updated MOCK_MODE to 1")
        
        # Restart backend to pick up new environment
        print("🔄 Restarting backend service...")
        subprocess.run(['sudo', 'supervisorctl', 'restart', 'backend'], check=True)
        time.sleep(5)  # Wait for service to restart
        
        # Test health endpoint to verify mock mode
        print("\n2. Testing Health Endpoint in Mock Mode")
        print("-" * 60)
        
        response = requests.get(f"{API_BASE}/v1/health", timeout=30)
        if response.status_code == 200:
            data = response.json()
            datasource = data.get("datasource", "")
            env_flags = data.get("envFlags", {})
            mock_mode = env_flags.get("MOCK_MODE", "")
            
            print(f"   Datasource: {datasource}")
            print(f"   MOCK_MODE: {mock_mode}")
            
            if datasource == "mock" and mock_mode == "1":
                print("✅ Health endpoint correctly shows mock mode")
            else:
                print(f"❌ Expected mock mode, got datasource={datasource}, MOCK_MODE={mock_mode}")
        
        # Test search endpoint in mock mode
        print("\n3. Testing Search Endpoint in Mock Mode")
        print("-" * 60)
        
        test_query = "卵 乳 不使用 ケーキ"
        response = requests.get(f"{API_BASE}/v1/search?q={test_query}&debug=1", timeout=30)
        
        if response.status_code == 200:
            print("✅ Search endpoint accessible in mock mode (200)")
            
            data = response.json()
            results = data.get("results", [])
            debug_info = data.get("debug", {})
            
            print(f"   Results count: {len(results)}")
            print(f"   Debug datasource: {debug_info.get('datasource', 'N/A')}")
            print(f"   Debug parseSource: {debug_info.get('parseSource', 'N/A')}")
            print(f"   Debug mockMode: {debug_info.get('mockMode', 'N/A')}")
            print(f"   Debug fallbackReason: {debug_info.get('fallbackReason', 'N/A')}")
            
            if debug_info.get("datasource") == "mock":
                print("✅ Debug correctly shows datasource as 'mock'")
            else:
                print(f"❌ Expected datasource 'mock', got '{debug_info.get('datasource')}'")
            
            # Check if results are mock data
            if len(results) > 0:
                first_result = results[0]
                title = first_result.get("title", "")
                source = first_result.get("source", "")
                
                print(f"\n📋 Sample Mock Result:")
                print(f"   Title: {title}")
                print(f"   Source: {source}")
                print(f"   URL: {first_result.get('url', 'N/A')}")
                
                # Check for mock data patterns
                mock_patterns = ["卵・乳不使用", "グルテンフリー", "卵なし"]
                is_mock_data = any(pattern in title for pattern in mock_patterns)
                
                if is_mock_data:
                    print("✅ Results appear to be mock data")
                else:
                    print("⚠️  Results may not be mock data")
        else:
            print(f"❌ Search endpoint failed in mock mode: {response.status_code}")
        
    except Exception as e:
        print(f"❌ Mock mode test failed: {e}")
    
    finally:
        # Restore original MOCK_MODE=0
        print("\n4. Restoring MOCK_MODE=0")
        print("-" * 60)
        
        try:
            with open('/app/backend/.env', 'r') as f:
                content = f.read()
            
            # Replace MOCK_MODE=1 back to MOCK_MODE=0
            restored_content = content.replace('MOCK_MODE=1', 'MOCK_MODE=0')
            
            with open('/app/backend/.env', 'w') as f:
                f.write(restored_content)
            
            print("✅ Restored MOCK_MODE to 0")
            
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
            print(f"❌ Failed to restore MOCK_MODE: {e}")

if __name__ == "__main__":
    test_mock_mode()