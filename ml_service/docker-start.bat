@echo off
echo ============================================================
echo Starting Senken Python ML Service (Docker)
echo ============================================================
echo.

REM Check if Docker is running
docker info > nul 2>&1
if errorlevel 1 (
    echo Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo Docker is running

REM Create models directory if not exists
if not exist ".\models" mkdir models
echo Models directory: .\models

REM Build and start the container
echo  Building Docker image...
docker compose build

echo  Starting Docker container...
docker compose up -d

echo.
echo  Python ML Service is running!
echo  API: http://localhost:8001
echo  Health: http://localhost:8001/health
echo.
echo To stop: docker compose down
pause