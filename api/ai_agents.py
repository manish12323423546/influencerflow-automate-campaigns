#!/usr/bin/env python3
"""
AI Agents FastAPI Backend - CEO-Centric Workflow

This module provides a comprehensive FastAPI backend that routes ALL user queries
through the CEO Orchestrator agent first. The CEO agent then decides which tasks
to execute and coordinates the entire workflow automatically.

Features:
- CEO-first workflow routing using the exact LangGraph test pattern
- Real-time agent execution with progress tracking
- Human-in-the-loop workflow management  
- WebSocket connections for live updates
- Task queuing and management
- Agent performance monitoring
"""

import sys
import os
from pathlib import Path

# Add the langgraph-example-1 directory to Python path
langgraph_path = Path(__file__).parent.parent / "langgraph-example-1"
sys.path.insert(0, str(langgraph_path))

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

# Import LangGraph agents - EXACT PATTERN FROM TEST FILES
try:
    # Import the complete working graph and utilities from langgraph-example-1
    from my_agent.agent import safe_invoke_graph, safe_stream_graph, start_campaign, graph
    from my_agent.utils.state import AgentState
    from langchain_core.messages import HumanMessage
    print("✅ Successfully imported LangGraph agents - CEO orchestration ready")
    LANGGRAPH_AVAILABLE = True
except ImportError as e:
    print(f"❌ Failed to import LangGraph agents: {e}")
    LANGGRAPH_AVAILABLE = False
    # Create mock functions for development
    def safe_invoke_graph(*args, **kwargs):
        return {"status": "mock", "message": "LangGraph not available", "campaign_complete": True}
    def safe_stream_graph(*args, **kwargs):
        yield {"ceo": {"status": "mock", "message": "LangGraph not available"}}
    def start_campaign(*args, **kwargs):
        return {"mode": "campaign", "status": "start", "query": args[0] if args else "test"}

# IMPORTANT: The agent.py has been modified to remove approval and review nodes
# The workflow now routes directly through the CEO agent without approval interruptions
# All agents connect directly back to the CEO agent for routing

# Global connection manager for WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.task_connections: Dict[str, List[str]] = {}  # task_id -> [client_ids]

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        print(f"🔌 WebSocket connected: {client_id}")

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        # Remove from task connections
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

# Pydantic models - Simplified for CEO-centric workflow
class CEOAgentQuery(BaseModel):
    query: str = Field(..., description="The user's task description - CEO will orchestrate the workflow")
    mode: Literal["campaign", "chat"] = Field("campaign", description="Execution mode")
    recipient_email: Optional[str] = Field("", description="Email for notifications")
    phone_number: Optional[str] = Field("", description="Phone number for notifications")
    priority: Literal["low", "medium", "high"] = Field("medium", description="Task priority")
    requires_approval: bool = Field(False, description="Whether human approval is required")
    testing_mode: bool = Field(True, description="Auto-approve all steps for testing (bypasses interruptions)")
    auto_approve_all: bool = Field(True, description="Automatically approve all workflow steps without interruption")

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
    orchestrated_by: str = Field(default="CEO Agent", description="Always orchestrated by CEO")

# FastAPI app with lifespan management
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting CEO-Centric AI Agents API...")
    print("👔 All workflows will be orchestrated by the CEO Agent")
    if LANGGRAPH_AVAILABLE:
        print("✅ LangGraph integration active - Full workflow execution available")
    else:
        print("⚠️ LangGraph not available - Mock mode active")
    yield
    print("🛑 Shutting down CEO-Centric AI Agents API...")

app = FastAPI(
    title="InfluencerFlow CEO-Centric AI Agents API",
    description="CEO agent orchestrates all workflows - complete campaign execution",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ WEBSOCKET ENDPOINTS ============

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time CEO agent communication."""
    await manager.connect(websocket, client_id)
    try:
        while True:
            # Keep connection alive and handle incoming messages
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

# ============ CEO AGENT EXECUTION ENDPOINTS ============

@app.post("/ceo/execute", response_model=dict)
async def execute_ceo_workflow(query: CEOAgentQuery, background_tasks: BackgroundTasks):
    """Execute workflow through CEO Agent orchestration - CEO decides everything."""
    task_id = str(uuid.uuid4())
    
    # Create task record
    task_info = {
        "task_id": task_id,
        "query": query.query,
        "mode": query.mode,
        "status": "queued",
        "progress": 0.0,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "requires_approval": query.requires_approval,
        "priority": query.priority,
        "orchestrated_by": "CEO Agent"
    }
    
    active_tasks[task_id] = task_info
    
    # Execute CEO workflow in background
    background_tasks.add_task(run_ceo_orchestrated_task, task_id, query)
    
    return {
        "task_id": task_id,
        "status": "queued",
        "message": "CEO Agent will orchestrate your complete workflow",
        "orchestrator": "CEO Agent"
    }

async def run_ceo_orchestrated_task(task_id: str, query: CEOAgentQuery):
    """
    Background task to run CEO-orchestrated workflow using EXACT pattern from test files.
    
    This follows the exact same pattern as:
    - test_blog_creation_workflow.py
    - test_call_scheduling_workflow.py  
    - test_campaign_report_workflow.py
    - test_complete_workflows.py
    
    NOTE: The agent.py has been modified to remove approval nodes and simplify the workflow.
    All routing now goes through the CEO agent directly.
    """
    try:
        await update_task_status(task_id, "running", 5.0, "CEO Agent analyzing request...")
        
        if not LANGGRAPH_AVAILABLE:
            await update_task_status(task_id, "failed", 0.0, "LangGraph not available - please install dependencies")
            return
        
        # ======= EXACT PATTERN FROM TEST FILES =======
        # Step 1: Use start_campaign() exactly like in the tests
        print(f"🚀 INITIALIZING WORKFLOW: {query.query}")
        print(f"📧 Recipient Email: {query.recipient_email}")
        print(f"📞 Phone Number: {query.phone_number}")
        
        # Use start_campaign() EXACTLY as in test files
        initial_state = start_campaign(
            query=query.query,
            recipient_email=query.recipient_email or "",
            phone_number=query.phone_number or ""
        )
        
        await update_task_status(task_id, "running", 10.0, "CEO Agent: Campaign state initialized")
        
        # Step 2: Create config exactly like in the tests
        config = {
            "recursion_limit": 50,
            "configurable": {"thread_id": task_id}
        }
        
        # ======= TESTING MODE CONFIGURATION (CRITICAL FIX) =======
        # Pass all testing flags inside the config, not the state,
        # to prevent them from being overwritten by the graph.
        if query.testing_mode or query.auto_approve_all:
            if "configurable" not in config:
                config["configurable"] = {}
            
            config["configurable"]["testing_mode"] = True
            config["configurable"]["auto_approve"] = True
            config["configurable"]["skip_interrupts"] = True
            config["configurable"]["strategy_approved"] = True
            config["configurable"]["content_approved"] = True
            config["configurable"]["contract_approved"] = True
            config["configurable"]["email_send_approved"] = True
            config["configurable"]["skip_human_approval"] = True
            
            # This is the correct way to compile without interrupts for a specific run
            config["interrupt_before"] = []
            
            print("🔧 TESTING CONFIG: Configured for no-interrupts execution with all approvals set in config")
        
        await update_task_status(task_id, "running", 15.0, "CEO Agent: Starting workflow execution...")
        
        # Step 3: Execute the workflow using safe_invoke_graph exactly like in tests
        try:
            print(f"🎯 EXECUTING CEO WORKFLOW with config: {config}")
            print(f"📋 Initial state keys: {list(initial_state.keys())}")
            
            # Stream updates for real-time progress
            current_progress = 20.0
            step_count = 0
            
            # Use safe_invoke_graph exactly like in the test files
            print("🚀 STARTING GRAPH: Recursion limit set to 50")
            if query.testing_mode:
                print("🔧 TESTING MODE: Interrupts bypassed for continuous execution")
            start_time = time.time()
            # CRITICAL: Use custom graph compilation for testing mode
            if query.testing_mode or query.auto_approve_all:
                # Import the custom graph compilation function
                from my_agent.agent import create_graph_with_config
                # Create graph without interrupts for testing mode
                test_graph = create_graph_with_config(interrupt_before=[])
                print("🔧 TESTING MODE: Using graph without interrupts")
                final_result = test_graph.invoke(initial_state, config)
            else:
                final_result = safe_invoke_graph(initial_state, config)
            execution_time = time.time() - start_time
            
            print(f"✅ CEO WORKFLOW COMPLETED in {execution_time:.2f} seconds")
            print(f"📊 Final Status: {final_result.get('status', 'unknown')}")
            print(f"🎯 Mode: {final_result.get('mode', 'unknown')}")
            
            # Update progress based on workflow completion
            await update_task_status(task_id, "running", 90.0, "CEO Agent: Workflow execution completed")
            
            # Analyze results exactly like in test files
            campaign_completed = (
                final_result.get("campaign_complete") or 
                final_result.get("status") == "completed" or
                final_result.get("email_sent") or
                final_result.get("call_result") or
                bool(final_result.get("report")) or
                len(final_result.get("completed_tasks", [])) > 0 or
                len(final_result.get("task_list", [])) > 0
            )
            
            # Create comprehensive summary like in test files
            agents_executed = []
            workflow_data = {}
            
            # Analyze what was executed (same pattern as test files)
            if final_result.get("lead_info"):
                agents_executed.append("Discovery Agent")
                workflow_data["discovery"] = final_result["lead_info"][:100] + "..." if len(final_result["lead_info"]) > 100 else final_result["lead_info"]
                
            if final_result.get("email_content"):
                agents_executed.append("Content Agent")
                workflow_data["content"] = final_result["email_content"][:100] + "..." if len(final_result["email_content"]) > 100 else final_result["email_content"]
                
            if final_result.get("contract_doc") or final_result.get("contract_prepared"):
                agents_executed.append("Contract Agent")
                workflow_data["contract"] = "Contract prepared"
                
            if final_result.get("email_sent"):
                agents_executed.append("Gmail Agent")
                workflow_data["email"] = "Email sent successfully"
                
            if final_result.get("call_result"):
                agents_executed.append("Call Automation Agent")
                workflow_data["call"] = final_result["call_result"]
                
            if final_result.get("report"):
                agents_executed.append("Report Agent")
                workflow_data["report"] = "Report generated"
                
            if final_result.get("campaign_results"):
                agents_executed.append("Campaign Agent")
                workflow_data["campaign"] = "Campaign managed"
            
            # Determine final status
            if campaign_completed:
                await update_task_status(task_id, "completed", 100.0, "CEO Agent: Complete workflow executed successfully")
                
                # Create result summary exactly like in test files
                result_summary = {
                    "campaign_complete": True,
                    "status": "completed",
                    "orchestrator": "CEO Agent",
                    "execution_time": f"{execution_time:.2f} seconds",
                    "agents_executed": agents_executed,
                    "agents_count": len(agents_executed),
                    "workflow_sequence": " → ".join(agents_executed),
                    "execution_summary": {
                        "tasks_completed": final_result.get("completed_tasks", []),
                        "task_list": final_result.get("task_list", []),
                        "required_agents": final_result.get("required_agents", []),
                        "email_sent": final_result.get("email_sent", False),
                        "contract_prepared": final_result.get("contract_prepared", False),
                        "call_completed": bool(final_result.get("call_result")),
                        "research_completed": bool(final_result.get("lead_info")),
                        "content_created": bool(final_result.get("email_content")),
                        "report_generated": bool(final_result.get("report")),
                        "campaign_managed": bool(final_result.get("campaign_results"))
                    },
                    "workflow_data": workflow_data,
                    "full_results": final_result
                }
                
                task_results[task_id] = result_summary
                active_tasks[task_id]["result"] = result_summary
                
                print("🎉 CEO WORKFLOW COMPLETED SUCCESSFULLY!")
                print(f"🎯 Agents Executed: {len(agents_executed)}")
                print(f"📋 Workflow Sequence: {' → '.join(agents_executed)}")
                
            else:
                await update_task_status(task_id, "completed", 85.0, "CEO Agent: Workflow completed with partial results")
                
                result_summary = {
                    "campaign_complete": False,
                    "status": "partial_completion",
                    "orchestrator": "CEO Agent",
                    "execution_time": f"{execution_time:.2f} seconds",
                    "agents_executed": agents_executed,
                    "message": "Workflow executed but some tasks may not have completed fully",
                    "workflow_data": workflow_data,
                    "full_results": final_result
                }
                
                task_results[task_id] = result_summary
                active_tasks[task_id]["result"] = result_summary
                
                print("⚠️ CEO WORKFLOW COMPLETED WITH PARTIAL RESULTS")
                print(f"📊 Final result keys: {list(final_result.keys())}")
            
        except Exception as e:
            print(f"❌ CEO workflow execution error: {e}")
            import traceback
            traceback.print_exc()
            await update_task_status(task_id, "failed", 0.0, f"CEO Agent: Workflow execution failed - {str(e)}")
            
    except Exception as e:
        print(f"❌ CEO task setup error: {e}")
        import traceback
        traceback.print_exc()
        await update_task_status(task_id, "failed", 0.0, f"CEO orchestration setup failed: {str(e)}")

async def update_task_status(task_id: str, status: str, progress: float, message: str):
    """Update task status and broadcast to connected clients."""
    if task_id in active_tasks:
        active_tasks[task_id].update({
            "status": status,
            "progress": progress,
            "current_step": message,
            "updated_at": datetime.now()
        })
        
        # Broadcast update to connected clients
        update_message = {
            "type": "task_update",
            "task_id": task_id,
            "status": status,
            "progress": progress,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        
        await manager.broadcast_to_task(task_id, update_message)

async def handle_approval_request(task_id: str, state: dict):
    """Handle human approval requests during workflow execution."""
    approval_type = "strategy"  # Default, could be extracted from state
    
    if task_id in active_tasks:
        active_tasks[task_id].update({
            "status": "paused",
            "approval_required": True,
            "approval_type": approval_type,
            "updated_at": datetime.now()
        })
    
    # Broadcast approval request
    approval_message = {
        "type": "approval_required",
        "task_id": task_id,
        "approval_type": approval_type,
        "state_summary": {
            "current_task": state.get("current_task", "Unknown"),
            "progress": state.get("progress", "Unknown")
        }
    }
    
    await manager.broadcast_to_task(task_id, approval_message)

# ============ STATUS AND MONITORING ENDPOINTS ============

@app.get("/tasks", response_model=List[TaskStatus])
async def get_all_tasks():
    """Get all tasks managed by CEO Agent."""
    tasks = []
    for task_id, task_info in active_tasks.items():
        tasks.append(TaskStatus(
            task_id=task_id,
            status=task_info["status"],
            progress=task_info["progress"],
            current_step=task_info.get("current_step"),
            message=task_info.get("current_step"),
            created_at=task_info["created_at"],
            updated_at=task_info["updated_at"],
            result=task_info.get("result"),
            approval_required=task_info.get("approval_required", False),
            approval_type=task_info.get("approval_type"),
            orchestrated_by="CEO Agent"
        ))
    return tasks

@app.get("/tasks/{task_id}", response_model=TaskStatus)
async def get_task(task_id: str):
    """Get specific task details."""
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task_info = active_tasks[task_id]
    return TaskStatus(
        task_id=task_id,
        status=task_info["status"],
        progress=task_info["progress"],
        current_step=task_info.get("current_step"),
        message=task_info.get("current_step"),
        created_at=task_info["created_at"],
        updated_at=task_info["updated_at"],
        result=task_info.get("result"),
        approval_required=task_info.get("approval_required", False),
        approval_type=task_info.get("approval_type"),
        orchestrated_by="CEO Agent"
    )

@app.get("/ceo/info", response_model=dict)
async def get_ceo_agent_info():
    """Get CEO Agent information and capabilities."""
    return {
        "agent_name": "CEO Orchestrator Agent",
        "version": "2.0.0",
        "description": "Central orchestrator that routes all workflows",
        "capabilities": [
            "Query analysis and task decomposition",
            "Agent workflow orchestration",
            "Campaign management",
            "Real-time progress tracking",
            "Human-in-the-loop coordination",
            "Multi-agent coordination",
            "Report generation"
        ],
        "supported_modes": ["campaign", "chat"],
        "workflow_pattern": "start_campaign() → safe_invoke_graph() → comprehensive_results",
        "langgraph_available": LANGGRAPH_AVAILABLE,
        "active_tasks": len(active_tasks),
        "total_completed": len([t for t in active_tasks.values() if t["status"] == "completed"])
    }

@app.get("/ceo/metrics", response_model=dict)
async def get_ceo_metrics():
    """Get CEO Agent performance metrics."""
    total_tasks = len(active_tasks)
    completed_tasks = len([t for t in active_tasks.values() if t["status"] == "completed"])
    failed_tasks = len([t for t in active_tasks.values() if t["status"] == "failed"])
    running_tasks = len([t for t in active_tasks.values() if t["status"] == "running"])
    
    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "failed_tasks": failed_tasks,
        "running_tasks": running_tasks,
        "success_rate": (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0,
        "active_connections": len(manager.active_connections),
        "orchestrator": "CEO Agent",
        "uptime": "Active",
        "workflow_engine": "LangGraph" if LANGGRAPH_AVAILABLE else "Mock"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "ceo_agent": "active",
        "langgraph": "available" if LANGGRAPH_AVAILABLE else "unavailable",
        "active_tasks": len(active_tasks)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 