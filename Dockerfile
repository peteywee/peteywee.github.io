# Example Dockerfile (adjust as per your actual Dockerfile)
FROM python:3.9-slim-buster # Or your chosen base image

WORKDIR /app/gpt_nexus # <--- CHANGE THIS: from /app/gpt-nexus to /app/gpt_nexus

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . . # This copies everything from the gpt_nexus directory into WORKDIR

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
