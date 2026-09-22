# Google Cloud Run Optimized Production Container
# NeuroTraffic C4ISR Intelligence Platform (FastAPI + OpenCV)

FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app \
    PORT=8080

WORKDIR /app

# Install minimal system dependencies for OpenCV headless & health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend code
COPY backend/ /app/backend/

EXPOSE 8080

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8080}/api/v1/anpr/health || exit 1

# Launch ASGI server with dynamic Cloud Run port
CMD exec uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1
