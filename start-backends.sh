#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"

if [ ! -d "$ROOT/AI_BACKEND/.venv" ]; then
  python3 -m venv "$ROOT/AI_BACKEND/.venv"
fi

source "$ROOT/AI_BACKEND/.venv/bin/activate"
pip install -r "$ROOT/AI_BACKEND/requirements.txt"

echo "Starting FraudShield AI on :8000..."
python -m uvicorn main:app --host 127.0.0.1 --port 8000 &
AI_PID=$!

trap 'kill "$AI_PID" 2>/dev/null || true' EXIT

cd "$ROOT"
echo "Starting FraudShield Node/JWT API on :5050..."
node server.js &
NODE_PID=$!

trap 'kill "$AI_PID" "$NODE_PID" 2>/dev/null || true' EXIT

echo "Start the frontend separately with: npm run dev"
wait "$NODE_PID"
