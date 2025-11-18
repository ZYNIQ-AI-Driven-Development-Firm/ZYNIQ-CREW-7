import requests
import json

BASE_URL = "http://localhost:8000"

# Login
print("Logging in...")
login_resp = requests.post(f"{BASE_URL}/auth/login", json={"email": "admin@crew7.ai", "password": "admin123"})
token = login_resp.json()["access"]
print(f"Token: {token[:50]}...")

# Create crew
print("\nCreating crew...")
crew_resp = requests.post(
    f"{BASE_URL}/crews",
    headers={"Authorization": f"Bearer {token}"},
    json={
        "name": "Test Crew Simple",
        "role": "development",
        "is_public": True,
        "recipe_json": {},
        "models_json": {},
        "tools_json": {},
        "env_json": {}
    }
)
print(f"Status: {crew_resp.status_code}")
if crew_resp.status_code == 200:
    crew = crew_resp.json()
    crew_id = crew["id"]
    print(f"Crew ID: {crew_id}")
    
    # List agents
    print("\nListing agents...")
    agents_resp = requests.get(
        f"{BASE_URL}/agents/crews/{crew_id}/agents",
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"Status: {agents_resp.status_code}")
    if agents_resp.status_code == 200:
        agents = agents_resp.json()
        print(f"Found {len(agents)} agents:")
        for agent in agents:
            print(f"  - {agent['name']} ({agent['role']})")
    else:
        print(f"Error: {agents_resp.text}")
else:
    print(f"Error: {crew_resp.text}")
