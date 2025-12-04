"""
Test suite for Task 2: Advanced Task Search & Filtering

Tests fuzzy search, autocomplete, multi-filter combinations, URL persistence,
and search history functionality.
"""

import pytest
import requests
import json
import time
from typing import Dict, List

BASE_URL = "http://localhost:5001/api"

class TestTaskSearch:
    """Test class for advanced task search and filtering"""
    
    @pytest.fixture(scope="class")
    def test_workspace(self):
        """Create a test workspace with tasks for searching"""
        user_data = {
            "name": "Search Tester",
            "email": f"searcher_{int(time.time())}@test.com",
            "password": "Search123!@#"
        }
        requests.post(f"{BASE_URL}/auth/register", json=user_data)
        login = requests.post(f"{BASE_URL}/auth/login", 
                            json={"email": user_data["email"], "password": user_data["password"]})
        token = login.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        workspace = requests.post(f"{BASE_URL}/workspaces", 
                                json={"name": "Search Test Workspace"}, headers=headers)
        workspace_id = workspace.json()["_id"]
        
        tasks = [
            {"title": "Implement user authentication", "priority": "high", "status": "in-progress"},
            {"title": "Fix database connection bug", "priority": "critical", "status": "todo"},
            {"title": "Update documentation", "priority": "low", "status": "completed"},
            {"title": "Refactor authentication module", "priority": "medium", "status": "in-progress"},
            {"title": "Add unit tests for API", "priority": "high", "status": "todo"},
            {"title": "Optimize database queries", "priority": "medium", "status": "in-review"},
        ]
        
        created_tasks = []
        for task_data in tasks:
            task_data["workspace"] = workspace_id
            response = requests.post(f"{BASE_URL}/tasks", json=task_data, headers=headers)
            created_tasks.append(response.json())
        
        return {"token": token, "workspace_id": workspace_id, "tasks": created_tasks, "headers": headers}

    def test_fuzzy_search_endpoint_exists(self, test_workspace):
        """
        Validates that the search endpoint exists and accepts query parameters.
        Expected: 200 status with search results
        """
        response = requests.get(
            f"{BASE_URL}/tasks/search",
            params={"q": "auth"},
            headers=test_workspace["headers"]
        )
        assert response.status_code == 200, "Search endpoint should exist"
        assert "results" in response.json() or isinstance(response.json(), list), "Should return search results"

    def test_fuzzy_matching_works(self, test_workspace):
        """
        Tests fuzzy search - typing 'auth' should find 'authentication'.
        Expected: Tasks with similar text are returned even with partial match
        """
        response = requests.get(
            f"{BASE_URL}/tasks/search",
            params={"q": "authen"},
            headers=test_workspace["headers"]
        )
        results = response.json().get("results", response.json())
        
        titles = [task["title"].lower() for task in results]
        assert any("authentication" in title for title in titles), \
            "Fuzzy search should match 'authen' to 'authentication'"

    def test_multiple_filters_combined(self, test_workspace):
        """
        Tests combining multiple filters (status + priority).
        Expected: Only tasks matching ALL filter criteria are returned (AND logic)
        """
        response = requests.get(
            f"{BASE_URL}/tasks/search",
            params={
                "status": "in-progress",
                "priority": "high"
            },
            headers=test_workspace["headers"]
        )
        results = response.json().get("results", response.json())
        
        for task in results:
            assert task["status"] == "in-progress", "Should only return in-progress tasks"
            assert task["priority"] == "high", "Should only return high priority tasks"
        
        assert len(results) > 0, "Should find at least one task matching both filters"

    def test_search_with_priority_filter(self, test_workspace):
        """
        Tests filtering by priority level.
        Expected: Only high priority tasks are returned
        """
        response = requests.get(
            f"{BASE_URL}/tasks/search",
            params={"priority": "high"},
            headers=test_workspace["headers"]
        )
        results = response.json().get("results", response.json())
        
        for task in results:
            assert task["priority"] == "high", "All results should be high priority"

    def test_search_with_status_filter(self, test_workspace):
        """
        Tests filtering by task status.
        Expected: Only completed tasks are returned
        """
        response = requests.get(
            f"{BASE_URL}/tasks/search",
            params={"status": "completed"},
            headers=test_workspace["headers"]
        )
        results = response.json().get("results", response.json())
        
        for task in results:
            assert task["status"] == "completed", "All results should be completed"

    def test_autocomplete_suggestions(self, test_workspace):
        """
        Tests autocomplete/suggestions for search queries.
        Expected: Endpoint returns relevant suggestions based on partial input
        """
        response = requests.get(
            f"{BASE_URL}/tasks/autocomplete",
            params={"q": "data"},
            headers=test_workspace["headers"]
        )
        
        assert response.status_code == 200, "Autocomplete endpoint should exist"
        suggestions = response.json().get("suggestions", response.json())
        assert isinstance(suggestions, list), "Should return array of suggestions"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
