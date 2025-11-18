"""
Web3 Metadata API Test Examples

Demonstrates how to use the metadata endpoints for NFT integration.
"""

import requests
from typing import Optional


class MetadataAPIClient:
    """Simple client for testing metadata endpoints"""
    
    def __init__(self, base_url: str = "http://localhost:8080"):
        self.base_url = base_url
        self.session = requests.Session()
    
    def set_auth_token(self, token: str):
        """Set bearer token for authenticated requests"""
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def get_crew_metadata(self, crew_id: str) -> dict:
        """
        Get NFT metadata for a crew
        
        Example:
            >>> client = MetadataAPIClient()
            >>> metadata = client.get_crew_metadata("abc-123-def-456")
            >>> print(metadata["name"])
            "Crew-7 // Elite DevOps Squadron"
        """
        response = self.session.get(f"{self.base_url}/metadata/crew/{crew_id}")
        response.raise_for_status()
        return response.json()
    
    def get_agent_metadata(self, agent_id: str) -> dict:
        """
        Get NFT metadata for an agent
        
        Example:
            >>> client = MetadataAPIClient()
            >>> metadata = client.get_agent_metadata("abc-123-orchestrator")
            >>> print(metadata["role"])
            "orchestrator"
        """
        response = self.session.get(f"{self.base_url}/metadata/agent/{agent_id}")
        response.raise_for_status()
        return response.json()
    
    def get_crew_agents(self, crew_id: str) -> list[dict]:
        """
        Get NFT metadata for all agents in a crew
        
        Returns 7 agents (1 orchestrator + 6 specialists)
        
        Example:
            >>> client = MetadataAPIClient()
            >>> agents = client.get_crew_agents("abc-123-def-456")
            >>> print(len(agents))
            7
        """
        response = self.session.get(f"{self.base_url}/metadata/crew/{crew_id}/agents")
        response.raise_for_status()
        return response.json()


def example_crew_metadata():
    """Example: Fetch and display crew metadata"""
    client = MetadataAPIClient()
    
    # Replace with actual crew_id from your database
    crew_id = "550e8400-e29b-41d4-a716-446655440000"
    
    try:
        metadata = client.get_crew_metadata(crew_id)
        
        print("=== Crew NFT Metadata ===")
        print(f"Name: {metadata['name']}")
        print(f"Description: {metadata['description']}")
        print(f"Level: {metadata['level']}")
        print(f"XP: {metadata['xp']} / {metadata['xp_required_for_next_level']}")
        print(f"Success Rate: {metadata['success_rate']}%")
        print(f"Rarity: {metadata['rarity_tier']}")
        print(f"Missions: {metadata['missions_completed']}")
        print(f"\nImage URL: {metadata['image']}")
        print(f"External URL: {metadata['external_url']}")
        print(f"\nAttributes:")
        for attr in metadata['attributes']:
            print(f"  - {attr['trait_type']}: {attr['value']}")
    
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            print("Crew not found")
        elif e.response.status_code == 403:
            print("Access denied - crew is private")
        else:
            print(f"Error: {e}")


def example_agent_metadata():
    """Example: Fetch and display agent metadata"""
    client = MetadataAPIClient()
    
    # Agent ID format: {crew_id}-{role}
    crew_id = "550e8400-e29b-41d4-a716-446655440000"
    agent_id = f"{crew_id}-orchestrator"
    
    try:
        metadata = client.get_agent_metadata(agent_id)
        
        print("=== Agent NFT Metadata ===")
        print(f"Name: {metadata['name']}")
        print(f"Role: {metadata['role']}")
        print(f"Level: {metadata['level']}")
        print(f"XP: {metadata['xp']}")
        print(f"Success Rate: {metadata['success_rate']}%")
        print(f"Rarity: {metadata['rarity_tier']}")
        print(f"Missions Contributed: {metadata['missions_contributed']}")
        print(f"\nImage URL: {metadata['image']}")
        print(f"Linked Crews: {metadata['linked_crew_ids']}")
    
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            print("Agent not found")
        elif e.response.status_code == 403:
            print("Access denied")
        else:
            print(f"Error: {e}")


def example_crew_agents():
    """Example: Fetch all agents in a crew"""
    client = MetadataAPIClient()
    
    crew_id = "550e8400-e29b-41d4-a716-446655440000"
    
    try:
        agents = client.get_crew_agents(crew_id)
        
        print(f"=== Crew Agents ({len(agents)} total) ===\n")
        
        for agent in agents:
            print(f"{agent['name']}")
            print(f"  Role: {agent['role']}")
            print(f"  Level: {agent['level']}")
            print(f"  Rarity: {agent['rarity_tier']}")
            print()
    
    except requests.exceptions.HTTPError as e:
        print(f"Error: {e}")


def example_opensea_format():
    """Example: Verify OpenSea compatibility"""
    client = MetadataAPIClient()
    crew_id = "550e8400-e29b-41d4-a716-446655440000"
    
    try:
        metadata = client.get_crew_metadata(crew_id)
        
        # Check required OpenSea fields
        required_fields = ["name", "description", "image", "external_url", "attributes"]
        
        print("=== OpenSea Compatibility Check ===")
        for field in required_fields:
            if field in metadata:
                print(f"✓ {field}: Present")
            else:
                print(f"✗ {field}: Missing")
        
        # Check attributes format
        print("\n=== Attributes Format ===")
        for attr in metadata.get("attributes", []):
            has_trait = "trait_type" in attr
            has_value = "value" in attr
            
            if has_trait and has_value:
                print(f"✓ {attr['trait_type']}: {attr['value']}")
            else:
                print(f"✗ Invalid attribute: {attr}")
    
    except requests.exceptions.HTTPError as e:
        print(f"Error: {e}")


def example_with_auth():
    """Example: Access private crew metadata with authentication"""
    client = MetadataAPIClient()
    
    # Set auth token (get from /auth/login endpoint)
    token = "your_jwt_token_here"
    client.set_auth_token(token)
    
    crew_id = "550e8400-e29b-41d4-a716-446655440000"
    
    try:
        metadata = client.get_crew_metadata(crew_id)
        print(f"Successfully accessed: {metadata['name']}")
    except requests.exceptions.HTTPError as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    print("Web3 Metadata API Examples\n")
    print("=" * 50)
    
    # Run examples
    print("\n1. Crew Metadata Example:")
    print("-" * 50)
    example_crew_metadata()
    
    print("\n2. Agent Metadata Example:")
    print("-" * 50)
    example_agent_metadata()
    
    print("\n3. All Crew Agents Example:")
    print("-" * 50)
    example_crew_agents()
    
    print("\n4. OpenSea Compatibility Check:")
    print("-" * 50)
    example_opensea_format()
    
    print("\n" + "=" * 50)
    print("\nAPI Endpoints:")
    print("  GET /metadata/crew/{crew_id}")
    print("  GET /metadata/agent/{agent_id}")
    print("  GET /metadata/crew/{crew_id}/agents")
    print("\nDocumentation:")
    print("  http://localhost:8080/docs")
