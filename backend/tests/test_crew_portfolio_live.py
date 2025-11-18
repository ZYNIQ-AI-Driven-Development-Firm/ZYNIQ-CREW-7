#!/usr/bin/env python3
"""
Integration tests for Crew Portfolio, Ratings, and XP APIs
Tests against live server at http://localhost:8000
"""
import requests
import time
import sys
from typing import Optional

# Configuration
BASE_URL = "http://localhost:8000"
TEST_EMAIL = f"test_portfolio_{int(time.time())}@example.com"
TEST_PASSWORD = "TestPass123!"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def log(msg: str, color: str = Colors.GREEN) -> None:
    print(f"{color}✓ {msg}{Colors.END}")

def error(msg: str) -> None:
    print(f"{Colors.RED}✗ {msg}{Colors.END}")
    sys.exit(1)

def info(msg: str) -> None:
    print(f"{Colors.BLUE}→ {msg}{Colors.END}")

def register_and_login() -> str:
    """Register new user and return access token"""
    info("Registering test user...")
    resp = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "org_name": "Test Portfolio Org"
        }
    )
    
    if resp.status_code != 200:
        error(f"Registration failed: {resp.status_code} - {resp.text}")
    
    log(f"User registered: {TEST_EMAIL}")
    
    info("Logging in...")
    resp = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    
    if resp.status_code != 200:
        error(f"Login failed: {resp.status_code} - {resp.text}")
    
    token = resp.json().get("access")
    if not token:
        error("No access token in login response")
    
    log("Logged in successfully")
    return token

def get_first_crew_id(token: str) -> str:
    """Get ID of first available crew"""
    info("Fetching crew list...")
    resp = requests.get(
        f"{BASE_URL}/crews",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if resp.status_code != 200:
        error(f"Failed to fetch crews: {resp.status_code} - {resp.text}")
    
    crews = resp.json()
    if not crews or len(crews) == 0:
        error("No crews found in database. Run seed crews first.")
    
    crew_id = crews[0]["id"]
    crew_name = crews[0]["name"]
    log(f"Found crew: {crew_name} (ID: {crew_id})")
    return crew_id

def test_get_crew_portfolio(token: str, crew_id: str) -> None:
    """Test GET /crews/{crew_id}/portfolio"""
    info("Testing GET crew portfolio...")
    resp = requests.get(
        f"{BASE_URL}/crews/{crew_id}/portfolio",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if resp.status_code != 200:
        error(f"Failed to get portfolio: {resp.status_code} - {resp.text}")
    
    portfolio = resp.json()
    
    # Verify all expected fields present
    expected_fields = [
        "crew_id", "crew_name", "missions_completed", "hours_worked",
        "rating_avg", "rating_count", "industries", "total_earned_c7t",
        "total_rented_count", "last_mission_at", "xp", "level"
    ]
    
    for field in expected_fields:
        if field not in portfolio:
            error(f"Missing field in portfolio: {field}")
    
    log(f"Portfolio retrieved: Level {portfolio['level']}, XP {portfolio['xp']}, Rating {portfolio['rating_avg']}")
    log(f"  Missions: {portfolio['missions_completed']}, Hours: {portfolio['hours_worked']}")

def test_rate_crew(token: str, crew_id: str, rating: int, comment: str) -> dict:
    """Test POST /crews/{crew_id}/rate"""
    info(f"Testing rate crew ({rating} stars)...")
    resp = requests.post(
        f"{BASE_URL}/crews/{crew_id}/rate",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "rating": rating,
            "comment": comment
        }
    )
    
    if resp.status_code != 200:
        error(f"Failed to rate crew: {resp.status_code} - {resp.text}")
    
    result = resp.json()
    
    # Verify response fields
    if "rating_id" not in result:
        error("No rating_id in response")
    if "new_rating_avg" not in result:
        error("No new_rating_avg in response")
    if "total_ratings" not in result:
        error("No total_ratings in response")
    
    log(f"Rating submitted: ID {result['rating_id']}, New avg: {result['new_rating_avg']}, Total: {result['total_ratings']}")
    return result

def test_update_rating(token: str, crew_id: str, new_rating: int, new_comment: str) -> None:
    """Test updating existing rating (same user rates again)"""
    info(f"Testing update rating ({new_rating} stars)...")
    resp = requests.post(
        f"{BASE_URL}/crews/{crew_id}/rate",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "rating": new_rating,
            "comment": new_comment
        }
    )
    
    if resp.status_code != 200:
        error(f"Failed to update rating: {resp.status_code} - {resp.text}")
    
    result = resp.json()
    log(f"Rating updated: New avg: {result['new_rating_avg']}, Total: {result['total_ratings']}")

def test_get_crew_ratings(token: str, crew_id: str) -> None:
    """Test GET /crews/{crew_id}/ratings"""
    info("Testing GET crew ratings list...")
    resp = requests.get(
        f"{BASE_URL}/crews/{crew_id}/ratings?limit=50&offset=0",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if resp.status_code != 200:
        error(f"Failed to get ratings: {resp.status_code} - {resp.text}")
    
    ratings = resp.json()
    
    if not isinstance(ratings, list):
        error("Ratings response is not a list")
    
    if len(ratings) == 0:
        error("No ratings found (should have at least 1 from previous test)")
    
    # Verify rating structure
    rating = ratings[0]
    expected_fields = ["id", "user_id", "rating", "comment", "created_at"]
    for field in expected_fields:
        if field not in rating:
            error(f"Missing field in rating: {field}")
    
    log(f"Found {len(ratings)} ratings")
    for r in ratings[:3]:  # Show first 3
        log(f"  Rating {r['id']}: {r['rating']} stars - \"{r['comment'][:50]}...\"")

def test_rating_validation(token: str, crew_id: str) -> None:
    """Test that invalid ratings are rejected"""
    info("Testing rating validation (should reject 0 and 6 stars)...")
    
    # Test rating too low (0)
    resp = requests.post(
        f"{BASE_URL}/crews/{crew_id}/rate",
        headers={"Authorization": f"Bearer {token}"},
        json={"rating": 0, "comment": "Invalid low rating"}
    )
    
    if resp.status_code == 200:
        error("Rating 0 was accepted (should be rejected)")
    
    log("Rating 0 rejected as expected")
    
    # Test rating too high (6)
    resp = requests.post(
        f"{BASE_URL}/crews/{crew_id}/rate",
        headers={"Authorization": f"Bearer {token}"},
        json={"rating": 6, "comment": "Invalid high rating"}
    )
    
    if resp.status_code == 200:
        error("Rating 6 was accepted (should be rejected)")
    
    log("Rating 6 rejected as expected")

def test_add_crew_xp(token: str, crew_id: str, xp_amount: int) -> None:
    """Test POST /crews/{crew_id}/add-xp"""
    info(f"Testing add crew XP ({xp_amount} XP)...")
    
    # Get current XP
    resp = requests.get(
        f"{BASE_URL}/crews/{crew_id}/portfolio",
        headers={"Authorization": f"Bearer {token}"}
    )
    before_xp = resp.json()["xp"]
    before_level = resp.json()["level"]
    
    # Add XP
    resp = requests.post(
        f"{BASE_URL}/crews/{crew_id}/add-xp?xp_amount={xp_amount}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if resp.status_code != 200:
        error(f"Failed to add XP: {resp.status_code} - {resp.text}")
    
    log(f"XP added successfully")
    
    # Verify XP increased
    resp = requests.get(
        f"{BASE_URL}/crews/{crew_id}/portfolio",
        headers={"Authorization": f"Bearer {token}"}
    )
    after_xp = resp.json()["xp"]
    after_level = resp.json()["level"]
    
    if after_xp != before_xp + xp_amount:
        error(f"XP not updated correctly: expected {before_xp + xp_amount}, got {after_xp}")
    
    log(f"XP updated: {before_xp} → {after_xp} (Level: {before_level} → {after_level})")

def test_pagination(token: str, crew_id: str) -> None:
    """Test ratings pagination"""
    info("Testing ratings pagination...")
    
    # Get first page
    resp = requests.get(
        f"{BASE_URL}/crews/{crew_id}/ratings?limit=1&offset=0",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if resp.status_code != 200:
        error(f"Failed to get paginated ratings: {resp.status_code} - {resp.text}")
    
    page1 = resp.json()
    if len(page1) > 1:
        error(f"Limit=1 returned {len(page1)} results")
    
    log(f"Pagination working: limit=1 returned {len(page1)} result(s)")

def main():
    """Run all integration tests"""
    print(f"\n{Colors.BLUE}{'='*70}")
    print(f"  Crew Portfolio API Integration Tests")
    print(f"  Server: {BASE_URL}")
    print(f"{'='*70}{Colors.END}\n")
    
    try:
        # Setup
        token = register_and_login()
        crew_id = get_first_crew_id(token)
        
        print(f"\n{Colors.YELLOW}Running tests...{Colors.END}\n")
        
        # Test 1: Get portfolio
        test_get_crew_portfolio(token, crew_id)
        
        # Test 2: Rate crew
        test_rate_crew(token, crew_id, 5, "Excellent crew! Very efficient and professional.")
        
        # Test 3: Update rating
        test_update_rating(token, crew_id, 4, "Updated: Still good but found some issues.")
        
        # Test 4: Get ratings list
        test_get_crew_ratings(token, crew_id)
        
        # Test 5: Validation
        test_rating_validation(token, crew_id)
        
        # Test 6: Add XP
        test_add_crew_xp(token, crew_id, 250)
        
        # Test 7: Pagination
        test_pagination(token, crew_id)
        
        print(f"\n{Colors.GREEN}{'='*70}")
        print(f"  ✓ All tests passed!")
        print(f"{'='*70}{Colors.END}\n")
        
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Tests interrupted by user{Colors.END}\n")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}Unexpected error: {e}{Colors.END}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
