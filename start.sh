#!/bin/bash
# Start PG Studio services

echo "Starting PG Studio..."

# Start backend in background
node backend/proxy.js > /tmp/pgstudio-backend.log 2>&1 &
BACKEND_PID=$!
echo "✓ Backend started (PID: $BACKEND_PID)"

# Wait a moment for backend to initialize
sleep 2

# Start frontend in background
npm run dev > /tmp/pgstudio-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✓ Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "PG Studio is running:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend:  http://localhost:3001"
echo ""
echo "To stop: ./stop.sh"
