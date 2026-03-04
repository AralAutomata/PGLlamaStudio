#!/bin/bash
# Stop PG Studio services

echo "Stopping PG Studio..."

# Kill Next.js frontend
pkill -f "next dev" 2>/dev/null && echo "✓ Frontend stopped" || echo "- Frontend not running"

# Kill backend proxy
pkill -f "proxy.js" 2>/dev/null && echo "✓ Backend stopped" || echo "- Backend not running"

# Also kill any remaining node processes on ports 3000/3001
fuser -k 3000/tcp 2>/dev/null && echo "✓ Port 3000 freed" || true
fuser -k 3001/tcp 2>/dev/null && echo "✓ Port 3001 freed" || true

echo "Done!"
