# ml_service/Dockerfile
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Defaults shared by local Docker and Render; deployment environments may override them.
ENV PYTHONUNBUFFERED=1 \
    ML_MODEL_DIR=/app/ml_model

# Install system dependencies required by ML packages
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy ML application and model files
COPY python_api.py ./python_api.py
COPY ml_model/ ./ml_model/

# Create model directory if required by the application
RUN mkdir -p /app/models

# Render provides PORT at runtime; keep 8000 as the local/default port.
EXPOSE 8000

# Start FastAPI
CMD ["sh", "-c", "exec python -m uvicorn python_api:app --host 0.0.0.0 --port ${PORT:-8000}"]