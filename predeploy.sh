#!/bin/bash

# --- Database Migrations ---
echo "Running database migrations..."
# Assuming you've configured alembic.ini to point to your database URL
# and your environment variables (like DATABASE_URL) are set.
alembic upgrade head
if [ $? -ne 0 ]; then
    echo "Database migration failed. Exiting."
    exit 1
fi
echo "Database migrations completed successfully."
