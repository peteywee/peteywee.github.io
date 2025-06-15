#!/bin/bash

# --- Script Configuration ---
FRONTEND_DIR="nexusmind-web-ui" # Name of your frontend project directory
PROJECT_ROOT="$(pwd)" # This script assumes you run it from ~/nexus_orchestrator_project/

echo "--- Starting NexusMind Frontend Setup Script ---"
echo "Running from: $PROJECT_ROOT"
echo "Frontend directory: $FRONTEND_DIR"

# --- Error Handling ---
set -e # Exit immediately if a command exits with a non-zero status

# --- 1. Navigate to Frontend Project Directory ---
echo ""
echo "1. Navigating to frontend project directory: $FRONTEND_DIR"
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "Error: Frontend directory '$FRONTEND_DIR' not found. Please ensure you are in the correct project root (~/nexus_orchestrator_project/)."
    exit 1
fi
cd "$FRONTEND_DIR"
echo "Current directory: $(pwd)"

# --- 2. Install npm Dependencies ---
echo ""
echo "2. Installing npm dependencies..."
npm install || { echo "npm install failed. Please check your npm/Node.js setup."; exit 1; }
npm install lucide-react || { echo "npm install lucide-react failed."; exit 1; }
npm install js-cookie @types/js-cookie || { echo "npm install js-cookie failed."; exit 1; }
# react-router-dom and its types should be handled by default Vite setup
# If errors persist on these, uncomment and add:
# npm install react-router-dom || { echo "npm install react-router-dom failed."; exit 1; }
# npm install --save-dev @types/react-router-dom || { echo "npm install @types/react-router-dom failed."; exit 1; }
echo "npm dependencies installed successfully."

# --- 3. Create Necessary Directories ---
echo ""
echo "3. Creating necessary directories..."
mkdir -p src/types
mkdir -p src/utils
mkdir -p src/hooks
mkdir -p src/components # Ensure this exists for new components
mkdir -p src/pages # Ensure this exists for new pages
echo "Directories created."

# --- 4. Create/Overwrite .env Files ---
echo ""
echo "4. Creating/Overwriting .env files..."
cat << 'EOF_DOT_ENV_DEV' > .env.development
