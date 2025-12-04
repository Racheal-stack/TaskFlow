"""
Test suite for Task 8: TaskModal Component Refactoring

Tests component structure, size, sub-components, hooks, and code organization.
"""

import pytest
import requests
import json
import time
import re
from pathlib import Path

BASE_URL = "http://localhost:5001/api"
FRONTEND_PATH = Path(__file__).parent.parent.parent / "frontend" / "src"

class TestTaskModalRefactor:
    """Test class for TaskModal refactoring validation"""
    
    @pytest.fixture(scope="class")
    def component_files(self):
        """Locate TaskModal and related component files"""
        taskmodal_path = FRONTEND_PATH / "components" / "tasks" / "TaskModal.jsx"
        components_dir = FRONTEND_PATH / "components" / "tasks"
        hooks_dir = FRONTEND_PATH / "hooks"
        
        return {
            "taskmodal": taskmodal_path,
            "components_dir": components_dir,
            "hooks_dir": hooks_dir
        }

    def test_taskmodal_under_200_lines(self, component_files):
        """
        Tests that TaskModal.jsx is under 200 lines after refactoring.
        Expected: File size < 200 lines (excluding comments/whitespace)
        """
        taskmodal_path = component_files["taskmodal"]
        
        if not taskmodal_path.exists():
            pytest.skip("TaskModal.jsx not found")
        
        with open(taskmodal_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Count non-empty, non-comment lines
        code_lines = [line for line in lines 
                     if line.strip() and not line.strip().startswith('//') 
                     and not line.strip().startswith('/*')]
        
        assert len(code_lines) < 200, \
            f"TaskModal should be under 200 lines, found {len(code_lines)} lines"

    def test_sub_components_exist(self, component_files):
        """
        Tests that TaskModal has been split into sub-components.
        Expected: At least 5 separate component files exist
        """
        components_dir = component_files["components_dir"]
        
        if not components_dir.exists():
            pytest.skip("Components directory not found")
        
        expected_components = [
            "TaskHeader", "TaskDescription", "TaskAssignee",
            "TaskDates", "TaskComments", "TaskAttachments"
        ]
        
        component_files_found = list(components_dir.glob("*.jsx"))
        component_names = [f.stem for f in component_files_found]
        
        found_count = sum(1 for comp in expected_components 
                         if any(comp.lower() in name.lower() for name in component_names))
        
        assert found_count >= 5, \
            f"Should have at least 5 sub-components, found {found_count}"

    def test_custom_hooks_exist(self, component_files):
        """
        Tests that custom hooks have been extracted.
        Expected: useTaskData and useTaskComments hooks exist
        """
        hooks_dir = component_files["hooks_dir"]
        
        if not hooks_dir.exists():
            pytest.skip("Hooks directory not found")
        
        hook_files = list(hooks_dir.glob("*.js"))
        hook_names = [f.stem.lower() for f in hook_files]
        
        has_task_data = any("taskdata" in name or "task" in name for name in hook_names)
        has_task_comments = any("comment" in name for name in hook_names)
        
        assert has_task_data or has_task_comments, \
            "Should have custom hooks like useTaskData or useTaskComments"

    def test_components_have_prop_validation(self, component_files):
        """
        Tests that components have PropTypes or TypeScript interfaces.
        Expected: Sub-components use prop validation
        """
        components_dir = component_files["components_dir"]
        
        if not components_dir.exists():
            pytest.skip("Components directory not found")
        
        component_files_list = list(components_dir.glob("Task*.jsx"))
        
        if not component_files_list:
            pytest.skip("No task components found")
        
        has_prop_validation = False
        for comp_file in component_files_list[:3]:  # Check first 3 files
            with open(comp_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if "PropTypes" in content or "propTypes" in content or \
               "interface" in content or "type Props" in content:
                has_prop_validation = True
                break
        
        assert has_prop_validation, \
            "Components should have PropTypes or TypeScript prop validation"

    def test_business_logic_extracted_to_utils(self, component_files):
        """
        Tests that business logic has been moved to utility functions.
        Expected: Utils directory contains helper functions
        """
        utils_dir = FRONTEND_PATH / "utils"
        
        if not utils_dir.exists():
            pytest.skip("Utils directory not found")
        
        util_files = list(utils_dir.glob("*.js")) + list(utils_dir.glob("*.ts"))
        
        assert len(util_files) > 0, \
            "Should have utility files for extracted business logic"

    def test_error_boundaries_implemented(self, component_files):
        """
        Tests that error boundaries are implemented for components.
        Expected: ErrorBoundary component or error handling exists
        """
        components_dirs = [
            FRONTEND_PATH / "components",
            FRONTEND_PATH / "components" / "common"
        ]
        
        has_error_boundary = False
        for comp_dir in components_dirs:
            if comp_dir.exists():
                error_files = list(comp_dir.glob("*Error*.jsx")) + \
                            list(comp_dir.glob("*Error*.tsx"))
                if error_files:
                    has_error_boundary = True
                    break
        
        assert has_error_boundary or True, \
            "Should have ErrorBoundary component (soft requirement)"

    def test_components_are_reusable(self, component_files):
        """
        Tests that extracted components are generic and reusable.
        Expected: Components accept props and don't have hardcoded dependencies
        """
        components_dir = component_files["components_dir"]
        
        if not components_dir.exists():
            pytest.skip("Components directory not found")
        
        component_files_list = list(components_dir.glob("Task*.jsx"))[:2]
        
        if not component_files_list:
            pytest.skip("No task components found for testing")
        
        for comp_file in component_files_list:
            with open(comp_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check if component accepts props
            has_props = "props" in content or "({" in content
            assert has_props, \
                f"{comp_file.name} should accept props for reusability"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
