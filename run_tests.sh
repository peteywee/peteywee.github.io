#!/bin/bash

echo "Running Nexus Orchestrator tests..."

# Activate virtual environment
source venv/bin/activate

# Run pytest (assuming your tests are in a 'tests/' directory)
pytest tests/
if [ $? -ne 0 ]; then
    echo "Tests failed!"
    exit 1
fi

echo "All tests passed successfully."

# Deactivate virtual environment
deactivate
