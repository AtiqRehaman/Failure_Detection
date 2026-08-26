# server/ml_service/Dockerfile
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Python scripts
COPY ml_model/ ./ml_model/
COPY services/ ./services/

# Create directory for models
RUN mkdir -p /app/models

# Expose port for API
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python -c "import sys; sys.exit(0)" || exit 1

# Run the Python API server
CMD ["python", "-m", "uvicorn", "services.python_api:app", "--host", "0.0.0.0", "--port", "8000"]