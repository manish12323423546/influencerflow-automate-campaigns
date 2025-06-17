#!/usr/bin/env python3
"""
FastAPI Server Startup Script

This script starts the AI Agents FastAPI server with proper configuration.
"""

import os
import sys
import uvicorn
from pathlib import Path

# Add the current directory to Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

# Add the langgraph-example-1 directory to Python path
langgraph_path = current_dir.parent / "langgraph-example-1"
if langgraph_path.exists():
    sys.path.insert(0, str(langgraph_path))
    print(f"✅ Added LangGraph path: {langgraph_path}")
else:
    print(f"⚠️ LangGraph path not found: {langgraph_path}")

def main():
    """Main function to start the server."""
    print("🚀 Starting InfluencerFlow AI Agents API...")
    print("=" * 50)
    
    # Environment variables
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8001"))
    reload = os.getenv("RELOAD", "true").lower() == "true"
    
    print(f"🌐 Host: {host}")
    print(f"🔌 Port: {port}")
    print(f"🔄 Reload: {reload}")
    print("=" * 50)
    
    try:
        # Import the app after setting up paths
        from main import app
        
        # Start the server
        uvicorn.run(
            app,
            host=host,
            port=port,
            reload=reload,
            log_level="info",
            access_log=True
        )
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 