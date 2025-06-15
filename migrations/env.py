# migrations/env.py
from logging.config import fileConfig
import os
import sys

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# --- IMPORTANT: Add the project root to sys.path ---
# This makes the 'gpt_nexus' package discoverable when Alembic runs.
# Assuming your project structure is:
# nexus_orchestrator_project/
# ├── gpt-nexus/
# │   ├── __init__.py (make sure this file exists, even if empty)
# │   ├── config.py
# │   └── models.py
# └── migrations/
#     └── env.py
#     └── ...
# Get the absolute path to the directory containing this env.py
current_dir = os.path.dirname(os.path.abspath(__file__))
# Get the parent directory (which should be 'nexus_orchestrator_project')
project_root = os.path.join(current_dir, '..')
# Add the project root to the sys.path
sys.path.insert(0, project_root)

# --- Import your Base and settings ---
# Now, with project_root in sys.path, you should be able to import gpt_nexus
from gpt_nexus.models import Base
from gpt_nexus.config import settings

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.
    (No changes needed here for this issue)
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    configuration = config.get_section(config.config_ini_section)
    
    # Set the sqlalchemy.url from your settings
    db_url = settings.DATABASE_URL
    configuration["sqlalchemy.url"] = db_url

    print(f"Alembic attempting to connect to: {db_url}") # <-- NEW: Print the URL

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

