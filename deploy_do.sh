#!/bin/bash

# Configuration for your DigitalOcean Droplet
DO_USER="root" # Or your deploy user
DO_HOST="your_droplet_ip_or_hostname" # e.g., topshelfservicepros.com or nexusmind.topshelfservicepros.com
APP_DIR="/opt/nexus-orchestrator" # Directory on your droplet where code/docker-compose is

echo "Deploying to DigitalOcean droplet ${DO_HOST}..."

# SSH into the droplet and execute deployment commands
ssh ${DO_USER}@${DO_HOST} "
    echo 'Pulling latest Docker images...'
    cd ${APP_DIR} && docker compose pull
    if [ \$? -ne 0 ]; then
        echo 'Docker compose pull failed.'
        exit 1
    fi

    echo 'Running database migrations...'
    # Assumes alembic is installed and configured on the droplet
    # You might need to specify the path to alembic.ini if not in CWD
    docker compose run --rm nexus alembic upgrade head
    if [ \$? -ne 0 ]; then
        echo 'Database migrations failed.'
        exit 1
    fi

    echo 'Restarting services with Docker Compose...'
    docker compose up -d --remove-orphans
    if [ \$? -ne 0 ]; then
        echo 'Docker compose up failed.'
        exit 1
    fi
    echo 'Deployment completed successfully!'
"
if [ $? -ne 0 ]; then
    echo "SSH deployment script failed."
    exit 1
fi

echo "Remote deployment initiated. Check droplet logs for details."
