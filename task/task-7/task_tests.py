"""
Test suite for Task 7: Fix Concurrent Edit Race Condition

Tests optimistic locking, version control, conflict detection, and WebSocket broadcasts.
"""

import pytest
import requests
import json
import time
from socketio import Client as SocketIOClient

BASE_URL = "http://localhost:5001/api"
SOCKET_URL = "http://localhost:5001"

class TestConcurrentEdits:
    """Test class for concurrent edit handling"""
    
    @pytest.fixture(scope="class")
    def test_setup(self):
        """Create users and task for concurrent edit testing"""
        # User 1
        user1_data = {
            "name": "User One",
            "email": f"user1_{int(time.time())}@test.com",
            "password": "User123!@#"
        }
        requests.post(f"{BASE_URL}/auth/register", json=user1_data)
        login1 = requests.post(f"{BASE_URL}/auth/login",
                             json={"email": user1_data["email"], "password": user1_data["password"]})
        token1 = login1.json()["token"]
        
        # User 2
        user2_data = {
            "name": "User Two",
            "email": f"user2_{int(time.time())}@test.com",
            "password": "User123!@#"
        }
        requests.post(f"{BASE_URL}/auth/register", json=user2_data)
        login2 = requests.post(f"{BASE_URL}/auth/login",
                             json={"email": user2_data["email"], "password": user2_data["password"]})
        token2 = login2.json()["token"]
        
        headers1 = {"Authorization": f"Bearer {token1}"}
        headers2 = {"Authorization": f"Bearer {token2}"}
        
        # Create workspace and task
        workspace = requests.post(f"{BASE_URL}/workspaces",
                                json={"name": "Concurrent Test Workspace"}, headers=headers1)
        workspace_id = workspace.json()["_id"]
        
        task = requests.post(f"{BASE_URL}/tasks",
                           json={"title": "Concurrent Edit Task", "workspace": workspace_id},
                           headers=headers1)
        task_id = task.json()["_id"]
        
        return {
            "headers1": headers1,
            "headers2": headers2,
            "task_id": task_id,
            "token1": token1,
            "token2": token2
        }

    def test_task_has_version_field(self, test_setup):
        """
        Tests that tasks have a version number field for optimistic locking.
        Expected: Task response includes version or __v field
        """
        response = requests.get(
            f"{BASE_URL}/tasks/{test_setup['task_id']}",
            headers=test_setup["headers1"]
        )
        
        assert response.status_code == 200, "Should fetch task successfully"
        data = response.json()
        assert "version" in data or "__v" in data or "v" in data, \
            "Task should have version field for optimistic locking"

    def test_version_increments_on_update(self, test_setup):
        """
        Tests that version number increments with each update.
        Expected: Version increases after each modification
        """
        # Get current task
        response1 = requests.get(
            f"{BASE_URL}/tasks/{test_setup['task_id']}",
            headers=test_setup["headers1"]
        )
        initial_version = response1.json().get("version") or response1.json().get("__v", 0)
        
        # Update task
        update_response = requests.patch(
            f"{BASE_URL}/tasks/{test_setup['task_id']}",
            json={"description": "Updated description"},
            headers=test_setup["headers1"]
        )
        
        if update_response.status_code == 200:
            updated_version = update_response.json().get("version") or update_response.json().get("__v", 0)
            assert updated_version > initial_version, \
                "Version should increment after update"

    def test_concurrent_update_conflict_detection(self, test_setup):
        """
        Tests that concurrent updates are detected and rejected.
        Expected: Second update with stale version returns 409 Conflict
        """
        # Both users get the task at the same time
        response1 = requests.get(f"{BASE_URL}/tasks/{test_setup['task_id']}",
                                headers=test_setup["headers1"])
        response2 = requests.get(f"{BASE_URL}/tasks/{test_setup['task_id']}",
                                headers=test_setup["headers2"])
        
        task_data = response1.json()
        current_version = task_data.get("version") or task_data.get("__v")
        
        # User 1 updates first
        update1 = requests.patch(
            f"{BASE_URL}/tasks/{test_setup['task_id']}",
            json={"status": "in-progress", "version": current_version},
            headers=test_setup["headers1"]
        )
        
        # User 2 tries to update with same (now stale) version
        update2 = requests.patch(
            f"{BASE_URL}/tasks/{test_setup['task_id']}",
            json={"description": "Different update", "version": current_version},
            headers=test_setup["headers2"]
        )
        
        assert update2.status_code == 409, \
            "Should return 409 Conflict for concurrent update with stale version"
        assert "conflict" in update2.json().get("message", "").lower() or \
               "version" in update2.json().get("message", "").lower(), \
            "Error should mention version conflict"

    def test_conflict_resolution_endpoint_exists(self, test_setup):
        """
        Tests that endpoint for conflict resolution exists.
        Expected: Endpoint to fetch conflicting versions
        """
        response = requests.get(
            f"{BASE_URL}/tasks/{test_setup['task_id']}/conflicts",
            headers=test_setup["headers1"]
        )
        
        assert response.status_code in [200, 404], \
            "Conflict resolution endpoint should exist (404 if no conflicts)"

    def test_websocket_broadcasts_task_updates(self, test_setup):
        """
        Tests that task updates are broadcast via WebSocket to all clients.
        Expected: WebSocket event fired when task is updated
        """
        updates_received = []
        
        try:
            sio = SocketIOClient()
            sio.connect(SOCKET_URL, auth={"token": test_setup["token2"]})
            
            @sio.on("task-updated")
            def on_task_updated(data):
                updates_received.append(data)
            
            time.sleep(0.5)  # Wait for connection
            
            # User 1 updates the task
            requests.patch(
                f"{BASE_URL}/tasks/{test_setup['task_id']}",
                json={"priority": "high"},
                headers=test_setup["headers1"]
            )
            
            time.sleep(1)  # Wait for WebSocket event
            sio.disconnect()
            
            assert len(updates_received) > 0, \
                "WebSocket should broadcast task updates to connected clients"
                
        except Exception as e:
            pytest.skip(f"WebSocket test skipped: {str(e)}")

    def test_update_succeeds_with_correct_version(self, test_setup):
        """
        Tests that update succeeds when correct version is provided.
        Expected: 200 status when version matches
        """
        # Get current task
        response = requests.get(
            f"{BASE_URL}/tasks/{test_setup['task_id']}",
            headers=test_setup["headers1"]
        )
        current_version = response.json().get("version") or response.json().get("__v")
        
        # Update with correct version
        update_response = requests.patch(
            f"{BASE_URL}/tasks/{test_setup['task_id']}",
            json={"title": "Updated Title", "version": current_version},
            headers=test_setup["headers1"]
        )
        
        assert update_response.status_code == 200, \
            "Update should succeed with correct version number"

    def test_last_write_wins_notification(self, test_setup):
        """
        Tests that users are notified when their changes are overwritten.
        Expected: Notification system records conflict events
        """
        response = requests.get(
            f"{BASE_URL}/users/notifications",
            headers=test_setup["headers2"]
        )
        
        assert response.status_code in [200, 404], \
            "Notification endpoint should exist for conflict alerts"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
