#!/bin/bash

# Define image details
IMAGE_NAME="ghcr.io/your-github-username/nexus-orchestrator" # Update with your actual GHCR path
TAG="latest" # Or a dynamic tag like $(git rev-parse --short HEAD)

echo "Building Docker image: ${IMAGE_NAME}:${TAG}"

# Build the Docker image
docker build -t ${IMAGE_NAME}:${TAG} -f Dockerfile .
if [ $? -ne 0 ]; then
    echo "Docker image build failed. Exiting."
    exit 1
fi
echo "Docker image built successfully."

# Authenticate to GHCR (if not already logged in)
echo "Logging into GitHub Container Registry..."
# Assumes your GITHUB_TOKEN environment variable is set
echo ${GITHUB_TOKEN} | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
if [ $? -ne 0 ]; then
    echo "Docker login to GHCR failed. Exiting."
    exit 1
fi
echo "Logged into GHCR."

# Push the Docker image
echo "Pushing Docker image to GHCR..."
docker push ${IMAGE_NAME}:${TAG}
if [ $? -ne 0 ]; then
    echo "Docker image push failed. Exiting."
    exit 1
fi
echo "Docker image pushed successfully."
