#!/bin/bash

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if Python virtual environment exists
check_venv() {
    if [ ! -d "venv" ]; then
        echo "Creating Python virtual environment..."
        python3 -m venv venv
    fi
}

# Function to activate virtual environment
activate_venv() {
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
    elif [ -f "venv/Scripts/activate" ]; then
        source venv/Scripts/activate
    else
        echo "Error: Could not find virtual environment activation script"
        exit 1
    fi
}

# Function to install Python dependencies
install_dependencies() {
    echo "Installing Python dependencies..."
    pip install -r requirements.txt
}

# Function to start the LangGraph server
start_langgraph_server() {
    echo "Starting LangGraph server..."
    python langgraph_server.py &
    LANGGRAPH_PID=$!
    echo "LangGraph server started with PID: $LANGGRAPH_PID"
}

# Function to start CopilotKit tunnel
start_copilot_tunnel() {
    echo "Starting CopilotKit tunnel..."
    if ! command_exists npx; then
        echo "Error: npx not found. Please install Node.js and npm first."
        exit 1
    fi
    
    # Check if user is logged in to CopilotKit
    if ! npx copilotkit@latest whoami &>/dev/null; then
        echo "Please log in to CopilotKit first by running: npx copilotkit@latest login"
        exit 1
    fi
    
    npx copilotkit@latest dev --port 8000 &
    COPILOT_PID=$!
    echo "CopilotKit tunnel started with PID: $COPILOT_PID"
}

# Function to handle script termination
cleanup() {
    echo "Shutting down servers..."
    if [ ! -z "$LANGGRAPH_PID" ]; then
        kill $LANGGRAPH_PID
    fi
    if [ ! -z "$COPILOT_PID" ]; then
        kill $COPILOT_PID
    fi
    exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

# Main execution
echo "Setting up LangGraph server with CopilotKit..."

# Check and setup Python environment
check_venv
activate_venv
install_dependencies

# Start servers
start_langgraph_server
start_copilot_tunnel

# Keep script running
echo "Servers are running. Press Ctrl+C to stop."
wait 