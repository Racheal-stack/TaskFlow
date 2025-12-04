#!/bin/bash

# Test runner for Task 6
# This script sets up the environment and runs the test suite

set -e

echo "========================================="
echo "Task 6 Tests"
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
echo "Running tests for Task 6..."
python3 -m pytest task/task-6/task_tests.py -v --tb=short

# Capture test result
TEST_RESULT=$?

echo "========================================="
if [ $TEST_RESULT -eq 0 ]; then
    echo "✓ All tests passed for Task 6"
else
    echo "✗ Some tests failed for Task 6"
fi
echo "========================================="

exit $TEST_RESULT
