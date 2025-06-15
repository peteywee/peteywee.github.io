#!/bin/bash

set -e

AGENT_NAMES=("gpt-agent-comms" "gpt-agent-ops-execution" "gpt-agent-strategy" "gpt-agent-research")
PROJECT_ROOT="nexus_orchestrator_project"
AGENTS_DIR="${PROJECT_ROOT}/agents"
CONFIG_CONTENT=$(cat <<EOF
name: default-agent
id: auto-generated
metadata:
  description: Example config for baked agents
EOF
)

AGENT_APP_CODE=$(cat <<'EOF'
import yaml
from pathlib import Path

config_path = Path(__file__).parent / "agent_config.yaml"
with open(config_path, "r") as f:
    config = yaml.safe_load(f)

print(f"[BOOT] Loaded config: {config}")
EOF
)

DOCKERFILE_CONTENT=$(cat <<'EOF'
FROM python:3.11-slim

WORKDIR /app
COPY agent_app.py .
COPY agent_config.yaml .

RUN pip install --no-cache-dir pyyaml

CMD ["python", "agent_app.py"]
EOF
)

echo "[INFO] Scaffolding agent services..."

mkdir -p "$AGENTS_DIR"

for AGENT in "${AGENT_NAMES[@]}"; do
  AGENT_PATH="${AGENTS_DIR}/${AGENT}"
  mkdir -p "$AGENT_PATH"

  echo "$CONFIG_CONTENT" > "${AGENT_PATH}/agent_config.yaml"
  echo "$AGENT_APP_CODE" > "${AGENT_PATH}/agent_app.py"
  echo "$DOCKERFILE_CONTENT" > "${AGENT_PATH}/Dockerfile"

  echo "[✓] Created $AGENT_PATH"
done

COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.yml"

echo "[INFO] Injecting agents into docker-compose.yml..."

for AGENT in "${AGENT_NAMES[@]}"; do
cat <<EOF >> "$COMPOSE_FILE"

  ${AGENT}:
    build:
      context: ./agents/${AGENT}
    container_name: nexus_orchestrator_project_${AGENT}
EOF
done

echo "[✓] All agents added to docker-compose.yml"
