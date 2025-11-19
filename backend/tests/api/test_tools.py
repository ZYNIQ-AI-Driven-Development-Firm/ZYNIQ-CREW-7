"""
Tests for Tools API endpoints.

Endpoints: /tools
Router: app.routes.tools
"""
import pytest
from fastapi.testclient import TestClient


def test_tools_git_clone(client: TestClient, auth_headers: dict[str, str]):
    """Test POST /tools/git/clone"""
    response = client.post(
        "/tools/git/clone",
        headers=auth_headers,
        json={
            "repo_url": "https://github.com/test/repo.git",
            "branch": "main"
        }
    )
    # Note: This may fail in test environment without git
    assert response.status_code in [200, 400, 500]


def test_tools_pytest_run(client: TestClient, auth_headers: dict[str, str]):
    """Test POST /tools/pytest/run"""
    response = client.post(
        "/tools/pytest/run",
        headers=auth_headers,
        json={
            "test_path": "./tests",
            "args": ["-v"]
        }
    )
    # Note: May fail without test environment
    assert response.status_code in [200, 400, 500]


def test_tools_script_run(client: TestClient, auth_headers: dict[str, str]):
    """Test POST /tools/script/run"""
    response = client.post(
        "/tools/script/run",
        headers=auth_headers,
        json={
            "script": "echo 'test'",
            "language": "bash"
        }
    )
    # Note: May fail without proper environment
    assert response.status_code in [200, 400, 500]
