import yaml
from pathlib import Path

config_path = Path(__file__).parent / "agent_config.yaml"
with open(config_path, "r") as f:
    config = yaml.safe_load(f)

print(f"[BOOT] Loaded config: {config}")
