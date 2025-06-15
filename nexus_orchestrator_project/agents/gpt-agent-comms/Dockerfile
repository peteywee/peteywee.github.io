FROM python:3.11-slim

WORKDIR /app
COPY agent_app.py .
COPY agent_config.yaml .

RUN pip install --no-cache-dir pyyaml

CMD ["python", "agent_app.py"]
