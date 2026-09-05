# ml_service/Dockerfile
FROM python:3.10-slim

# Set working directory
WORKDIR /app

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
COPY ml_model/ ./ml_model/

# Create model directory if required by the application
RUN mkdir -p /app/models

# Render exposes this port
EXPOSE 8000

# Start FastAPI
CMD ["python", "-m", "uvicorn", "ml_model.python_api:app", "--host", "0.0.0.0", "--port", "8000"]