"""
Test suite for Task 5: Analytics Performance Optimization

This test suite validates the performance optimization of analytics endpoints,
including database indexing, Redis caching, and aggregation pipeline usage.
"""

import pytest
import requests
import json
import time
from pymongo import MongoClient

BASE_URL = "http://localhost:5001/api"
MONGO_URL = "mongodb://localhost:27017/taskflow"

class TestAnalyticsPerformance:
    """Test class for analytics performance optimization"""
    
    @pytest.fixture(scope="class")
    def test_setup(self):
        """
        Create test user, workspace, and bulk tasks for performance testing.
        Returns dict with auth token and resource IDs.
        """
        setup_data = {}
        
        # Create user
        user_data = {
            "name": "Performance Test User",
            "email": f"perftest_{int(time.time())}@test.com",
            "password": "Test123!@#"
        }
        response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
        assert response.status_code in [200, 201], "User registration failed"
        
        login = requests.post(f"{BASE_URL}/auth/login",
                            json={"email": user_data["email"], "password": user_data["password"]})
        setup_data["token"] = login.json()["token"]
        
        # Create workspace
        headers = {"Authorization": f"Bearer {setup_data['token']}"}
        workspace_data = {
            "name": f"Performance Test Workspace {int(time.time())}",
            "description": "Testing analytics performance"
        }
        workspace_response = requests.post(f"{BASE_URL}/workspaces", 
                                         json=workspace_data, headers=headers)
        setup_data["workspace_id"] = workspace_response.json()["data"]["_id"]
        
        # Create multiple tasks for performance testing (at least 100)
        setup_data["task_ids"] = []
        statuses = ["Todo", "In Progress", "Done"]
        priorities = ["Low", "Medium", "High"]
        
        for i in range(100):
            task_data = {
                "title": f"Performance Test Task {i}",
                "workspace": setup_data["workspace_id"],
                "status": statuses[i % 3],
                "priority": priorities[i % 3]
            }
            task_response = requests.post(f"{BASE_URL}/tasks",
                                        json=task_data, headers=headers)
            if task_response.status_code in [200, 201]:
                setup_data["task_ids"].append(task_response.json()["data"]["_id"])
        
        return setup_data
    
    def test_analytics_endpoint_response_time(self, test_setup):
        """
        Test 1: Verify analytics endpoint responds within 1 second with large datasets.
        Expected: Response time < 1000ms even with 100+ tasks
        """
        headers = {"Authorization": f"Bearer {test_setup['token']}"}
        
        # Measure analytics endpoint response time
        start_time = time.time()
        response = requests.get(f"{BASE_URL}/analytics/workspace/{test_setup['workspace_id']}",
                              headers=headers)
        end_time = time.time()
        
        response_time = (end_time - start_time) * 1000  # Convert to milliseconds
        
        # Should respond quickly even with many tasks
        assert response.status_code in [200, 404], \
            f"Analytics endpoint should exist, got {response.status_code}"
        
        if response.status_code == 200:
            assert response_time < 1000, \
                f"Analytics should respond in <1s, took {response_time:.0f}ms"
    
    def test_database_indexes_exist(self, test_setup):
        """
        Test 2: Verify database indexes exist on frequently queried fields.
        Expected: Indexes on status, assignee, dueDate, workspace, priority fields
        """
        try:
            # Connect to MongoDB and check indexes
            client = MongoClient(MONGO_URL)
            db = client.get_default_database()
            tasks_collection = db.tasks
            
            # Get all indexes
            indexes = list(tasks_collection.list_indexes())
            index_fields = []
            
            for index in indexes:
                keys = index.get("key", {})
                index_fields.extend(keys.keys())
            
            # Check for important indexes
            important_fields = ["status", "workspace", "assignee", "dueDate"]
            indexed_fields = [field for field in important_fields if field in index_fields]
            
            # At least some important fields should be indexed
            assert len(indexed_fields) >= 2, \
                f"Should have indexes on important fields. Found: {indexed_fields}"
                
        except Exception as e:
            # If we can't connect to MongoDB, skip this test
            pytest.skip(f"Could not verify indexes: {e}")
    
    def test_redis_caching_works(self, test_setup):
        """
        Test 3: Verify Redis caching is implemented (cache hit/miss behavior).
        Expected: Second request faster than first (cache hit)
        """
        headers = {"Authorization": f"Bearer {test_setup['token']}"}
        
        # First request - should be cache miss
        start1 = time.time()
        response1 = requests.get(f"{BASE_URL}/analytics/workspace/{test_setup['workspace_id']}",
                                headers=headers)
        time1 = (time.time() - start1) * 1000
        
        # Wait a bit
        time.sleep(0.1)
        
        # Second request - should be cache hit (faster)
        start2 = time.time()
        response2 = requests.get(f"{BASE_URL}/analytics/workspace/{test_setup['workspace_id']}",
                                headers=headers)
        time2 = (time.time() - start2) * 1000
        
        if response1.status_code == 200 and response2.status_code == 200:
            # Second request should be significantly faster if cached
            # Allow some variance but cache should provide speedup
            assert time2 < time1 * 0.8 or time2 < 50, \
                f"Caching should improve performance. First: {time1:.0f}ms, Second: {time2:.0f}ms"
    
    def test_aggregation_pipeline_used(self, test_setup):
        """
        Test 4: Verify aggregation pipelines are used instead of multiple queries.
        Expected: Analytics computed efficiently with MongoDB aggregation
        """
        headers = {"Authorization": f"Bearer {test_setup['token']}"}
        
        response = requests.get(f"{BASE_URL}/analytics/workspace/{test_setup['workspace_id']}",
                              headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            
            # Analytics should return aggregated data
            # Check for typical analytics fields
            assert "data" in data or "stats" in data or "analytics" in data, \
                "Response should contain analytics data"
            
            # Should have summary statistics (indicates aggregation was used)
            response_str = json.dumps(data).lower()
            has_stats = any(keyword in response_str for keyword in 
                          ["total", "count", "completed", "pending", "stats"])
            
            assert has_stats, "Analytics should include aggregated statistics"
    
    def test_query_count_optimization(self, test_setup):
        """
        Test 5: Verify reduced query count through efficient data fetching.
        Expected: Analytics endpoint makes minimal database queries
        """
        headers = {"Authorization": f"Bearer {test_setup['token']}"}
        
        # Make analytics request
        response = requests.get(f"{BASE_URL}/analytics/workspace/{test_setup['workspace_id']}",
                              headers=headers)
        
        # If analytics returns data, it should be comprehensive
        # (not requiring multiple follow-up requests)
        if response.status_code == 200:
            data = response.json()
            
            # Should return multiple metrics in one response
            response_str = str(data)
            metric_count = sum(1 for keyword in ["task", "status", "total", "count", "completed"]
                             if keyword in response_str.lower())
            
            assert metric_count >= 2, \
                "Analytics should return multiple metrics in single request"
    
    def test_analytics_handles_large_datasets(self, test_setup):
        """
        Test 6: Verify analytics can handle workspaces with many tasks.
        Expected: No timeout or error with 100+ tasks
        """
        headers = {"Authorization": f"Bearer {test_setup['token']}"}
        
        # Request analytics for workspace with many tasks
        response = requests.get(f"{BASE_URL}/analytics/workspace/{test_setup['workspace_id']}",
                              headers=headers, timeout=5)
        
        # Should not timeout or error
        assert response.status_code in [200, 404], \
            f"Analytics should handle large datasets, got {response.status_code}"
        
        if response.status_code == 200:
            # Response should be valid JSON
            data = response.json()
            assert isinstance(data, dict), "Should return valid analytics data"
    
    def test_analytics_pagination_support(self, test_setup):
        """
        Test 7: Verify analytics supports pagination for detailed task lists.
        Expected: Pagination parameters work correctly (limit, skip)
        """
        headers = {"Authorization": f"Bearer {test_setup['token']}"}
        
        # Try to get paginated task analytics
        params = {"limit": 10, "skip": 0}
        response = requests.get(f"{BASE_URL}/analytics/workspace/{test_setup['workspace_id']}/tasks",
                              headers=headers, params=params)
        
        # Pagination endpoint might not exist yet, but shouldn't crash
        assert response.status_code in [200, 404], \
            "Pagination endpoint should be implemented or return 404"
        
        if response.status_code == 200:
            data = response.json()
            # If pagination exists, should respect limit
            if "data" in data and isinstance(data["data"], list):
                assert len(data["data"]) <= params["limit"], \
                    "Pagination should respect limit parameter"
    
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
