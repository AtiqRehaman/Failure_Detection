# ml_service/Dockerfile
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies required by Python/ML packages
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies
COPY ml_service/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy ML model code
COPY ml_service/ml_model/ ./ml_model/

# Copy Python API from the Node backend project
COPY server/services/ ./services/

# Create model directory
RUN mkdir -p /app/models

# Render will route traffic to this port
EXPOSE 8000

# Start FastAPI with Uvicorn
CMD ["python", "-m", "uvicorn", "services.python_api:app", "--host", "0.0.0.0", "--port", "8000"]