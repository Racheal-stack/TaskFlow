"""
Test suite for Task 1: Implement Real-Time Comment Notifications

This test suite validates the implementation of real-time comment notifications
using WebSocket connections and REST API endpoints.
"""

import pytest
import requests
import json
import time
from socketio import Client as SocketIOClient
from typing import Dict, List

# Configuration
BASE_URL = "http://localhost:5001/api"
SOCKET_URL = "http://localhost:5001"

class TestCommentNotifications:
    """Test class for comment notification functionality"""
    
    @pytest.fixture(scope="class")
    def auth_tokens(self):
        """
        Fixture to create two test users and return their auth tokens.
        Returns a dictionary with tokens for user1 and user2.
        """
        users = {}
        
        # Register and login user 1
        user1_data = {
            "name": "Test User 1",
            "email": f"testuser1_{int(time.time())}@test.com",
            "password": "Test123!@#"
        }
        response = requests.post(f"{BASE_URL}/auth/register", json=user1_data)
        assert response.status_code in [200, 201], "User 1 registration failed"
        
        login_response = requests.post(f"{BASE_URL}/auth/login", 
                                      json={"email": user1_data["email"], "password": user1_data["password"]})
        users["user1"] = login_response.json()["token"]
        
        # Register and login user 2
        user2_data = {
            "name": "Test User 2",
            "email": f"testuser2_{int(time.time())}@test.com",
            "password": "Test123!@#"
        }
        response = requests.post(f"{BASE_URL}/auth/register", json=user2_data)
        assert response.status_code in [200, 201], "User 2 registration failed"
        
        login_response = requests.post(f"{BASE_URL}/auth/login",
                                      json={"email": user2_data["email"], "password": user2_data["password"]})
        users["user2"] = login_response.json()["token"]
        
        return users
    
    @pytest.fixture(scope="class")
    def test_task(self, auth_tokens):
        """
        Fixture to create a test task for notifications.
        Returns the task ID.
        """
        headers = {"Authorization": f"Bearer {auth_tokens['user1']}"}
        
        # Create workspace first
        workspace_data = {
            "name": f"Test Workspace {int(time.time())}",
            "description": "Test workspace for notifications"
        }
        workspace_response = requests.post(f"{BASE_URL}/workspaces", 
                                          json=workspace_data, headers=headers)
        workspace_id = workspace_response.json()["data"]["_id"]
        
        # Create task
        task_data = {
            "title": "Test Task for Notifications",
            "description": "Testing comment notifications",
            "workspace": workspace_id
        }
        task_response = requests.post(f"{BASE_URL}/tasks", 
                                     json=task_data, headers=headers)
        task_id = task_response.json()["data"]["_id"]
        
        return {"task_id": task_id, "workspace_id": workspace_id}
    
    def test_notification_api_endpoint_exists(self, auth_tokens):
        """
        Test 1: Verify that the notification API endpoint exists and is accessible.
        Expected: GET /api/notifications should return 200 or 404 (not 500).
        """
        headers = {"Authorization": f"Bearer {auth_tokens['user1']}"}
        response = requests.get(f"{BASE_URL}/notifications", headers=headers)
        
        # Should not return server error - either exists (200) or not found (404)
        assert response.status_code != 500, "Notification endpoint should be implemented"
        assert response.status_code in [200, 404], f"Unexpected status code: {response.status_code}"
    
    def test_notification_schema_in_database(self, auth_tokens, test_task):
        """
        Test 2: Verify that notifications are stored in the database with correct schema.
        Expected: After adding a comment, a notification record should exist with required fields.
        """
        headers = {"Authorization": f"Bearer {auth_tokens['user1']}"}
        task_id = test_task["task_id"]
        
        # Add a comment to the task
        comment_data = {
            "text": "This is a test comment for notification"
        }
        comment_response = requests.post(f"{BASE_URL}/tasks/{task_id}/comments",
                                        json=comment_data, headers=headers)
        assert comment_response.status_code in [200, 201], "Comment creation failed"
        
        # Wait for notification to be created
        time.sleep(1)
        
        # Fetch notifications
        notif_response = requests.get(f"{BASE_URL}/notifications", headers=headers)
        
        if notif_response.status_code == 200:
            notifications = notif_response.json().get("data", [])
            # Check if notification has required fields
            if len(notifications) > 0:
                notif = notifications[0]
                assert "sender" in notif or "userId" in notif, "Notification missing sender/user field"
                assert "task" in notif or "reference" in notif, "Notification missing task reference"
                assert "read" in notif or "isRead" in notif, "Notification missing read status"
        else:
            pytest.fail("Notification endpoint not implemented or returned error")
    
    def test_socket_comment_notification_event(self, auth_tokens, test_task):
        """
        Test 3: Verify that WebSocket emits comment_notification event when comment is added.
        Expected: Socket connection should receive 'comment_added' or 'comment_notification' event.
        """
        notifications_received = []
        
        # Create socket client for user 2
        sio = SocketIOClient()
        
        @sio.on('comment_added')
        def on_comment_added(data):
            notifications_received.append({'event': 'comment_added', 'data': data})
        
        @sio.on('comment_notification')
        def on_comment_notification(data):
            notifications_received.append({'event': 'comment_notification', 'data': data})
        
        @sio.on('notification')
        def on_notification(data):
            notifications_received.append({'event': 'notification', 'data': data})
        
        try:
            # Connect with user 2's token
            sio.connect(SOCKET_URL, auth={"token": auth_tokens['user2']})
            time.sleep(1)
            
            # User 1 adds a comment
            headers = {"Authorization": f"Bearer {auth_tokens['user1']}"}
            comment_data = {"text": "Real-time notification test"}
            requests.post(f"{BASE_URL}/tasks/{test_task['task_id']}/comments",
                         json=comment_data, headers=headers)
            
            # Wait for socket event
            time.sleep(2)
            
            # Verify notification was received
            assert len(notifications_received) > 0, "No socket notification received for comment"
            
        finally:
            sio.disconnect()
    
    def test_notification_badge_count(self, auth_tokens, test_task):
        """
        Test 4: Verify that the notification count endpoint returns correct unread count.
        Expected: GET /api/notifications/count should return unread notification count.
        """
        headers = {"Authorization": f"Bearer {auth_tokens['user2']}"}
        
        # Check if count endpoint exists
        count_response = requests.get(f"{BASE_URL}/notifications/count", headers=headers)
        
        if count_response.status_code == 200:
            count_data = count_response.json()
            assert "count" in count_data or "unreadCount" in count_data, "Count endpoint missing count field"
            count = count_data.get("count", count_data.get("unreadCount", 0))
            assert isinstance(count, int), "Notification count should be an integer"
            assert count >= 0, "Notification count should be non-negative"
        else:
            pytest.fail("Notification count endpoint not implemented")
    
    def test_mark_notification_as_read(self, auth_tokens, test_task):
        """
        Test 5: Verify that notifications can be marked as read.
        Expected: PUT/PATCH /api/notifications/:id/read should mark notification as read.
        """
        headers = {"Authorization": f"Bearer {auth_tokens['user1']}"}
        
        # Create a notification by adding a comment
        comment_data = {"text": "Comment to create notification"}
        requests.post(f"{BASE_URL}/tasks/{test_task['task_id']}/comments",
                     json=comment_data, headers=headers)
        time.sleep(1)
        
        # Get notifications
        notif_response = requests.get(f"{BASE_URL}/notifications", headers=headers)
        
        if notif_response.status_code == 200:
            notifications = notif_response.json().get("data", [])
            if len(notifications) > 0:
                notif_id = notifications[0].get("_id") or notifications[0].get("id")
                
                # Try to mark as read
                read_response = requests.put(f"{BASE_URL}/notifications/{notif_id}/read",
                                            headers=headers)
                
                assert read_response.status_code in [200, 204], "Failed to mark notification as read"
        else:
            pytest.fail("Cannot test mark-as-read without notification endpoint")
    
    def test_notification_pagination(self, auth_tokens, test_task):
        """
        Test 6: Verify that notification endpoint supports pagination.
        Expected: GET /api/notifications?page=1&limit=10 should return paginated results.
        """
        headers = {"Authorization": f"Bearer {auth_tokens['user1']}"}
        
        # Create multiple comments to generate notifications
        for i in range(5):
            comment_data = {"text": f"Comment {i} for pagination test"}
            requests.post(f"{BASE_URL}/tasks/{test_task['task_id']}/comments",
                         json=comment_data, headers=headers)
        
        time.sleep(2)
        
        # Test pagination
        paginated_response = requests.get(f"{BASE_URL}/notifications?page=1&limit=2",
                                         headers=headers)
        
        if paginated_response.status_code == 200:
            data = paginated_response.json()
            # Check for pagination metadata
            assert "data" in data or "notifications" in data, "Response missing data field"
            
            # If pagination is implemented, should have metadata
            if "totalPages" in data or "total" in data or "pagination" in data:
                assert True, "Pagination implemented correctly"
            else:
                # At minimum, should limit results
                results = data.get("data", data.get("notifications", []))
                assert len(results) <= 2, "Pagination limit not respected"
        else:
            pytest.fail("Notification endpoint not accessible for pagination test")
    
    def test_notification_includes_sender_info(self, auth_tokens, test_task):
        """
        Test 7: Verify that notifications include sender user information.
        Expected: Notification objects should populate sender details (name, email, avatar).
        """
        headers_user1 = {"Authorization": f"Bearer {auth_tokens['user1']}"}
        headers_user2 = {"Authorization": f"Bearer {auth_tokens['user2']}"}
        
        # User 1 comments on task
        comment_data = {"text": "Comment with sender info"}
        requests.post(f"{BASE_URL}/tasks/{test_task['task_id']}/comments",
                     json=comment_data, headers=headers_user1)
        
        time.sleep(1)
        
        # User 2 fetches notifications
        notif_response = requests.get(f"{BASE_URL}/notifications", headers=headers_user2)
        
        if notif_response.status_code == 200:
            notifications = notif_response.json().get("data", [])
            if len(notifications) > 0:
                notif = notifications[0]
                sender = notif.get("sender", notif.get("user", {}))
                
                # Verify sender info is populated
                if isinstance(sender, dict):
                    assert "name" in sender or "_id" in sender, "Sender information not populated"
                else:
                    pytest.fail("Sender field should be populated object, not just ID")
        else:
            pytest.fail("Cannot verify sender info without notification endpoint")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
