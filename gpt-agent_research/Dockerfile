# gpt-agent_research/Dockerfile
FROM python:3.9-slim-buster
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
COPY mock_data/ /app/mock_data/
CMD ["python", "agent_app.py"]