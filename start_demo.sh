#!/bin/bash
# Startup Script for NeuroTraffic SIH 2026 Showcase
# Launches FastAPI Backend (Port 8000) and React 3D Frontend (Port 5173)

set -e

echo "================================================================================"
echo "    STARTING NEUROTRAFFIC: 3D ANPR & URBAN TRAJECTORY ENGINE (SIH PS 26127)     "
echo "================================================================================"

# Get project directory
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# 1. Start FastAPI Backend
echo "[1/2] Starting FastAPI Backend on http://localhost:8000..."
./backend/.venv/bin/python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Trap to kill both processes on exit
cleanup() {
    echo -e "\nShutting down NeuroTraffic services..."
    kill $BACKEND_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 2. Start Vite Frontend
echo "[2/2] Starting React + Three.js 3D Frontend on http://localhost:5173..."
cd "$ROOT_DIR/frontend"
npm run dev -- --host 0.0.0.0 --port 5173

wait
