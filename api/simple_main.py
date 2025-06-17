#!/usr/bin/env python3
"""
Simplified AI Agents FastAPI Backend

This provides all the AI agent API functionality with mock implementations
while we resolve the LangGraph dependencies.
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Literal
import asyncio
import json
import uuid
import time
from datetime import datetime
from contextlib import asynccontextmanager

# Mock implementations of LangGraph functions
def mock_safe_invoke_graph(*args, **kwargs):
    return {
        "status": "completed",
        "message": "Mock agent execution completed",
        "result": {"success": True, "data": "Mock result"}
    }

def mock_safe_stream_graph(*args, **kwargs):
    """Mock streaming execution that yields progress updates"""
    steps = [
        {"step": "initialization", "progress": 10},
        {"step": "analysis", "progress": 30},
        {"step": "execution", "progress": 60},
        {"step": "review", "progress": 80},
        {"step": "completion", "progress": 100}
    ]
    for step in steps:
        yield {step["step"]: step}
        time.sleep(0.5)  # Simulate processing time

def mock_get_current_approval_request(thread_id: str):
    return None

def mock_resume_graph_execution(thread_id: str, approval_data: dict):
    return {"status": "completed", "message": "Mock resume completed"}

# Global connection manager for WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.task_connections: Dict[str, List[str]] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        print(f"🔌 WebSocket connected: {client_id}")

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        for task_id, clients in self.task_connections.items():
            if client_id in clients:
                clients.remove(client_id)
        print(f"🔌 WebSocket disconnected: {client_id}")

    async def send_message(self, client_id: str, message: dict):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_text(json.dumps(message))
            except Exception as e:
                print(f"❌ Failed to send message to {client_id}: {e}")
                self.disconnect(client_id)

    async def broadcast_to_task(self, task_id: str, message: dict):
        if task_id in self.task_connections:
            for client_id in self.task_connections[task_id].copy():
                await self.send_message(client_id, message)

    def subscribe_to_task(self, client_id: str, task_id: str):
        if task_id not in self.task_connections:
            self.task_connections[task_id] = []
        if client_id not in self.task_connections[task_id]:
            self.task_connections[task_id].append(client_id)

# Global instances
manager = ConnectionManager()
active_tasks: Dict[str, Dict] = {}
task_results: Dict[str, Dict] = {}

# Pydantic models
class AgentQuery(BaseModel):
    query: str = Field(..., description="The user's query or task description")
    agent_type: Optional[str] = Field(None, description="Specific agent to use")
    mode: Literal["campaign", "chat"] = Field("campaign", description="Execution mode")
    recipient_email: Optional[str] = Field(None, description="Email for notifications")
    phone_number: Optional[str] = Field(None, description="Phone number")
    priority: Literal["low", "medium", "high"] = Field("medium", description="Task priority")
    requires_approval: bool = Field(True, description="Whether human approval is required")

class ApprovalRequest(BaseModel):
    task_id: str
    approval_type: Literal["strategy", "content", "contract", "email_send"]
    approved: bool
    feedback: Optional[str] = None

class TaskStatus(BaseModel):
    task_id: str
    status: Literal["queued", "running", "paused", "completed", "failed", "cancelled"]
    progress: float = Field(0.0, ge=0.0, le=100.0)
    current_step: Optional[str] = None
    message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    result: Optional[Dict[str, Any]] = None
    approval_required: bool = False
    approval_type: Optional[str] = None
    query: Optional[str] = None
    agent_type: Optional[str] = None

# FastAPI app
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting AI Agents API (Simplified Mode)...")
    yield
    print("🛑 Shutting down AI Agents API...")

app = FastAPI(
    title="InfluencerFlow AI Agents API (Simplified)",
    description="Simplified AI agent system for testing",
    version="1.0.0-simplified",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket endpoint
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "subscribe_task":
                task_id = message.get("task_id")
                if task_id:
                    manager.subscribe_to_task(client_id, task_id)
                    await manager.send_message(client_id, {
                        "type": "subscription_confirmed",
                        "task_id": task_id
                    })
    except WebSocketDisconnect:
        manager.disconnect(client_id)

# Agent execution endpoint
@app.post("/agents/execute", response_model=dict)
async def execute_agent(query: AgentQuery, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    
    task_info = {
        "task_id": task_id,
        "query": query.query,
        "agent_type": query.agent_type,
        "mode": query.mode,
        "status": "queued",
        "progress": 0.0,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "requires_approval": query.requires_approval,
        "priority": query.priority
    }
    
    active_tasks[task_id] = task_info
    background_tasks.add_task(run_mock_agent_task, task_id, query)
    
    return {
        "task_id": task_id,
        "status": "queued",
        "message": "Agent execution started (mock mode)"
    }

async def run_mock_agent_task(task_id: str, query: AgentQuery):
    """Mock agent task that simulates real execution"""
    try:
        # Simulate agent execution with progress updates
        steps = [
            {"progress": 10, "message": "Initializing AI agent..."},
            {"progress": 25, "message": "Analyzing query requirements..."},
            {"progress": 40, "message": "Processing campaign strategy..."},
            {"progress": 60, "message": "Generating content..."},
            {"progress": 75, "message": "Reviewing outputs..."},
            {"progress": 90, "message": "Finalizing results..."},
            {"progress": 100, "message": "Agent execution completed"}
        ]
        
        for step in steps:
            await update_task_status(task_id, "running", step["progress"], step["message"])
            await asyncio.sleep(1)  # Simulate processing time
            
            # Simulate approval requirement at 75% if enabled
            if step["progress"] == 75 and query.requires_approval:
                await handle_mock_approval_request(task_id)
                return  # Task will be resumed after approval
        
        # Mark as completed
        await update_task_status(task_id, "completed", 100.0, "Agent execution completed")
        
        # Store mock result
        mock_result = {
            "success": True,
            "agent_type": query.agent_type or "auto-selected",
            "query": query.query,
            "result": {
                "campaign_name": "Mock Campaign",
                "strategy": "Generated strategy based on query",
                "content": ["Mock content 1", "Mock content 2"],
                "metrics": {"estimated_reach": 10000, "estimated_engagement": 850}
            }
        }
        
        task_results[task_id] = mock_result
        active_tasks[task_id]["result"] = mock_result
        
    except Exception as e:
        print(f"❌ Mock agent execution error: {e}")
        await update_task_status(task_id, "failed", 0.0, f"Execution failed: {str(e)}")

async def update_task_status(task_id: str, status: str, progress: float, message: str):
    if task_id in active_tasks:
        active_tasks[task_id].update({
            "status": status,
            "progress": progress,
            "current_step": message,
            "updated_at": datetime.now()
        })
        
        update_message = {
            "type": "task_update",
            "task_id": task_id,
            "status": status,
            "progress": progress,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        
        await manager.broadcast_to_task(task_id, update_message)

async def handle_mock_approval_request(task_id: str):
    """Simulate approval request"""
    approval_type = "content"
    
    await update_task_status(task_id, "paused", 75.0, f"Waiting for {approval_type} approval")
    
    if task_id in active_tasks:
        active_tasks[task_id]["approval_required"] = True
        active_tasks[task_id]["approval_type"] = approval_type
    
    approval_message = {
        "type": "approval_request",
        "task_id": task_id,
        "approval_type": approval_type,
        "message": f"{approval_type} approval required for mock task",
        "data": {"content": "Mock content requiring approval"},
        "timestamp": datetime.now().isoformat()
    }
    
    await manager.broadcast_to_task(task_id, approval_message)

# Task management endpoints
@app.get("/tasks", response_model=List[TaskStatus])
async def get_all_tasks():
    tasks = []
    for task_id, task_info in active_tasks.items():
        tasks.append(TaskStatus(
            task_id=task_id,
            status=task_info["status"],
            progress=task_info.get("progress", 0.0),
            current_step=task_info.get("current_step"),
            message=task_info.get("message"),
            created_at=task_info["created_at"],
            updated_at=task_info["updated_at"],
            result=task_info.get("result"),
            approval_required=task_info.get("approval_required", False),
            approval_type=task_info.get("approval_type"),
            query=task_info.get("query"),
            agent_type=task_info.get("agent_type")
        ))
    
    return sorted(tasks, key=lambda x: x.updated_at, reverse=True)

@app.get("/tasks/{task_id}", response_model=TaskStatus)
async def get_task(task_id: str):
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task_info = active_tasks[task_id]
    return TaskStatus(
        task_id=task_id,
        status=task_info["status"],
        progress=task_info.get("progress", 0.0),
        current_step=task_info.get("current_step"),
        message=task_info.get("message"),
        created_at=task_info["created_at"],
        updated_at=task_info["updated_at"],
        result=task_info.get("result"),
        approval_required=task_info.get("approval_required", False),
        approval_type=task_info.get("approval_type"),
        query=task_info.get("query"),
        agent_type=task_info.get("agent_type")
    )

@app.post("/tasks/{task_id}/approve")
async def approve_task(task_id: str, approval: ApprovalRequest):
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task_info = active_tasks[task_id]
    if task_info["status"] != "paused" or not task_info.get("approval_required"):
        raise HTTPException(status_code=400, detail="Task is not waiting for approval")
    
    # Update task status
    active_tasks[task_id]["approval_required"] = False
    active_tasks[task_id]["approval_type"] = None
    
    if approval.approved:
        # Continue with final steps
        await update_task_status(task_id, "running", 90.0, "Approved - finalizing...")
        await asyncio.sleep(2)
        await update_task_status(task_id, "completed", 100.0, "Task completed after approval")
        
        # Add mock result
        mock_result = {
            "success": True,
            "approved": True,
            "feedback": approval.feedback,
            "final_result": "Task completed successfully after human approval"
        }
        task_results[task_id] = mock_result
        active_tasks[task_id]["result"] = mock_result
    else:
        await update_task_status(task_id, "failed", 0.0, "Task rejected by human reviewer")
    
    return {"message": f"Task {'approved' if approval.approved else 'rejected'} successfully"}

@app.post("/tasks/{task_id}/cancel")
async def cancel_task(task_id: str):
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    await update_task_status(task_id, "cancelled", 0.0, "Task cancelled by user")
    return {"message": "Task cancelled successfully"}

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    if task_id in active_tasks:
        del active_tasks[task_id]
    if task_id in task_results:
        del task_results[task_id]
    return {"message": "Task deleted successfully"}

# Available agents endpoint
@app.get("/agents/available", response_model=List[dict])
async def get_available_agents():
    agents = [
        {
            "name": "Campaign Agent",
            "id": "campaign",
            "description": "Create, manage, and analyze marketing campaigns",
            "capabilities": ["campaign_creation", "campaign_analysis", "budget_optimization"]
        },
        {
            "name": "Discover Agent", 
            "id": "discover",
            "description": "Find and analyze influencers for campaigns",
            "capabilities": ["influencer_search", "audience_analysis", "engagement_metrics"]
        },
        {
            "name": "Content Agent",
            "id": "content", 
            "description": "Generate and optimize content for campaigns",
            "capabilities": ["content_creation", "copywriting", "content_optimization"]
        },
        {
            "name": "Contract Agent",
            "id": "contract",
            "description": "Draft and manage influencer contracts",
            "capabilities": ["contract_drafting", "legal_review", "terms_negotiation"]
        },
        {
            "name": "Gmail Agent",
            "id": "gmail",
            "description": "Automate email communications",
            "capabilities": ["email_automation", "follow_up_sequences", "response_handling"]
        },
        {
            "name": "Report Agent",
            "id": "report",
            "description": "Generate comprehensive campaign reports",
            "capabilities": ["performance_analysis", "roi_calculation", "data_visualization"]
        }
    ]
    return agents

# Workflow visualization endpoint
@app.get("/workflows/graph/{task_id}")
async def get_workflow_graph(task_id: str):
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    workflow_graph = {
        "nodes": [
            {"id": "start", "label": "Start", "type": "start"},
            {"id": "analysis", "label": "Query Analysis", "type": "agent"},
            {"id": "strategy", "label": "Strategy Generation", "type": "agent"},
            {"id": "content", "label": "Content Creation", "type": "agent"},
            {"id": "review", "label": "Human Review", "type": "approval"},
            {"id": "finalize", "label": "Finalization", "type": "agent"},
            {"id": "end", "label": "Complete", "type": "end"}
        ],
        "edges": [
            {"from": "start", "to": "analysis"},
            {"from": "analysis", "to": "strategy"},
            {"from": "strategy", "to": "content"},
            {"from": "content", "to": "review"},
            {"from": "review", "to": "finalize"},
            {"from": "finalize", "to": "end"}
        ],
        "current_node": "content",  # Mock current position
        "status": active_tasks[task_id]["status"]
    }
    
    return workflow_graph

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "mode": "simplified",
        "timestamp": datetime.now().isoformat(),
        "active_tasks": len(active_tasks),
        "connected_clients": len(manager.active_connections)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 