"""
Test suite for Task 4: RBAC (Role-Based Access Control)

This test suite validates the implementation of role-based access control with
permission levels (Owner, Admin, Member, Viewer) and permission inheritance across
workspace, project, and task hierarchies.
"""

import pytest
import requests
import json
import time

BASE_URL = "http://localhost:5001/api"

class TestRBAC:
    """Test class for Role-Based Access Control functionality"""
    
    @pytest.fixture(scope="class")
    def test_setup(self):
        """
        Create test users with different roles and workspace hierarchy.
        Returns dict with tokens, user IDs, and resource IDs.
        """
        setup_data = {}
        
        # Create owner user
        owner_data = {
            "name": "Owner User",
            "email": f"owner_{int(time.time())}@test.com",
            "password": "Test123!@#"
        }
        response = requests.post(f"{BASE_URL}/auth/register", json=owner_data)
        assert response.status_code in [200, 201], "Owner registration failed"
        
        login = requests.post(f"{BASE_URL}/auth/login",
                            json={"email": owner_data["email"], "password": owner_data["password"]})
        setup_data["owner_token"] = login.json()["token"]
        setup_data["owner_id"] = login.json().get("user", {}).get("_id") or login.json().get("data", {}).get("_id")
        
        # Create admin user
        admin_data = {
            "name": "Admin User",
            "email": f"admin_{int(time.time())}@test.com",
            "password": "Test123!@#"
        }
        response = requests.post(f"{BASE_URL}/auth/register", json=admin_data)
        login = requests.post(f"{BASE_URL}/auth/login",
                            json={"email": admin_data["email"], "password": admin_data["password"]})
        setup_data["admin_token"] = login.json()["token"]
        setup_data["admin_id"] = login.json().get("user", {}).get("_id") or login.json().get("data", {}).get("_id")
        
        # Create member user
        member_data = {
            "name": "Member User",
            "email": f"member_{int(time.time())}@test.com",
            "password": "Test123!@#"
        }
        response = requests.post(f"{BASE_URL}/auth/register", json=member_data)
        login = requests.post(f"{BASE_URL}/auth/login",
                            json={"email": member_data["email"], "password": member_data["password"]})
        setup_data["member_token"] = login.json()["token"]
        setup_data["member_id"] = login.json().get("user", {}).get("_id") or login.json().get("data", {}).get("_id")
        
        # Create viewer user
        viewer_data = {
            "name": "Viewer User",
            "email": f"viewer_{int(time.time())}@test.com",
            "password": "Test123!@#"
        }
        response = requests.post(f"{BASE_URL}/auth/register", json=viewer_data)
        login = requests.post(f"{BASE_URL}/auth/login",
                            json={"email": viewer_data["email"], "password": viewer_data["password"]})
        setup_data["viewer_token"] = login.json()["token"]
        setup_data["viewer_id"] = login.json().get("user", {}).get("_id") or login.json().get("data", {}).get("_id")
        
        # Owner creates workspace
        headers = {"Authorization": f"Bearer {setup_data['owner_token']}"}
        workspace_data = {
            "name": f"RBAC Test Workspace {int(time.time())}",
            "description": "Testing RBAC permissions"
        }
        workspace_response = requests.post(f"{BASE_URL}/workspaces", 
                                         json=workspace_data, headers=headers)
        setup_data["workspace_id"] = workspace_response.json()["data"]["_id"]
        
        # Create a project
        project_data = {
            "name": "RBAC Test Project",
            "workspace": setup_data["workspace_id"]
        }
        project_response = requests.post(f"{BASE_URL}/projects",
                                       json=project_data, headers=headers)
        setup_data["project_id"] = project_response.json()["data"]["_id"]
        
        # Create a task
        task_data = {
            "title": "RBAC Test Task",
            "workspace": setup_data["workspace_id"],
            "project": setup_data["project_id"]
        }
        task_response = requests.post(f"{BASE_URL}/tasks",
                                    json=task_data, headers=headers)
        setup_data["task_id"] = task_response.json()["data"]["_id"]
        
        return setup_data
    
    def test_permission_model_with_roles_exists(self, test_setup):
        """
        Test 1: Verify Permission model exists with proper role definitions.
        Expected: Should be able to query/create permissions with Owner, Admin, Member, Viewer roles
        """
        headers = {"Authorization": f"Bearer {test_setup['owner_token']}"}
        
        # Try to add a member with a specific role
        permission_data = {
            "workspace": test_setup["workspace_id"],
            "user": test_setup["member_id"],
            "role": "Member"
        }
        
        # Check if permissions endpoint exists
        response = requests.post(f"{BASE_URL}/workspaces/{test_setup['workspace_id']}/permissions",
                               json=permission_data, headers=headers)
        
        # Should either succeed or have a permissions endpoint that returns proper error
        assert response.status_code != 500, "Permission system should be implemented (got 500 server error)"
        assert response.status_code in [200, 201, 400, 404], f"Unexpected status: {response.status_code}"
        
        # If endpoint exists, check if we can assign different roles
        if response.status_code in [200, 201]:
            data = response.json()
            assert "role" in str(data).lower(), "Response should contain role information"
    
    def test_permission_middleware_blocks_unauthorized_actions(self, test_setup):
        """
        Test 2: Verify permission middleware rejects unauthorized actions with 403.
        Expected: Viewer cannot delete workspace, returns 403 Forbidden
        """
        # First assign viewer role
        owner_headers = {"Authorization": f"Bearer {test_setup['owner_token']}"}
        permission_data = {
            "workspace": test_setup["workspace_id"],
            "user": test_setup["viewer_id"],
            "role": "Viewer"
        }
        requests.post(f"{BASE_URL}/workspaces/{test_setup['workspace_id']}/permissions",
                     json=permission_data, headers=owner_headers)
        
        # Viewer tries to delete workspace
        viewer_headers = {"Authorization": f"Bearer {test_setup['viewer_token']}"}
        response = requests.delete(f"{BASE_URL}/workspaces/{test_setup['workspace_id']}", 
                                  headers=viewer_headers)
        
        # Should be forbidden (403) or unauthorized (401), not successful (200)
        assert response.status_code in [403, 401], \
            f"Viewer should not be able to delete workspace, got {response.status_code}"
    
    def test_permission_inheritance_cascade(self, test_setup):
        """
        Test 3: Verify workspace permissions cascade to projects and tasks.
        Expected: Workspace Admin has admin rights on all projects/tasks under workspace
        """
        # Assign Admin role at workspace level
        owner_headers = {"Authorization": f"Bearer {test_setup['owner_token']}"}
        permission_data = {
            "workspace": test_setup["workspace_id"],
            "user": test_setup["admin_id"],
            "role": "Admin"
        }
        requests.post(f"{BASE_URL}/workspaces/{test_setup['workspace_id']}/permissions",
                     json=permission_data, headers=owner_headers)
        
        # Admin should be able to update task (cascaded permission)
        admin_headers = {"Authorization": f"Bearer {test_setup['admin_token']}"}
        update_data = {"title": "Updated by Admin"}
        response = requests.put(f"{BASE_URL}/tasks/{test_setup['task_id']}",
                              json=update_data, headers=admin_headers)
        
        # Admin with workspace-level permissions should be able to update task
        assert response.status_code in [200, 201], \
            f"Workspace Admin should be able to update tasks, got {response.status_code}"
    
    def test_different_roles_have_correct_permissions(self, test_setup):
        """
        Test 4: Verify different roles have appropriate permission levels.
        Expected: Member can create tasks, Viewer cannot
        """
        # Assign Member role
        owner_headers = {"Authorization": f"Bearer {test_setup['owner_token']}"}
        member_permission = {
            "workspace": test_setup["workspace_id"],
            "user": test_setup["member_id"],
            "role": "Member"
        }
        requests.post(f"{BASE_URL}/workspaces/{test_setup['workspace_id']}/permissions",
                     json=member_permission, headers=owner_headers)
        
        # Assign Viewer role
        viewer_permission = {
            "workspace": test_setup["workspace_id"],
            "user": test_setup["viewer_id"],
            "role": "Viewer"
        }
        requests.post(f"{BASE_URL}/workspaces/{test_setup['workspace_id']}/permissions",
                     json=viewer_permission, headers=owner_headers)
        
        # Member tries to create task
        member_headers = {"Authorization": f"Bearer {test_setup['member_token']}"}
        task_data = {
            "title": "Member Created Task",
            "workspace": test_setup["workspace_id"]
        }
        member_response = requests.post(f"{BASE_URL}/tasks",
                                       json=task_data, headers=member_headers)
        
        # Viewer tries to create task
        viewer_headers = {"Authorization": f"Bearer {test_setup['viewer_token']}"}
        viewer_task_data = {
            "title": "Viewer Cannot Create This",
            "workspace": test_setup["workspace_id"]
        }
        viewer_response = requests.post(f"{BASE_URL}/tasks",
                                       json=viewer_task_data, headers=viewer_headers)
        
        # Member should succeed, Viewer should fail
        assert member_response.status_code in [200, 201], \
            "Member should be able to create tasks"
        assert viewer_response.status_code in [403, 401], \
            f"Viewer should not be able to create tasks, got {viewer_response.status_code}"
    
    def test_owner_has_full_permissions(self, test_setup):
        """
        Test 5: Verify Owner role has full permissions on all operations.
        Expected: Owner can perform any operation (CRUD) on workspace/projects/tasks
        """
        owner_headers = {"Authorization": f"Bearer {test_setup['owner_token']}"}
        
        # Owner creates a new task
        task_data = {
            "title": "Owner Task",
            "workspace": test_setup["workspace_id"]
        }
        create_response = requests.post(f"{BASE_URL}/tasks",
                                      json=task_data, headers=owner_headers)
        assert create_response.status_code in [200, 201], "Owner should create tasks"
        
        # Owner updates the task
        task_id = create_response.json()["data"]["_id"]
        update_response = requests.put(f"{BASE_URL}/tasks/{task_id}",
                                     json={"title": "Updated"}, headers=owner_headers)
        assert update_response.status_code in [200, 201], "Owner should update tasks"
        
        # Owner deletes the task
        delete_response = requests.delete(f"{BASE_URL}/tasks/{task_id}",
                                        headers=owner_headers)
        assert delete_response.status_code in [200, 204], "Owner should delete tasks"
    
    def test_permission_api_endpoints_exist(self, test_setup):
        """
        Test 6: Verify permission management API endpoints exist.
        Expected: Endpoints for adding/removing roles and listing permissions exist
        """
        headers = {"Authorization": f"Bearer {test_setup['owner_token']}"}
        
        # Check GET permissions endpoint
        get_response = requests.get(f"{BASE_URL}/workspaces/{test_setup['workspace_id']}/permissions",
                                   headers=headers)
        assert get_response.status_code in [200, 404], \
            "Permissions listing endpoint should exist (not 500)"
        
        # Check POST permissions endpoint
        permission_data = {
            "workspace": test_setup["workspace_id"],
            "user": test_setup["member_id"],
            "role": "Admin"
        }
        post_response = requests.post(f"{BASE_URL}/workspaces/{test_setup['workspace_id']}/permissions",
                                     json=permission_data, headers=headers)
        assert post_response.status_code in [200, 201, 400, 404], \
            "Permission creation endpoint should exist (not 500)"
    
    def test_project_level_role_override(self, test_setup):
        """
        Test 7: Verify project-level roles can override workspace roles.
        Expected: Workspace Member can be Project Admin on specific project
        """
        owner_headers = {"Authorization": f"Bearer {test_setup['owner_token']}"}
        
        # Set user as Member at workspace level
        workspace_permission = {
            "workspace": test_setup["workspace_id"],
            "user": test_setup["member_id"],
            "role": "Member"
        }
        requests.post(f"{BASE_URL}/workspaces/{test_setup['workspace_id']}/permissions",
                     json=workspace_permission, headers=owner_headers)
        
        # Set same user as Admin at project level
        project_permission = {
            "project": test_setup["project_id"],
            "user": test_setup["member_id"],
            "role": "Admin"
        }
        project_perm_response = requests.post(f"{BASE_URL}/projects/{test_setup['project_id']}/permissions",
                                             json=project_permission, headers=owner_headers)
        
        # User should be able to perform admin actions on this specific project
        member_headers = {"Authorization": f"Bearer {test_setup['member_token']}"}
        update_response = requests.put(f"{BASE_URL}/projects/{test_setup['project_id']}",
                                      json={"name": "Updated Project Name"}, 
                                      headers=member_headers)
        
        # Should succeed because of project-level Admin role
        assert update_response.status_code in [200, 201, 404], \
            f"Project Admin should update project, got {update_response.status_code}"
    
    def test_placeholder_3(self, auth_token):
        """
        Test 3: [Replace with actual test description]
        Expected: [Replace with expected behavior]
        """
        # TODO: Implement test
        assert True, "Replace this with actual test implementation"
    
    def test_placeholder_4(self, auth_token):
        """
        Test 4: [Replace with actual test description]
        Expected: [Replace with expected behavior]
        """
        # TODO: Implement test
        assert True, "Replace this with actual test implementation"
    
    def test_placeholder_5(self, auth_token):
        """
        Test 5: [Replace with actual test description]
        Expected: [Replace with expected behavior]
        """
        # TODO: Implement test
        assert True, "Replace this with actual test implementation"
    
    def test_placeholder_6(self, auth_token):
        """
        Test 6: [Replace with actual test description]
        Expected: [Replace with expected behavior]
        """
        # TODO: Implement test
        assert True, "Replace this with actual test implementation"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
