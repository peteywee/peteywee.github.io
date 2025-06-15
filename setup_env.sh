#!/bin/bash

echo "Setting up Python environment..."

# Create a virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Virtual environment created."
fi

# Activate the virtual environment
source venv/bin/activate
echo "Virtual environment activated."

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Failed to install Python dependencies. Exiting."
    exit 1
fi
echo "Python dependencies installed."

# Deactivate the virtual environment (optional, depending on usage)
# deactivate
