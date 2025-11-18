import requests

BASE_URL = "http://localhost:8000"

# Login
login_resp = requests.post(f"{BASE_URL}/auth/login", json={"email": "admin@crew7.ai", "password": "admin123"})
token = login_resp.json()["access"]

# Get a crew
crews_resp = requests.get(f"{BASE_URL}/crews", headers={"Authorization": f"Bearer {token}"})
crews = crews_resp.json()
if crews:
    crew_id = crews[0]["id"]
    print(f"Using crew: {crew_id}")
    
    # Manually create an agent
    print("\nCreating agent manually...")
    agent_resp = requests.post(
        f"{BASE_URL}/agents",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "crew_id": crew_id,
            "role": "orchestrator",
            "name": "Manual Orchestrator",
            "description": "Manually created orchestrator",
            "backstory": "Test backstory",
            "goal": "Test goal",
            "tools_list": "task_delegation,workflow_optimization"
        }
    )
    print(f"Status: {agent_resp.status_code}")
    print(f"Response: {agent_resp.json()}")
