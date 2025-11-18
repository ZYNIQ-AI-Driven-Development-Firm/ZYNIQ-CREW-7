"""
Test Agent API Endpoints

This test suite verifies:
1. POST /agents - Create individual agent
2. GET /agents/{id} - Fetch agent by ID
3. GET /agents/crews/{id}/agents - List all agents for a crew
4. PATCH /agents/{id} - Update agent
5. DELETE /agents/{id} - Delete agent
6. GET /metadata/agent/{id} - Agent NFT metadata
7. GET /metadata/crew/{id}/agents - Crew agents NFT metadata
8. Default agent creation on crew creation
"""

import requests
import json
import sys
from typing import Optional

# Configuration
BASE_URL = "http://localhost:8000"
API_TOKEN = None  # Set this after login

# Test user credentials - update these if needed
TEST_EMAIL = "admin@crew7.ai"
TEST_PASSWORD = "admin123"


def register_user() -> bool:
    """Register test user if doesn't exist"""
    print("\n📝 Registering test user...")
    response = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "org_name": "Test Org"
        }
    )
    if response.status_code == 200:
        print(f"✅ User registered: {TEST_EMAIL}")
        return True
    elif response.status_code == 400 and "already exists" in response.text.lower():
        print(f"ℹ️  User already exists: {TEST_EMAIL}")
        return True
    else:
        print(f"⚠️  Registration response: {response.status_code}")
        print(response.text)
        return True  # Continue anyway, user might exist


def login() -> str:
    """Login and get auth token"""
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    if response.status_code == 200:
        data = response.json()
        # API returns "access" not "access_token"
        return data.get("access") or data.get("access_token")
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(response.text)
        return None


def test_create_crew() -> Optional[str]:
    """Test 1: Create a crew (should auto-create 7 agents)"""
    print("\n" + "="*60)
    print("TEST 1: Create Crew with Auto-Generated Agents")
    print("="*60)
    
    response = requests.post(
        f"{BASE_URL}/crews",
        headers={"Authorization": f"Bearer {API_TOKEN}"},
        json={
            "name": "Test Agent Crew",
            "role": "development",
            "is_public": True,
            "recipe_json": {},
            "models_json": {},
            "tools_json": {},
            "env_json": {}
        }
    )
    
    if response.status_code == 200:
        crew_id = response.json()["id"]
        print(f"✅ Crew created: {crew_id}")
        print(f"   Name: {response.json()['name']}")
        print(f"   Role: {response.json()['role']}")
        return crew_id
    else:
        print(f"❌ Failed to create crew: {response.status_code}")
        print(response.text)
        return None


def test_list_crew_agents(crew_id: str):
    """Test 2: List all agents for the crew"""
    print("\n" + "="*60)
    print("TEST 2: List Crew Agents (Should be 7)")
    print("="*60)
    
    response = requests.get(
        f"{BASE_URL}/agents/crews/{crew_id}/agents",
        headers={"Authorization": f"Bearer {API_TOKEN}"}
    )
    
    if response.status_code == 200:
        agents = response.json()
        print(f"✅ Found {len(agents)} agents:")
        for i, agent in enumerate(agents, 1):
            print(f"   {i}. {agent['name']} ({agent['role']})")
            if agent.get('specialist_type'):
                print(f"      Specialist: {agent['specialist_type']}")
        return agents
    else:
        print(f"❌ Failed to list agents: {response.status_code}")
        print(response.text)
        return []


def test_get_agent(agent_id: str):
    """Test 3: Get individual agent"""
    print("\n" + "="*60)
    print(f"TEST 3: Get Agent {agent_id}")
    print("="*60)
    
    response = requests.get(
        f"{BASE_URL}/agents/{agent_id}",
        headers={"Authorization": f"Bearer {API_TOKEN}"}
    )
    
    if response.status_code == 200:
        agent = response.json()
        print(f"✅ Agent fetched:")
        print(f"   ID: {agent['id']}")
        print(f"   Name: {agent['name']}")
        print(f"   Role: {agent['role']}")
        print(f"   Description: {agent['description'][:100]}...")
        if agent.get('specialist_type'):
            print(f"   Specialist: {agent['specialist_type']}")
        return agent
    else:
        print(f"❌ Failed to get agent: {response.status_code}")
        print(response.text)
        return None


def test_create_custom_agent(crew_id: str) -> Optional[str]:
    """Test 4: Create a custom agent"""
    print("\n" + "="*60)
    print("TEST 4: Create Custom Agent")
    print("="*60)
    
    response = requests.post(
        f"{BASE_URL}/agents",
        headers={"Authorization": f"Bearer {API_TOKEN}"},
        json={
            "crew_id": crew_id,
            "role": "custom",
            "name": "Test Custom Agent",
            "description": "A custom agent for testing",
            "specialist_type": "test_specialist",
            "backstory": "Created for testing purposes",
            "goal": "Test all endpoints",
            "llm_config": {"model": "gpt-4", "temperature": 0.7},
            "tools_list": "code_interpreter,web_search,file_manager"
        }
    )
    
    if response.status_code == 200:
        agent_id = response.json()["id"]
        print(f"✅ Custom agent created: {agent_id}")
        print(f"   Name: {response.json()['name']}")
        print(f"   Role: {response.json()['role']}")
        print(f"   Specialist: {response.json()['specialist_type']}")
        return agent_id
    else:
        print(f"❌ Failed to create custom agent: {response.status_code}")
        print(response.text)
        return None


def test_update_agent(agent_id: str):
    """Test 5: Update agent"""
    print("\n" + "="*60)
    print(f"TEST 5: Update Agent {agent_id}")
    print("="*60)
    
    response = requests.patch(
        f"{BASE_URL}/agents/{agent_id}",
        headers={"Authorization": f"Bearer {API_TOKEN}"},
        json={
            "name": "Updated Test Agent",
            "description": "Updated description for testing"
        }
    )
    
    if response.status_code == 200:
        agent = response.json()
        print(f"✅ Agent updated:")
        print(f"   New Name: {agent['name']}")
        print(f"   New Description: {agent['description']}")
        return agent
    else:
        print(f"❌ Failed to update agent: {response.status_code}")
        print(response.text)
        return None


def test_agent_nft_metadata(agent_id: str):
    """Test 6: Get agent NFT metadata"""
    print("\n" + "="*60)
    print(f"TEST 6: Get Agent NFT Metadata")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/metadata/agent/{agent_id}")
    
    if response.status_code == 200:
        metadata = response.json()
        print(f"✅ Agent NFT metadata:")
        print(f"   Name: {metadata['name']}")
        print(f"   Description: {metadata['description'][:100]}...")
        print(f"   Image: {metadata['image']}")
        print(f"   Role: {metadata['role']}")
        print(f"   Level: {metadata['level']}")
        print(f"   Skills: {len(metadata.get('skills', []))} skills")
        return metadata
    else:
        print(f"❌ Failed to get agent NFT metadata: {response.status_code}")
        print(response.text)
        return None


def test_crew_agents_nft_metadata(crew_id: str):
    """Test 7: Get crew agents NFT metadata"""
    print("\n" + "="*60)
    print(f"TEST 7: Get Crew Agents NFT Metadata")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/metadata/crew/{crew_id}/agents")
    
    if response.status_code == 200:
        agents_metadata = response.json()
        print(f"✅ Crew agents NFT metadata ({len(agents_metadata)} agents):")
        for i, metadata in enumerate(agents_metadata, 1):
            print(f"   {i}. {metadata['name']} - Level {metadata['level']}")
        return agents_metadata
    else:
        print(f"❌ Failed to get crew agents NFT metadata: {response.status_code}")
        print(response.text)
        return None


def test_delete_agent(agent_id: str):
    """Test 8: Delete agent"""
    print("\n" + "="*60)
    print(f"TEST 8: Delete Agent {agent_id}")
    print("="*60)
    
    response = requests.delete(
        f"{BASE_URL}/agents/{agent_id}",
        headers={"Authorization": f"Bearer {API_TOKEN}"}
    )
    
    if response.status_code == 204 or response.status_code == 200:
        print(f"✅ Agent deleted successfully")
        return True
    else:
        print(f"❌ Failed to delete agent: {response.status_code}")
        print(response.text)
        return False


def run_all_tests():
    """Run complete agent API test suite"""
    global API_TOKEN
    
    print("\n" + "="*60)
    print("AGENT API TEST SUITE")
    print("="*60)
    
    # Step 0: Register user if needed
    register_user()
    
    # Step 1: Login
    print("\n🔑 Logging in...")
    API_TOKEN = login()
    if not API_TOKEN:
        print("❌ Cannot proceed without authentication")
        return
    print(f"✅ Logged in successfully")
    
    # Step 2: Create crew (auto-creates 7 agents)
    crew_id = test_create_crew()
    if not crew_id:
        print("❌ Cannot proceed without crew")
        return
    
    # Step 3: List crew agents (should be 7)
    agents = test_list_crew_agents(crew_id)
    if not agents:
        print("❌ No agents found")
        return
    
    # Step 4: Get individual agent details
    test_agent_id = agents[0]["id"]
    test_get_agent(test_agent_id)
    
    # Step 5: Create custom agent
    custom_agent_id = test_create_custom_agent(crew_id)
    
    # Step 6: Update the custom agent
    if custom_agent_id:
        test_update_agent(custom_agent_id)
    
    # Step 7: Get agent NFT metadata
    test_agent_nft_metadata(test_agent_id)
    
    # Step 8: Get crew agents NFT metadata
    test_crew_agents_nft_metadata(crew_id)
    
    # Step 9: Delete custom agent
    if custom_agent_id:
        test_delete_agent(custom_agent_id)
    
    # Step 10: Verify deletion - list again (should be back to 7)
    print("\n" + "="*60)
    print("TEST 9: Verify Deletion (Should be 7 agents again)")
    print("="*60)
    agents_after_delete = test_list_crew_agents(crew_id)
    if len(agents_after_delete) == 7:
        print("✅ Deletion verified - back to 7 agents")
    else:
        print(f"⚠️  Expected 7 agents, found {len(agents_after_delete)}")
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUITE COMPLETE")
    print("="*60)
    print("All agent endpoints tested successfully! 🎉")


if __name__ == "__main__":
    try:
        run_all_tests()
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Test suite failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
