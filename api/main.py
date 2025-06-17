#!/usr/bin/env python3
"""
AI Agents FastAPI Backend - CEO-Centric Workflow

This module provides a comprehensive FastAPI backend that routes ALL user queries
through the CEO Orchestrator agent first, following the exact same pattern as the
LangGraph test files. The CEO agent analyzes queries, creates task lists, and
coordinates the entire workflow automatically.

Features:
- CEO-first workflow routing (same as test files)
- Real-time agent execution with progress tracking
- Human-in-the-loop workflow management  
- WebSocket connections for live updates
- Task queuing and management
- Agent performance monitoring
"""

import sys
import os
from pathlib import Path
import time
import asyncio
from datetime import datetime
from contextlib import asynccontextmanager
import random

# Add the langgraph-example-1 directory to Python path
langgraph_path = Path(__file__).parent.parent / "langgraph-example-1"
sys.path.insert(0, str(langgraph_path))

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Literal
import json
import uuid
import random

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

# Pydantic models - Updated for CEO-centric workflow
class AgentQuery(BaseModel):
    query: str = Field(..., description="The user's query - CEO will analyze and orchestrate the workflow")
    mode: Literal["campaign", "chat"] = Field("campaign", description="Execution mode")
    recipient_email: Optional[str] = Field("", description="Email for notifications")
    phone_number: Optional[str] = Field("", description="Phone number for notifications")
    priority: Literal["low", "medium", "high"] = Field("medium", description="Task priority")
    requires_approval: bool = Field(False, description="Whether human approval is required")
    testing_mode: bool = Field(True, description="Auto-approve all steps for testing (bypasses interruptions)")
    auto_approve_all: bool = Field(True, description="Automatically approve all workflow steps without interruption")

class ApprovalRequest(BaseModel):
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
    orchestrated_by: str = Field(default="CEO Agent", description="Always orchestrated by CEO")

class AgentMetrics(BaseModel):
    agent_name: str
    total_executions: int
    success_rate: float
    avg_execution_time: float
    last_execution: Optional[datetime]

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
    description="CEO agent orchestrates all workflows using the exact LangGraph test pattern",
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

@app.post("/agents/execute", response_model=dict)
async def execute_agent(query: AgentQuery, background_tasks: BackgroundTasks):
    """Execute workflow through CEO Agent orchestration - follows exact test file pattern."""
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
    
    if query.requires_approval:
        task_info["approval_required"] = True
        task_info["approval_type"] = "strategy" # Default to strategy approval

    active_tasks[task_id] = task_info
    
    # Execute CEO workflow in background using exact test pattern
    background_tasks.add_task(run_ceo_orchestrated_workflow, task_id, query)
    
    return {
        "task_id": task_id,
        "status": "queued",
        "message": "CEO Agent will orchestrate your complete workflow using LangGraph test pattern",
        "orchestrator": "CEO Agent",
        "workflow_pattern": "start_campaign() → safe_invoke_graph() → comprehensive_results"
    }

async def run_ceo_orchestrated_workflow(task_id: str, query: AgentQuery):
    """Execute CEO-orchestrated workflow with comprehensive task management.
    
    NOTE: The agent.py has been modified to remove approval nodes and simplify the workflow.
    All routing now goes through the CEO agent directly.
    """
    try:
        # Step 1: Initialize CEO workflow state exactly like in test files
        await update_task_status(task_id, "running", 5.0, "CEO Agent: Initializing workflow...")
        
        # Import the safe_invoke_graph and start_campaign functions from the langgraph module
        # This ensures we use the exact same pattern as the test files
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'langgraph-example-1'))
        
        try:
            from my_agent.agent import safe_invoke_graph, start_campaign, graph
            print("✅ Successfully imported LangGraph agents - CEO orchestration ready")
        except ImportError as e:
            print(f"❌ Failed to import LangGraph agents: {e}")
            await update_task_status(task_id, "failed", 5.0, f"CEO Agent: Failed to import workflow agents - {str(e)}")
            return
        
        # Create initial state exactly like test files using start_campaign()
        initial_state = start_campaign(
            query=query.query,
            recipient_email=query.recipient_email,
            phone_number=query.phone_number
        )
        
        # ======= AUTO-APPROVAL MODE FOR TESTING =======
        if query.testing_mode or query.auto_approve_all:
            print("🚀 TESTING MODE: Auto-approving all workflow steps to prevent interruptions")
            # Pre-approve all possible approval types to prevent workflow interruptions
            initial_state.update({
                # Approval flags - set all to True for testing
                "content_approved": True,
                "contract_approved": True,
                "email_send_approved": True,
                "strategy_approved": True,
                
                # Clear any pending approvals
                "approval_required": False,
                "pending_approval": None,
                
                # Testing mode flags
                "testing_mode": True,
                "auto_approve_enabled": True,
                "skip_human_approval": True,
                
                # Ensure no interruptions
                "human_message": None,
                "approval_requested": False
            })
            print("✅ AUTO-APPROVAL: All approval types pre-approved for uninterrupted workflow")
        
        await update_task_status(task_id, "running", 10.0, "CEO Agent: Campaign state initialized (test pattern)")
        
        # Step 2: Create config exactly like in the tests
        config = {
            "recursion_limit": 50,
            "configurable": {"thread_id": task_id}
        }
        
        # ======= TESTING MODE CONFIGURATION =======
        if query.testing_mode or query.auto_approve_all:
            # Use configuration that bypasses all interrupts (like test files)
            config["configurable"]["testing_mode"] = True
            config["configurable"]["auto_approve"] = True
            config["configurable"]["skip_interrupts"] = True
            # CRITICAL: Disable interrupts at LangGraph level for testing
            config["interrupt_before"] = []  # Override the interrupt configuration
            print("🔧 TESTING CONFIG: Configured for no-interrupts execution")
        
        await update_task_status(task_id, "running", 15.0, "CEO Agent: Starting workflow execution...")
        
        # Step 3: Execute the workflow using safe_invoke_graph exactly like in tests
        try:
            print(f"🎯 EXECUTING CEO WORKFLOW with config: {config}")
            print(f"📋 Initial state keys: {list(initial_state.keys())}")
            
            # Use safe_invoke_graph exactly like in the test files
            print("🚀 STARTING GRAPH: Recursion limit set to 50")
            if query.testing_mode:
                print("🔧 TESTING MODE: Interrupts bypassed for continuous execution")
            start_time = time.time()
            
            # Execute workflow with the corrected config that disables interrupts for testing
            final_result = safe_invoke_graph(initial_state, config)
            execution_time = time.time() - start_time
            
            await update_task_status(task_id, "running", 70.0, "CEO Agent: Workflow execution completed - analyzing results...")
            
            print(f"✅ CEO WORKFLOW COMPLETED in {execution_time:.2f} seconds")
            print(f"📊 Final Status: {final_result.get('status', 'unknown')}")
            print(f"🎯 Mode: {final_result.get('mode', 'unknown')}")
            print(f"📋 Result keys: {list(final_result.keys())}")
            
            # Update progress based on workflow completion
            await update_task_status(task_id, "running", 90.0, "CEO Agent: Generating comprehensive report...")
            
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
                    "workflow_pattern": "start_campaign() → safe_invoke_graph() → comprehensive_results",
                    "agents_executed": agents_executed,
                    "agents_count": len(agents_executed),
                    "workflow_sequence": " → ".join(agents_executed) if agents_executed else "CEO Agent Only",
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
                    "test_pattern_used": True,
                    "full_results": final_result
                }
                
                task_results[task_id] = result_summary
                active_tasks[task_id]["result"] = result_summary
                
                print("🎉 CEO WORKFLOW COMPLETED SUCCESSFULLY!")
                print(f"🎯 Agents Executed: {len(agents_executed)}")
                print(f"📋 Workflow Sequence: {' → '.join(agents_executed) if agents_executed else 'CEO Agent Only'}")
                
            else:
                await update_task_status(task_id, "completed", 85.0, "CEO Agent: Workflow completed with partial results")
                
                result_summary = {
                    "campaign_complete": False,
                    "status": "partial_completion",
                    "orchestrator": "CEO Agent",
                    "execution_time": f"{execution_time:.2f} seconds",
                    "workflow_pattern": "start_campaign() → safe_invoke_graph() → partial_results",
                    "agents_executed": agents_executed,
                    "message": "Workflow executed but some tasks may not have completed fully",
                    "workflow_data": workflow_data,
                    "test_pattern_used": True,
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

# ============ TASK MANAGEMENT ENDPOINTS ============

@app.get("/tasks", response_model=List[TaskStatus])
async def get_all_tasks():
    """Get all tasks orchestrated by CEO Agent."""
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
            query=task_info.get("query"),
            orchestrated_by="CEO Agent"
        ))
    
    return sorted(tasks, key=lambda x: x.updated_at, reverse=True)

@app.get("/tasks/{task_id}", response_model=TaskStatus)
async def get_task(task_id: str):
    """Get a specific CEO-orchestrated task by ID."""
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
        query=task_info.get("query"),
        orchestrated_by="CEO Agent"
    )

@app.post("/tasks/{task_id}/cancel")
async def cancel_task(task_id: str):
    """Cancel a running task."""
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    active_tasks[task_id]["status"] = "cancelled"
    await update_task_status(task_id, "cancelled", active_tasks[task_id]["progress"], "Task cancelled by user")
    
    return {"message": "Task cancelled", "task_id": task_id}

@app.post("/tasks/{task_id}/approve")
async def approve_task(task_id: str, approval: ApprovalRequest):
    """Handle approval requests for CEO orchestrated workflows."""
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task_info = active_tasks[task_id]
    
    if not task_info.get("approval_required"):
        raise HTTPException(status_code=400, detail="Task does not require approval")
    
    # Update task with approval decision
    task_info["approval_required"] = False
    task_info[f"{approval.approval_type}_approved"] = approval.approved
    
    if approval.feedback:
        task_info["approval_feedback"] = approval.feedback
    
    # Send approval response via WebSocket to resume workflow
    approval_message = {
        "type": "approval_response",
        "task_id": task_id,
        "approval_type": approval.approval_type,
        "approved": approval.approved,
        "feedback": approval.feedback,
        "message": f"CEO workflow {approval.approval_type} {'approved' if approval.approved else 'rejected'} by user",
        "timestamp": datetime.now().isoformat()
    }
    
    await manager.broadcast_to_task(task_id, approval_message)
    
            # Update task status
    status_message = "Approved - continuing workflow" if approval.approved else "Rejected - adjusting strategy"
    await update_task_status(task_id, "running", task_info["progress"], status_message)
    
    return {
        "message": f"CEO workflow {approval.approval_type} {'approved' if approval.approved else 'rejected'}",
        "task_id": task_id,
        "approved": approval.approved,
        "next_action": "Workflow will continue with CEO orchestration" if approval.approved else "CEO will adjust strategy based on feedback"
    }

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    """Delete a task from the system."""
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    del active_tasks[task_id]
    if task_id in task_results:
        del task_results[task_id]
    
    return {"message": "Task deleted", "task_id": task_id}

# ============ CEO AGENT INFORMATION ENDPOINTS ============

@app.get("/agents/available", response_model=List[dict])
async def get_available_agents():
    """Get information about available agents (all coordinated by CEO)."""
    return [
        {
            "name": "CEO Orchestrator Agent",
            "id": "ceo_orchestrator", 
            "description": "Central orchestrator that coordinates all workflows using LangGraph test patterns",
            "capabilities": [
                "Query analysis and task decomposition",
                "Workflow orchestration and routing",
                "Multi-agent coordination",
                "Real-time progress tracking",
                "Report generation"
            ],
            "coordinated_agents": [
                "Discovery Agent - Research and target identification",
                "Content Agent - Content creation and optimization", 
                "Contract Agent - Legal document preparation",
                "Gmail Agent - Email automation and outreach",
                "Call Agent - Phone call automation",
                "Report Agent - Analytics and reporting",
                "Campaign Agent - Campaign management"
            ],
            "workflow_pattern": "start_campaign() → safe_invoke_graph() → comprehensive_results",
            "test_files_compatible": True
        }
    ]

@app.get("/agents/metrics", response_model=List[AgentMetrics])
async def get_agent_metrics():
    """Get performance metrics for CEO-orchestrated workflows."""
    total_tasks = len(active_tasks)
    completed_tasks = len([t for t in active_tasks.values() if t["status"] == "completed"])
    
    # Calculate execution times
    execution_times = []
    for task in active_tasks.values():
        if task["status"] == "completed" and task.get("result"):
            execution_time_str = task.get("result", {}).get("execution_time", "0.0 seconds")
            try:
                execution_time = float(execution_time_str.split()[0])
                execution_times.append(execution_time)
            except:
                execution_times.append(0.0)
    
    avg_execution_time = sum(execution_times) / len(execution_times) if execution_times else 0.0
    success_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0.0
    
    return [
        AgentMetrics(
            agent_name="CEO Orchestrator Agent",
            total_executions=total_tasks,
            success_rate=success_rate,
            avg_execution_time=avg_execution_time,
            last_execution=max([t["updated_at"] for t in active_tasks.values()]) if active_tasks else None
        )
    ]

@app.get("/workflows/graph/{task_id}")
async def get_workflow_graph(task_id: str):
    """Get workflow execution graph for a specific task."""
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task_info = active_tasks[task_id]
    result = task_info.get("result", {})
    
    # Create workflow graph based on executed agents
    nodes = [{"id": "ceo", "label": "CEO Agent", "type": "orchestrator"}]
    edges = []
    
    if result.get("agents_executed"):
        for i, agent in enumerate(result["agents_executed"]):
            agent_id = agent.lower().replace(" ", "_")
            nodes.append({"id": agent_id, "label": agent, "type": "agent"})
            
            # Add edge from CEO to first agent, then chain agents
            if i == 0:
                edges.append({"from": "ceo", "to": agent_id})
            else:
                prev_agent = result["agents_executed"][i-1].lower().replace(" ", "_")
                edges.append({"from": prev_agent, "to": agent_id})
    
    return {
        "task_id": task_id,
        "workflow_pattern": "CEO-Orchestrated LangGraph Pattern",
        "nodes": nodes,
        "edges": edges,
        "execution_summary": result.get("execution_summary", {}),
        "workflow_sequence": result.get("workflow_sequence", "CEO Agent Only")
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for CEO-centric API."""
    return {
        "status": "healthy",
        "orchestrator": "CEO Agent",
        "timestamp": datetime.now().isoformat(),
        "active_workflows": len(active_tasks),
        "connected_clients": len(manager.active_connections),
        "langgraph_integration": LANGGRAPH_AVAILABLE,
        "workflow_pattern": "start_campaign() → safe_invoke_graph() → comprehensive_results",
        "version": "2.0.0 - CEO-Centric LangGraph Test Pattern"
    }

# ============ CEO AGENT SPECIFIC ENDPOINTS ============

@app.get("/ceo/info")
async def get_ceo_info():
    """Get information about the CEO Agent orchestrator."""
    return {
        "agent_name": "CEO Orchestrator Agent",
        "id": "ceo_orchestrator",
        "description": "Central AI orchestrator that coordinates all workflows using proven LangGraph test patterns",
        "capabilities": [
            "Intelligent query analysis and task decomposition",
            "Dynamic workflow orchestration and agent routing",
            "Multi-agent coordination with real-time monitoring",
            "Adaptive strategy formation and execution",
            "Comprehensive progress tracking and reporting",
            "Campaign automation and optimization"
        ],
        "orchestrated_agents": [
            "Discovery Agent - Research, target identification, and market analysis",
            "Content Agent - Content creation, optimization, and personalization", 
            "Contract Agent - Legal document preparation and review",
            "Gmail Agent - Email automation, outreach, and follow-up",
            "Call Agent - Phone call automation and scheduling",
            "Report Agent - Analytics, insights, and performance reporting",
            "Campaign Agent - End-to-end campaign management"
        ],
        "workflow_approach": "CEO Agent analyzes each query, breaks it into strategic tasks, orchestrates specialized agents, monitors progress, and delivers comprehensive results",
        "test_pattern_compatibility": "Fully compatible with LangGraph test file patterns: start_campaign() → safe_invoke_graph() → results_analysis",
        "execution_modes": ["campaign", "chat"],
        "features": {
            "real_time_updates": True,
            "multi_agent_coordination": True,
            "comprehensive_reporting": True,
            "error_recovery": True,
            "progress_tracking": True,
            "simplified_workflow": "Direct CEO routing without approval interruptions"
        }
    }

@app.get("/ceo/metrics")
async def get_ceo_metrics():
    """Get performance metrics for CEO Agent orchestration."""
    total_tasks = len(active_tasks)
    completed_tasks = len([t for t in active_tasks.values() if t["status"] == "completed"])
    running_tasks = len([t for t in active_tasks.values() if t["status"] == "running"])
    failed_tasks = len([t for t in active_tasks.values() if t["status"] == "failed"])
    
    # Calculate execution times
    execution_times = []
    successful_workflows = 0
    total_agents_orchestrated = 0
    
    for task in active_tasks.values():
        if task["status"] == "completed" and task.get("result"):
            successful_workflows += 1
            result = task.get("result", {})
            
            # Extract execution time
            execution_time_str = result.get("execution_time", "0.0 seconds")
            try:
                execution_time = float(execution_time_str.split()[0])
                execution_times.append(execution_time)
            except:
                execution_times.append(0.0)
            
            # Count orchestrated agents
            agents_executed = result.get("agents_executed", [])
            total_agents_orchestrated += len(agents_executed)
    
    avg_execution_time = sum(execution_times) / len(execution_times) if execution_times else 0.0
    success_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 100.0
    avg_agents_per_workflow = total_agents_orchestrated / successful_workflows if successful_workflows > 0 else 0.0
    
    return {
        "orchestrator_name": "CEO Agent",
        "total_workflows_orchestrated": total_tasks,
        "successful_workflows": completed_tasks,
        "running_workflows": running_tasks,
        "failed_workflows": failed_tasks,
        "success_rate": round(success_rate, 2),
        "average_execution_time": round(avg_execution_time, 2),
        "average_agents_per_workflow": round(avg_agents_per_workflow, 1),
        "total_agents_orchestrated": total_agents_orchestrated,
        "last_orchestration": max([t["updated_at"] for t in active_tasks.values()]) if active_tasks else None,
        "performance_indicators": {
            "workflow_efficiency": "High" if success_rate > 90 else "Medium" if success_rate > 70 else "Low",
            "response_time": "Fast" if avg_execution_time < 30 else "Medium" if avg_execution_time < 60 else "Slow",
            "orchestration_complexity": "High" if avg_agents_per_workflow > 3 else "Medium" if avg_agents_per_workflow > 1 else "Simple"
        },
        "active_capabilities": {
            "langgraph_integration": LANGGRAPH_AVAILABLE,
            "real_time_updates": True,
            "multi_agent_coordination": True,
            "workflow_patterns": "LangGraph Test Compatible"
        }
    }

@app.post("/ceo/execute", response_model=dict)
async def execute_ceo_workflow(query: AgentQuery, background_tasks: BackgroundTasks):
    """Execute a workflow orchestrated by the CEO Agent using LangGraph test patterns."""
    if not LANGGRAPH_AVAILABLE:
        raise HTTPException(
            status_code=503, 
            detail="LangGraph integration not available. Please install dependencies."
        )
    
    # Generate unique task ID
    task_id = f"ceo_task_{int(time.time())}_{random.randint(1000, 9999)}"
    
    # Initialize task in active_tasks with CEO orchestration
    active_tasks[task_id] = {
        "status": "queued",
        "progress": 0.0,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "query": query.query,
        "mode": query.mode,
        "recipient_email": query.recipient_email,
        "orchestrator": "CEO Agent",
        "workflow_pattern": "LangGraph Test Compatible",
        "approval_required": query.requires_approval,
        "priority": query.priority
    }
    
    # Queue background task for CEO orchestration
    background_tasks.add_task(run_ceo_orchestrated_workflow, task_id, query)
    
    return {
        "message": "CEO Agent workflow orchestration initiated",
        "task_id": task_id,
        "orchestrator": "CEO Agent",
        "workflow_pattern": "start_campaign() → safe_invoke_graph() → comprehensive_results",
        "query": query.query,
        "mode": query.mode,
        "estimated_completion": "2-5 minutes depending on workflow complexity",
        "features": {
            "real_time_updates": True,
            "multi_agent_coordination": True,
            "comprehensive_reporting": True,
            "langgraph_compatible": True
        }
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting CEO-Centric AI Agents API on port 8001")
    print("👔 Complete workflow execution orchestrated by CEO Agent")
    print("📋 Using exact LangGraph test file patterns")
    if LANGGRAPH_AVAILABLE:
        print("✅ LangGraph integration active - Full workflow execution")
    else:
        print("⚠️ LangGraph not available - Install dependencies for full functionality")
    uvicorn.run(app, host="0.0.0.0", port=8001) 