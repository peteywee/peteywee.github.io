# test_import.py
import os
import sys

# Get the absolute path to the project root (assuming this script is in the root)
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

print(f"Project root added to sys.path: {project_root}")
print(f"Current sys.path: {sys.path}")

try:
    from gpt_nexus.models import Base
    from gpt_nexus.config import settings
    print("\nSuccessfully imported Base and settings from gpt_nexus!")
    print(f"Database URL from config: {settings.DATABASE_URL}")
except ModuleNotFoundError as e:
    print(f"\nModuleNotFoundError: {e}")
    print("Failed to import gpt_nexus. This indicates a path or package structure issue.")
except Exception as e:
    print(f"\nAn unexpected error occurred during import: {e}")
