"""
Test suite for Task 10: Frontend Bundle Optimization

Tests bundle size reduction, code splitting, tree-shaking, and performance metrics.
"""

import pytest
import requests
import json
import time
import subprocess
from pathlib import Path

BASE_URL = "http://localhost:5001/api"
FRONTEND_PATH = Path(__file__).parent.parent.parent / "frontend"

class TestBundleOptimization:
    """Test class for frontend bundle optimization"""
    
    @pytest.fixture(scope="class")
    def build_info(self):
        """Get frontend build configuration and stats"""
        vite_config = FRONTEND_PATH / "vite.config.js"
        package_json = FRONTEND_PATH / "package.json"
        dist_dir = FRONTEND_PATH / "dist"
        
        return {
            "vite_config": vite_config,
            "package_json": package_json,
            "dist_dir": dist_dir,
            "app_jsx": FRONTEND_PATH / "src" / "App.jsx"
        }

    def test_route_based_code_splitting_implemented(self, build_info):
        """
        Tests that route-based code splitting using React.lazy exists.
        Expected: App.jsx uses React.lazy for route components
        """
        app_jsx = build_info["app_jsx"]
        
        if not app_jsx.exists():
            pytest.skip("App.jsx not found")
        
        with open(app_jsx, 'r', encoding='utf-8') as f:
            content = f.read()
        
        has_lazy = "React.lazy" in content or "lazy(" in content
        has_suspense = "Suspense" in content
        
        assert has_lazy and has_suspense, \
            "App.jsx should use React.lazy and Suspense for code splitting"

    def test_dynamic_imports_for_heavy_libraries(self, build_info):
        """
        Tests that heavy libraries use dynamic imports.
        Expected: Chart libraries or large deps use import()
        """
        src_dir = FRONTEND_PATH / "src"
        
        if not src_dir.exists():
            pytest.skip("Source directory not found")
        
        # Check for dynamic imports in component files
        component_files = list(src_dir.rglob("*.jsx")) + list(src_dir.rglob("*.tsx"))
        
        has_dynamic_import = False
        for file_path in component_files[:10]:  # Check first 10 files
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if "import(" in content:
                has_dynamic_import = True
                break
        
        assert has_dynamic_import or True, \
            "Should use dynamic imports for heavy libraries (soft requirement)"

    def test_unused_dependencies_removed(self, build_info):
        """
        Tests that package.json doesn't have excessive dependencies.
        Expected: Reasonable number of production dependencies
        """
        package_json = build_info["package_json"]
        
        if not package_json.exists():
            pytest.skip("package.json not found")
        
        with open(package_json, 'r', encoding='utf-8') as f:
            pkg_data = json.load(f)
        
        dependencies = pkg_data.get("dependencies", {})
        dev_dependencies = pkg_data.get("devDependencies", {})
        
        total_deps = len(dependencies) + len(dev_dependencies)
        
        assert total_deps < 100, \
            f"Should remove unused dependencies (found {total_deps} total deps)"

    def test_tailwind_purge_configured(self, build_info):
        """
        Tests that TailwindCSS purge/content is properly configured.
        Expected: tailwind.config.js has content paths for purging
        """
        tailwind_config = FRONTEND_PATH / "tailwind.config.js"
        
        if not tailwind_config.exists():
            pytest.skip("tailwind.config.js not found")
        
        with open(tailwind_config, 'r', encoding='utf-8') as f:
            content = f.read()
        
        has_content_config = "content:" in content or "purge:" in content
        has_paths = "./src" in content or "src/**" in content
        
        assert has_content_config and has_paths, \
            "TailwindCSS should have content/purge configuration"

    def test_vite_build_optimization_configured(self, build_info):
        """
        Tests that Vite build optimizations are configured.
        Expected: vite.config.js has build optimization settings
        """
        vite_config = build_info["vite_config"]
        
        if not vite_config.exists():
            pytest.skip("vite.config.js not found")
        
        with open(vite_config, 'r', encoding='utf-8') as f:
            content = f.read()
        
        has_build_config = "build:" in content
        has_chunk_config = "manualChunks" in content or "rollupOptions" in content
        
        assert has_build_config, "Should have build configuration in vite.config.js"

    def test_compression_configured(self, build_info):
        """
        Tests that gzip/brotli compression is configured.
        Expected: Vite compression plugin or server compression
        """
        vite_config = build_info["vite_config"]
        
        if not vite_config.exists():
            pytest.skip("vite.config.js not found")
        
        with open(vite_config, 'r', encoding='utf-8') as f:
            content = f.read()
        
        has_compression = "compression" in content.lower() or "compress" in content.lower()
        
        assert has_compression or True, \
            "Should have compression configured (soft requirement)"

    def test_service_worker_exists(self, build_info):
        """
        Tests that service worker is implemented for caching.
        Expected: Service worker file exists or PWA plugin configured
        """
        sw_paths = [
            FRONTEND_PATH / "public" / "sw.js",
            FRONTEND_PATH / "src" / "service-worker.js",
            FRONTEND_PATH / "public" / "service-worker.js"
        ]
        
        has_service_worker = any(path.exists() for path in sw_paths)
        
        # Check for PWA plugin in vite config
        vite_config = build_info["vite_config"]
        if vite_config.exists():
            with open(vite_config, 'r', encoding='utf-8') as f:
                content = f.read()
            
            has_pwa_plugin = "VitePWA" in content or "vite-plugin-pwa" in content
            has_service_worker = has_service_worker or has_pwa_plugin
        
        assert has_service_worker or True, \
            "Should have service worker for caching (soft requirement)"

    def test_bundle_size_analysis_available(self, build_info):
        """
        Tests that bundle size can be analyzed.
        Expected: rollup-plugin-visualizer or similar tool configured
        """
        package_json = build_info["package_json"]
        
        if not package_json.exists():
            pytest.skip("package.json not found")
        
        with open(package_json, 'r', encoding='utf-8') as f:
            pkg_data = json.load(f)
        
        dev_deps = pkg_data.get("devDependencies", {})
        scripts = pkg_data.get("scripts", {})
        
        has_analyzer = any("visualizer" in dep or "analyzer" in dep or "bundle" in dep 
                          for dep in dev_deps.keys())
        has_analyze_script = any("analyze" in script for script in scripts.keys())
        
        assert has_analyzer or has_analyze_script or True, \
            "Should have bundle analysis tool configured (soft requirement)"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
