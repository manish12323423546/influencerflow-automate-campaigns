#!/bin/bash

# Marketing Campaign Report Client Runner
# This script helps run the campaign report client with proper environment setup

set -e  # Exit on any error

echo "📊 Marketing Campaign Report Client"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Check if we're in the right directory
if [[ ! -f "ai_agents.py" ]]; then
    print_error "ai_agents.py not found. Please run this script from the api directory."
    exit 1
fi

# Check if Python is available
PYTHON_CMD=""
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    print_status "Found python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
    print_status "Found python"
else
    print_error "Python not found. Please install Python 3.7+"
    exit 1
fi

# Check Python version
python_version=$($PYTHON_CMD --version 2>&1 | cut -d' ' -f2)
print_info "Using Python $python_version"

# Check if virtual environment exists and activate it
if [[ -d "venv" ]]; then
    print_info "Activating virtual environment..."
    source venv/bin/activate
    print_status "Virtual environment activated"
else
    print_warning "No virtual environment found. Using system Python."
    print_info "To create one: python3 -m venv venv && source venv/bin/activate"
fi

# Install required packages if needed
print_info "Checking required packages..."
$PYTHON_CMD -c "import requests" 2>/dev/null || {
    print_warning "Installing requests package..."
    pip install requests
}

# Check if AI Agents API is running
print_info "Checking if AI Agents API is running..."
if curl -s http://localhost:8000/health >/dev/null 2>&1; then
    print_status "AI Agents API is running on port 8000"
else
    print_warning "AI Agents API not detected on port 8000"
    echo ""
    echo "To start the API, run in another terminal:"
    echo "  cd $(pwd)"
    echo "  $PYTHON_CMD ai_agents.py"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Exiting. Start the API first."
        exit 0
    fi
fi

# Choose which client to run
echo ""
echo "Choose campaign report client:"
echo "1. Simple client (recommended)"
echo "2. Full-featured client"
echo ""
read -p "Enter choice (1 or 2, default=1): " choice

case $choice in
    2)
        print_info "Running full-featured campaign report client..."
        $PYTHON_CMD campaign_report_client.py
        ;;
    *)
        print_info "Running simple campaign report client..."
        $PYTHON_CMD simple_campaign_report.py
        ;;
esac

print_status "Campaign report client execution completed!" 