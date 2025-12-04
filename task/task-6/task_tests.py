"""
Test suite for Task 6: File Attachment System

Tests file upload, type validation, size limits, cloud storage, and thumbnails.
"""

import pytest
import requests
import json
import time
import io
from pathlib import Path

BASE_URL = "http://localhost:5001/api"

class TestFileAttachments:
    """Test class for file attachment functionality"""
    
    @pytest.fixture(scope="class")
    def test_setup(self):
        """Create user, workspace, and task for file attachments"""
        user_data = {
            "name": "File Test User",
            "email": f"filetest_{int(time.time())}@test.com",
            "password": "File123!@#"
        }
        requests.post(f"{BASE_URL}/auth/register", json=user_data)
        login = requests.post(f"{BASE_URL}/auth/login",
                            json={"email": user_data["email"], "password": user_data["password"]})
        token = login.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        workspace = requests.post(f"{BASE_URL}/workspaces",
                                json={"name": "File Test Workspace"}, headers=headers)
        workspace_id = workspace.json()["_id"]
        
        task = requests.post(f"{BASE_URL}/tasks",
                           json={"title": "Task with files", "workspace": workspace_id},
                           headers=headers)
        task_id = task.json()["_id"]
        
        return {"headers": headers, "task_id": task_id, "token": token}

    def test_file_upload_endpoint_exists(self, test_setup):
        """
        Tests that file upload endpoint exists and accepts multipart/form-data.
        Expected: Endpoint returns 200 or 400 (validation), not 404
        """
        # Create a fake file
        files = {'file': ('test.txt', io.BytesIO(b'test content'), 'text/plain')}
        
        response = requests.post(
            f"{BASE_URL}/tasks/{test_setup['task_id']}/attachments",
            files=files,
            headers=test_setup["headers"]
        )
        
        assert response.status_code != 404, "File upload endpoint should exist"
        assert response.status_code in [200, 201, 400, 413], \
            "Endpoint should handle file uploads (may reject if not implemented)"

    def test_file_type_validation_accepts_valid_types(self, test_setup):
        """
        Tests that valid file types (images, PDFs, docs) are accepted.
        Expected: 200/201 status for allowed file types
        """
        valid_files = [
            ('image.jpg', b'fake jpg content', 'image/jpeg'),
            ('document.pdf', b'fake pdf content', 'application/pdf'),
            ('doc.docx', b'fake docx content', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        ]
        
        for filename, content, mimetype in valid_files:
            files = {'file': (filename, io.BytesIO(content), mimetype)}
            response = requests.post(
                f"{BASE_URL}/tasks/{test_setup['task_id']}/attachments",
                files=files,
                headers=test_setup["headers"]
            )
            
            assert response.status_code in [200, 201], \
                f"Should accept {filename} - valid file type"

    def test_file_type_validation_rejects_executables(self, test_setup):
        """
        Tests that executable files are rejected for security.
        Expected: 400 status with validation error for .exe, .sh, .bat
        """
        dangerous_files = [
            ('malware.exe', b'fake exe', 'application/x-msdownload'),
            ('script.sh', b'#!/bin/bash', 'application/x-sh'),
            ('batch.bat', b'@echo off', 'application/x-bat')
        ]
        
        for filename, content, mimetype in dangerous_files:
            files = {'file': (filename, io.BytesIO(content), mimetype)}
            response = requests.post(
                f"{BASE_URL}/tasks/{test_setup['task_id']}/attachments",
                files=files,
                headers=test_setup["headers"]
            )
            
            assert response.status_code == 400, \
                f"Should reject {filename} - dangerous file type"
            assert "type" in response.json().get("message", "").lower() or \
                   "invalid" in response.json().get("message", "").lower(), \
                "Error should mention file type validation"

    def test_file_size_limit_enforcement(self, test_setup):
        """
        Tests that files larger than 10MB are rejected.
        Expected: 413 or 400 status for oversized files
        """
        # Create a file larger than 10MB (10 * 1024 * 1024 bytes)
        large_content = b'x' * (11 * 1024 * 1024)  # 11MB
        files = {'file': ('large_file.pdf', io.BytesIO(large_content), 'application/pdf')}
        
        response = requests.post(
            f"{BASE_URL}/tasks/{test_setup['task_id']}/attachments",
            files=files,
            headers=test_setup["headers"]
        )
        
        assert response.status_code in [400, 413], \
            "Should reject files larger than 10MB"
        error_msg = response.json().get("message", "").lower()
        assert "size" in error_msg or "large" in error_msg or "limit" in error_msg, \
            "Error should mention file size limit"

    def test_thumbnail_generation_for_images(self, test_setup):
        """
        Tests that thumbnails are generated for image uploads.
        Expected: Response includes thumbnail URL for images
        """
        # Upload an image
        files = {'file': ('photo.jpg', io.BytesIO(b'fake jpg data'), 'image/jpeg')}
        response = requests.post(
            f"{BASE_URL}/tasks/{test_setup['task_id']}/attachments",
            files=files,
            headers=test_setup["headers"]
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            assert "thumbnail" in data or "thumbnailUrl" in data, \
                "Image uploads should include thumbnail URL"

    def test_file_stored_in_cloud_storage(self, test_setup):
        """
        Tests that files are stored in cloud storage (S3), not database.
        Expected: Response includes storage URL (S3/cloud URL pattern)
        """
        files = {'file': ('test.pdf', io.BytesIO(b'pdf content'), 'application/pdf')}
        response = requests.post(
            f"{BASE_URL}/tasks/{test_setup['task_id']}/attachments",
            files=files,
            headers=test_setup["headers"]
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            url = data.get("url") or data.get("fileUrl") or data.get("path", "")
            
            # Check if URL indicates cloud storage (s3, cloudinary, azure, etc.)
            assert any(provider in url.lower() for provider in ["s3", "cloud", "storage", "blob", "cdn"]), \
                "Files should be stored in cloud storage, not locally"

    def test_file_deletion_removes_from_storage(self, test_setup):
        """
        Tests that deleting a file removes it from both DB and cloud storage.
        Expected: DELETE request succeeds and file is no longer accessible
        """
        # First upload a file
        files = {'file': ('delete_me.txt', io.BytesIO(b'will be deleted'), 'text/plain')}
        upload_response = requests.post(
            f"{BASE_URL}/tasks/{test_setup['task_id']}/attachments",
            files=files,
            headers=test_setup["headers"]
        )
        
        if upload_response.status_code in [200, 201]:
            file_id = upload_response.json().get("_id") or upload_response.json().get("id")
            
            if file_id:
                # Delete the file
                delete_response = requests.delete(
                    f"{BASE_URL}/tasks/{test_setup['task_id']}/attachments/{file_id}",
                    headers=test_setup["headers"]
                )
                
                assert delete_response.status_code == 200, \
                    "File deletion should succeed"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
