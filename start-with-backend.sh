#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting InfluencerFlow with LangGraph Backend${NC}"
echo "============================================="

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Check if backend directory exists
if [ ! -d "../langgraph-example" ]; then
    echo -e "${RED}❌ LangGraph backend directory not found at ../langgraph-example${NC}"
    echo "Please ensure the langgraph-example directory is in the same parent directory"
    exit 1
fi

# Start LangGraph backend
echo -e "${YELLOW}📡 Starting LangGraph Backend...${NC}"
cd ../langgraph-example

# Check if backend is already running
if check_port 8000; then
    echo -e "${GREEN}✅ Backend already running on port 8000${NC}"
else
    echo "Installing backend dependencies..."
    pip install -r requirements.txt 2>/dev/null || echo "Requirements installation skipped"
    
    echo "Starting backend server..."
    python main.py &
    BACKEND_PID=$!
    
    # Wait for backend to start
    echo "Waiting for backend to start..."
    for i in {1..30}; do
        if check_port 8000; then
            echo -e "${GREEN}✅ Backend started successfully on port 8000${NC}"
            break
        fi
        sleep 1
        echo -n "."
    done
    
    if ! check_port 8000; then
        echo -e "${RED}❌ Backend failed to start${NC}"
        exit 1
    fi
fi

# Return to frontend directory
cd ../influencerflow-automate-campaigns

# Start Frontend
echo -e "${YELLOW}🎨 Starting Frontend...${NC}"

# Check if frontend is already running
if check_port 5173; then
    echo -e "${GREEN}✅ Frontend already running on port 5173${NC}"
else
    echo "Installing frontend dependencies..."
    npm install
    
    echo "Starting frontend development server..."
    npm run dev &
    FRONTEND_PID=$!
    
    # Wait for frontend to start
    echo "Waiting for frontend to start..."
    for i in {1..30}; do
        if check_port 5173; then
            echo -e "${GREEN}✅ Frontend started successfully on port 5173${NC}"
            break
        fi
        sleep 1
        echo -n "."
    done
fi

echo ""
echo -e "${GREEN}🎉 Both services are running!${NC}"
echo "============================================="
echo -e "${BLUE}Frontend:${NC} http://localhost:5173"
echo -e "${BLUE}Backend:${NC}  http://localhost:8000"
echo -e "${BLUE}Backend Health:${NC} http://localhost:8000/health"
echo -e "${BLUE}Backend Info:${NC} http://localhost:8000/info"
echo ""
echo -e "${YELLOW}💡 Navigate to the 'AI Agent' section in your dashboard to test the integration!${NC}"
echo ""
echo "Press Ctrl+C to stop all services..."

# Function to cleanup background processes
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping services...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    # Kill any remaining processes on the ports
    pkill -f "python main.py" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Services stopped${NC}"
    exit 0
}

# Set up trap to handle Ctrl+C
trap cleanup SIGINT SIGTERM

# Keep script running
wait 