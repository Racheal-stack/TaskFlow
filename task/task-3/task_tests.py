"""
Test suite for Task 3: Fix Task Dependency Chain Bug

Tests circular dependency detection, dependency validation, and blocking logic.
"""

import pytest
import requests
import json
import time

BASE_URL = "http://localhost:5001/api"

class TestTaskDependencies:
    """Test class for task dependency functionality"""
    
    @pytest.fixture(scope="class")
    def test_setup(self):
        """Create workspace and tasks for dependency testing"""
        user_data = {
            "name": "Dependency Tester",
            "email": f"deptest_{int(time.time())}@test.com",
            "password": "Dep123!@#",
            "workspaceName": "Dependency Test Workspace"
        }
        requests.post(f"{BASE_URL}/auth/register", json=user_data)
        login = requests.post(f"{BASE_URL}/auth/login", 
                            json={"email": user_data["email"], "password": user_data["password"]})
        token = login.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get workspace from user profile
        profile = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        current_workspace = profile.json()["user"]["currentWorkspace"]
        workspace_id = str(current_workspace["_id"] if isinstance(current_workspace, dict) else current_workspace)
        
        # Create test tasks
        task1 = requests.post(f"{BASE_URL}/tasks", 
                            json={"title": "Task A", "workspace": workspace_id}, headers=headers)
        task2 = requests.post(f"{BASE_URL}/tasks", 
                            json={"title": "Task B", "workspace": workspace_id}, headers=headers)
        task3 = requests.post(f"{BASE_URL}/tasks", 
                            json={"title": "Task C", "workspace": workspace_id}, headers=headers)
        
        # Extract task IDs handling success wrapper
        task1_id = str(task1.json().get("task", task1.json())["_id"])
        task2_id = str(task2.json().get("task", task2.json())["_id"])
        task3_id = str(task3.json().get("task", task3.json())["_id"])
        
        return {
            "headers": headers,
            "task1_id": task1_id,
            "task2_id": task2_id,
            "task3_id": task3_id
        }

    def test_circular_dependency_prevented(self, test_setup):
        """
        Tests that circular dependencies are detected and rejected.
        Expected: Creating A->B->A dependency chain should fail
        """
        response1 = requests.post(
            f"{BASE_URL}/tasks/{test_setup['task1_id']}/dependencies",
            json={"dependsOn": test_setup["task2_id"]},
            headers=test_setup["headers"]
        )
        assert response1.status_code in [200, 201], "Should allow first dependency"
        
        response2 = requests.post(
            f"{BASE_URL}/tasks/{test_setup['task2_id']}/dependencies",
            json={"dependsOn": test_setup["task1_id"]},
            headers=test_setup["headers"]
        )
        assert response2.status_code == 400, "Should reject circular dependency"
        assert "circular" in response2.json().get("message", "").lower()

    def test_task_cannot_complete_with_incomplete_dependencies(self, test_setup):
        """
        Tests that tasks with incomplete dependencies cannot be marked complete.
        Expected: Task A (depends on B) cannot complete if B is not done
        """
        requests.post(
            f"{BASE_URL}/tasks/{test_setup['task1_id']}/dependencies",
            json={"dependsOn": test_setup["task2_id"]},
            headers=test_setup["headers"]
        )
        
        response = requests.patch(
            f"{BASE_URL}/tasks/{test_setup['task1_id']}",
            json={"status": "completed"},
            headers=test_setup["headers"]
        )
        
        assert response.status_code == 400, "Should block completion when dependencies incomplete"

    def test_dependency_chain_endpoint_exists(self, test_setup):
        """
        Tests that endpoint to fetch dependency chain exists.
        Expected: GET /tasks/:id/dependencies returns upstream and downstream
        """
        response = requests.get(
            f"{BASE_URL}/tasks/{test_setup['task1_id']}/dependencies",
            headers=test_setup["headers"]
        )
        
        assert response.status_code == 200, "Dependency chain endpoint should exist"

    def test_transitive_circular_dependency_prevented(self, test_setup):
        """
        Tests that indirect circular dependencies are caught (A->B->C->A).
        Expected: Creating transitive circular chain should fail
        """
        requests.post(
            f"{BASE_URL}/tasks/{test_setup['task1_id']}/dependencies",
            json={"dependsOn": test_setup["task2_id"]},
            headers=test_setup["headers"]
        )
        requests.post(
            f"{BASE_URL}/tasks/{test_setup['task2_id']}/dependencies",
            json={"dependsOn": test_setup["task3_id"]},
            headers=test_setup["headers"]
        )
        
        response = requests.post(
            f"{BASE_URL}/tasks/{test_setup['task3_id']}/dependencies",
            json={"dependsOn": test_setup["task1_id"]},
            headers=test_setup["headers"]
        )
        
        assert response.status_code == 400, "Should detect transitive circular dependency"

    def test_task_can_complete_when_dependencies_done(self, test_setup):
        """
        Tests that task CAN complete when all dependencies are done.
        Expected: Task completes successfully after dependencies complete
        """
        # Clear any existing dependencies on task3 first
        existing_deps = requests.get(
            f"{BASE_URL}/tasks/{test_setup['task3_id']}/dependencies",
            headers=test_setup["headers"]
        )
        if existing_deps.status_code == 200:
            deps_data = existing_deps.json()
            for dep in deps_data.get('dependsOn', []):
                requests.delete(
                    f"{BASE_URL}/tasks/{test_setup['task3_id']}/dependencies/{dep['task']['_id'] if isinstance(dep['task'], dict) else dep['task']}",
                    headers=test_setup["headers"]
                )
        
        # Use task3 and task2 for this test (task3 depends on task2)
        requests.post(
            f"{BASE_URL}/tasks/{test_setup['task3_id']}/dependencies",
            json={"dependsOn": test_setup["task2_id"]},
            headers=test_setup["headers"]
        )
        requests.patch(
            f"{BASE_URL}/tasks/{test_setup['task2_id']}",
            json={"status": "completed"},
            headers=test_setup["headers"]
        )
        
        response = requests.patch(
            f"{BASE_URL}/tasks/{test_setup['task3_id']}",
            json={"status": "completed"},
            headers=test_setup["headers"]
        )
        
        assert response.status_code == 200, "Should allow completion when dependencies are done"

    def test_remove_dependency(self, test_setup):
        """
        Tests removing a dependency relationship.
        Expected: Dependency can be removed and task becomes unblocked
        """
        requests.post(
            f"{BASE_URL}/tasks/{test_setup['task1_id']}/dependencies",
            json={"dependsOn": test_setup["task2_id"]},
            headers=test_setup["headers"]
        )
        
        response = requests.delete(
            f"{BASE_URL}/tasks/{test_setup['task1_id']}/dependencies/{test_setup['task2_id']}",
            headers=test_setup["headers"]
        )
        
        assert response.status_code == 200, "Should allow removing dependency"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

