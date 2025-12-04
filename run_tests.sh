#!/bin/bash

# TaskFlow Test Runner
# Usage: ./run_tests.sh [task-id]
# Example: ./run_tests.sh task-1

set -e

TASK_ID=$1

if [ -z "$TASK_ID" ]; then
    echo "Error: Task ID is required"
    echo "Usage: ./run_tests.sh [task-id]"
    echo "Example: ./run_tests.sh task-1"
    exit 1
fi

TASK_DIR="task/${TASK_ID}"

if [ ! -d "$TASK_DIR" ]; then
    echo "Error: Task directory '${TASK_DIR}' not found"
    exit 1
fi

echo "========================================="
echo "Running tests for ${TASK_ID}"
echo "========================================="

# Check if task-specific run-tests.sh exists
if [ -f "${TASK_DIR}/run-tests.sh" ]; then
    echo "Using task-specific test runner..."
    cd "$TASK_DIR"
    chmod +x run-tests.sh
    ./run-tests.sh
else
    echo "Error: No run-tests.sh found in ${TASK_DIR}"
    exit 1
fi

echo "========================================="
echo "Tests completed for ${TASK_ID}"
echo "========================================="
