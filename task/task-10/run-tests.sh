#!/bin/bash

# Test runner for Task 10
# This script sets up the environment and runs the test suite

set -e

echo "========================================="
echo "Task 10 Tests"
echo "========================================="

# Navigate to repository root
cd ../..

# Check if docker-compose is running
if ! docker-compose ps | grep -q "Up"; then
    echo "Starting TaskFlow services with docker-compose..."
    docker-compose up -d
    echo "Waiting for services to be ready..."
    sleep 15
fi

# Install Python test dependencies if not already installed
if ! python3 -m pip show pytest > /dev/null 2>&1; then
    echo "Installing test dependencies..."
    python3 -m pip install pytest requests python-socketio
fi

# Run the tests
echo "Running tests for Task 10..."
python3 -m pytest task/task-10/task_tests.py -v --tb=short

# Capture test result
TEST_RESULT=$?

echo "========================================="
if [ $TEST_RESULT -eq 0 ]; then
    echo "✓ All tests passed for Task 10"
else
    echo "✗ Some tests failed for Task 10"
fi
echo "========================================="

exit $TEST_RESULT
