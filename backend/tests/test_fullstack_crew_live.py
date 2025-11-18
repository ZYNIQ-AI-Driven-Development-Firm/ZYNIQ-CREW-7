#!/usr/bin/env python3
"""
Quick test for Full-Stack SaaS Crew endpoint
Tests the new /crews/fullstack/run endpoint
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_fullstack_crew():
    print("🚀 Testing Full-Stack SaaS Crew Endpoint\n")
    
    # Step 1: Register/Login
    print("1️⃣ Logging in...")
    email = "admin@crew7.ai"
    password = "Admin@123"
    
    resp = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": email, "password": password}
    )
    
    if resp.status_code != 200:
        print(f"❌ Login failed: {resp.status_code}")
        print(resp.text)
        return
    
    token = resp.json()["access"]
    print(f"✅ Logged in successfully")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Step 2: Test Full-Stack crew endpoint
    print("\n2️⃣ Starting Full-Stack SaaS Crew mission...")
    mission = "Build a simple todo app with user authentication, CRUD operations, and a clean React UI"
    
    resp = requests.post(
        f"{BASE_URL}/crews/fullstack/run",
        headers=headers,
        json={
            "prompt": mission,
            "inputs": {}
        }
    )
    
    if resp.status_code != 200:
        print(f"❌ Failed to start crew: {resp.status_code}")
        print(resp.text)
        return
    
    run_data = resp.json()
    run_id = run_data["id"]
    crew_id = run_data["crew_id"]
    
    print(f"✅ Crew mission started!")
    print(f"   Run ID: {run_id}")
    print(f"   Crew ID: {crew_id}")
    print(f"   Status: {run_data['status']}")
    
    # Step 3: Stream the results
    print("\n3️⃣ Streaming results...")
    print("=" * 60)
    
    try:
        with requests.get(
            f"{BASE_URL}/runs/{run_id}/stream",
            headers=headers,
            stream=True
        ) as resp:
            for line in resp.iter_lines():
                if line:
                    line_str = line.decode('utf-8')
                    if line_str.startswith('data: '):
                        try:
                            data = json.loads(line_str[6:])
                            event_type = data.get('type', 'unknown')
                            
                            if event_type == 'token':
                                print(data.get('data', ''), end='', flush=True)
                            elif event_type == 'message':
                                print(f"\n\n📝 {data.get('data', '')}")
                            elif event_type == 'status':
                                print(f"\n\n🔄 Status: {data.get('data', '')}")
                            elif event_type == 'done':
                                print("\n\n✅ Mission complete!")
                                break
                            elif event_type == 'error':
                                print(f"\n\n❌ Error: {data.get('data', '')}")
                                break
                        except json.JSONDecodeError:
                            pass
    except KeyboardInterrupt:
        print("\n\n⏹️  Stream interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Stream error: {e}")
    
    print("\n" + "=" * 60)
    
    # Step 4: Check final status
    print("\n4️⃣ Checking final status...")
    resp = requests.get(
        f"{BASE_URL}/runs/{run_id}",
        headers=headers
    )
    
    if resp.status_code == 200:
        final_run = resp.json()
        print(f"   Status: {final_run['status']}")
        if final_run.get('output_text'):
            print(f"   Output length: {len(final_run['output_text'])} chars")
    
    print("\n✨ Test complete!\n")

if __name__ == "__main__":
    print("=" * 60)
    print(" Full-Stack SaaS Crew - Integration Test")
    print("=" * 60)
    print()
    
    # Check if server is running
    try:
        resp = requests.get(f"{BASE_URL}/live", timeout=2)
        if resp.status_code == 200:
            print("✅ Backend server is running\n")
            test_fullstack_crew()
        else:
            print(f"❌ Backend server returned unexpected status: {resp.status_code}\n")
    except requests.exceptions.ConnectionError:
        print("❌ Backend server is not running!")
        print("   Start it with: cd backend && python -m uvicorn app.main:app --reload\n")
    except Exception as e:
        print(f"❌ Error checking server: {e}\n")
