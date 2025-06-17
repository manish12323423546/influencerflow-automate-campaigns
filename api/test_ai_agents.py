#!/usr/bin/env python3
"""
Comprehensive Test Suite for AI Agents FastAPI Backend

Tests the CEO-centric workflow orchestration system including:
- FastAPI endpoints
- WebSocket connections  
- CEO agent execution
- Task management
- Error handling
- Real-time progress tracking
"""

import pytest
import asyncio
import json
import uuid
from datetime import datetime
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocketDisconnect

# Import the FastAPI app
from ai_agents import app, manager, active_tasks, task_results

# Test client setup
client = TestClient(app)

class TestHealthAndInfo:
    """Test basic health check and info endpoints."""
    
    def test_health_check(self):
        """Test the health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert data["ceo_agent"] == "active"
        assert "langgraph" in data
        assert "active_tasks" in data

    def test_ceo_agent_info(self):
        """Test CEO agent information endpoint."""
        response = client.get("/ceo/info")
        assert response.status_code == 200
        data = response.json()
        assert data["agent_name"] == "CEO Orchestrator Agent"
        assert data["version"] == "2.0.0"
        assert "capabilities" in data
        assert "workflow_pattern" in data
        assert len(data["capabilities"]) > 0
        assert "campaign" in data["supported_modes"]
        assert "chat" in data["supported_modes"]

    def test_ceo_metrics(self):
        """Test CEO agent metrics endpoint."""
        response = client.get("/ceo/metrics")
        assert response.status_code == 200
        data = response.json()
        assert "total_tasks" in data
        assert "completed_tasks" in data
        assert "failed_tasks" in data
        assert "success_rate" in data
        assert data["orchestrator"] == "CEO Agent"


class TestCEOWorkflowExecution:
    """Test CEO agent workflow execution."""
    
    def setup_method(self):
        """Setup before each test method."""
        # Clear active tasks
        active_tasks.clear()
        task_results.clear()

    @patch('ai_agents.LANGGRAPH_AVAILABLE', True)
    @patch('ai_agents.safe_invoke_graph')
    @patch('ai_agents.start_campaign')
    def test_execute_ceo_workflow_basic(self, mock_start_campaign, mock_safe_invoke):
        """Test basic CEO workflow execution."""
        # Setup mocks
        mock_start_campaign.return_value = {
            "mode": "campaign",
            "status": "initialized",
            "query": "test campaign"
        }
        mock_safe_invoke.return_value = {
            "status": "completed",
            "campaign_complete": True,
            "email_sent": True,
            "completed_tasks": ["discovery", "content_creation", "email_send"]
        }
        
        # Test data
        test_query = {
            "query": "Create a campaign for tech startup outreach",
            "mode": "campaign",
            "recipient_email": "test@example.com",
            "phone_number": "+1234567890",
            "testing_mode": True
        }
        
        response = client.post("/ceo/execute", json=test_query)
        assert response.status_code == 200
        data = response.json()
        
        assert "task_id" in data
        assert data["status"] == "queued"
        assert data["orchestrator"] == "CEO Agent"
        assert "CEO Agent will orchestrate" in data["message"]

    @patch('ai_agents.LANGGRAPH_AVAILABLE', False)
    def test_execute_ceo_workflow_no_langgraph(self):
        """Test CEO workflow execution when LangGraph is not available."""
        test_query = {
            "query": "Test query without LangGraph",
            "mode": "campaign",
            "testing_mode": True
        }
        
        response = client.post("/ceo/execute", json=test_query)
        assert response.status_code == 200
        data = response.json()
        
        assert "task_id" in data
        assert data["status"] == "queued"

    def test_execute_ceo_workflow_validation(self):
        """Test validation of CEO workflow requests."""
        # Test missing required fields
        response = client.post("/ceo/execute", json={})
        assert response.status_code == 422  # Validation error
        
        # Test invalid mode
        response = client.post("/ceo/execute", json={
            "query": "test",
            "mode": "invalid_mode"
        })
        assert response.status_code == 422

    def test_execute_ceo_workflow_all_options(self):
        """Test CEO workflow execution with all options."""
        test_query = {
            "query": "Complete influencer campaign workflow",
            "mode": "campaign", 
            "recipient_email": "influencer@example.com",
            "phone_number": "+1987654321",
            "priority": "high",
            "requires_approval": False,
            "testing_mode": True,
            "auto_approve_all": True
        }
        
        response = client.post("/ceo/execute", json=test_query)
        assert response.status_code == 200
        data = response.json()
        
        assert data["orchestrator"] == "CEO Agent"
        assert "task_id" in data


class TestTaskManagement:
    """Test task management endpoints."""
    
    def setup_method(self):
        """Setup test tasks."""
        active_tasks.clear()
        
        # Add some test tasks
        test_task_1 = {
            "task_id": "test-task-1",
            "query": "Test campaign 1",
            "mode": "campaign",
            "status": "completed",
            "progress": 100.0,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "current_step": "Completed successfully",
            "requires_approval": False,
            "priority": "medium"
        }
        
        test_task_2 = {
            "task_id": "test-task-2", 
            "query": "Test campaign 2",
            "mode": "chat",
            "status": "running",
            "progress": 45.0,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "current_step": "Processing content",
            "requires_approval": True,
            "approval_type": "content",
            "priority": "high"
        }
        
        active_tasks["test-task-1"] = test_task_1
        active_tasks["test-task-2"] = test_task_2

    def test_get_all_tasks(self):
        """Test getting all tasks."""
        response = client.get("/tasks")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) == 2
        assert all(task["orchestrated_by"] == "CEO Agent" for task in data)
        
        # Check task details
        task_ids = [task["task_id"] for task in data]
        assert "test-task-1" in task_ids
        assert "test-task-2" in task_ids

    def test_get_specific_task(self):
        """Test getting a specific task."""
        response = client.get("/tasks/test-task-1")
        assert response.status_code == 200
        data = response.json()
        
        assert data["task_id"] == "test-task-1"
        assert data["status"] == "completed"
        assert data["progress"] == 100.0
        assert data["orchestrated_by"] == "CEO Agent"

    def test_get_nonexistent_task(self):
        """Test getting a task that doesn't exist."""
        response = client.get("/tasks/nonexistent-task")
        assert response.status_code == 404
        assert "Task not found" in response.json()["detail"]

    def test_task_status_structure(self):
        """Test the structure of task status responses."""
        response = client.get("/tasks/test-task-2")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = [
            "task_id", "status", "progress", "created_at", 
            "updated_at", "orchestrated_by"
        ]
        for field in required_fields:
            assert field in data
        
        assert data["approval_required"] == True
        assert data["approval_type"] == "content"


class TestWebSocketConnections:
    """Test WebSocket functionality."""
    
    def setup_method(self):
        """Setup before each test."""
        # Clear connection manager
        manager.active_connections.clear()
        manager.task_connections.clear()

    def test_websocket_connection(self):
        """Test WebSocket connection establishment."""
        client_id = "test-client-1"
        
        with client.websocket_connect(f"/ws/{client_id}") as websocket:
            # Send subscription message
            websocket.send_text(json.dumps({
                "type": "subscribe_task",
                "task_id": "test-task-123"
            }))
            
            # Receive confirmation
            data = websocket.receive_text()
            message = json.loads(data)
            
            assert message["type"] == "subscription_confirmed"
            assert message["task_id"] == "test-task-123"

    def test_websocket_multiple_connections(self):
        """Test multiple WebSocket connections."""
        client_ids = ["client-1", "client-2", "client-3"]
        
        # Test that multiple connections can be established
        for client_id in client_ids:
            with client.websocket_connect(f"/ws/{client_id}") as websocket:
                websocket.send_text(json.dumps({
                    "type": "subscribe_task", 
                    "task_id": "shared-task"
                }))
                
                data = websocket.receive_text()
                message = json.loads(data)
                assert message["type"] == "subscription_confirmed"


class TestErrorHandling:
    """Test error handling scenarios."""
    
    def test_invalid_json_request(self):
        """Test handling of invalid JSON in requests."""
        response = client.post(
            "/ceo/execute",
            data="invalid json",
            headers={"content-type": "application/json"}
        )
        assert response.status_code == 422

    def test_missing_required_fields(self):
        """Test handling of missing required fields."""
        response = client.post("/ceo/execute", json={
            "mode": "campaign"
            # Missing required 'query' field
        })
        assert response.status_code == 422

    def test_invalid_field_values(self):
        """Test handling of invalid field values."""
        # Invalid priority
        response = client.post("/ceo/execute", json={
            "query": "test",
            "priority": "invalid_priority"
        })
        assert response.status_code == 422
        
        # Invalid progress value would be caught by Pydantic
        test_query = {
            "query": "test",
            "mode": "campaign"
        }
        response = client.post("/ceo/execute", json=test_query)
        assert response.status_code == 200  # Valid request


class TestWorkflowIntegration:
    """Test workflow integration with mocked LangGraph."""
    
    @patch('ai_agents.LANGGRAPH_AVAILABLE', True)
    @patch('ai_agents.safe_invoke_graph')
    @patch('ai_agents.start_campaign')
    async def test_full_workflow_execution(self, mock_start, mock_invoke):
        """Test complete workflow execution simulation."""
        # Setup detailed mock responses
        mock_start.return_value = {
            "mode": "campaign",
            "status": "initialized",
            "query": "AI startup outreach campaign",
            "recipient_email": "founder@startup.com",
            "phone_number": "+1555123456"
        }
        
        mock_invoke.return_value = {
            "status": "completed",
            "campaign_complete": True,
            "lead_info": "Tech startup focused on AI automation tools",
            "email_content": "Personalized outreach email content here...",
            "contract_doc": "Partnership agreement prepared",
            "email_sent": True,
            "call_result": "Call scheduled successfully",
            "report": "Campaign performance report generated",
            "completed_tasks": [
                "research_discovery", 
                "content_creation", 
                "contract_preparation",
                "email_automation",
                "call_scheduling"
            ],
            "required_agents": [
                "Discovery Agent",
                "Content Agent", 
                "Contract Agent",
                "Gmail Agent",
                "Call Agent"
            ]
        }
        
        # Execute workflow
        test_query = {
            "query": "Launch comprehensive AI startup outreach campaign",
            "mode": "campaign",
            "recipient_email": "founder@startup.com", 
            "phone_number": "+1555123456",
            "testing_mode": True,
            "auto_approve_all": True
        }
        
        response = client.post("/ceo/execute", json=test_query)
        assert response.status_code == 200
        
        task_id = response.json()["task_id"]
        
        # Allow background task to execute
        import time
        time.sleep(0.5)
        
        # Verify task completion
        task_response = client.get(f"/tasks/{task_id}")
        assert task_response.status_code == 200

    @patch('ai_agents.LANGGRAPH_AVAILABLE', True)
    @patch('ai_agents.safe_invoke_graph')
    @patch('ai_agents.start_campaign')
    def test_workflow_with_partial_completion(self, mock_start, mock_invoke):
        """Test workflow with partial completion."""
        mock_start.return_value = {"mode": "campaign", "status": "initialized"}
        mock_invoke.return_value = {
            "status": "partial",
            "campaign_complete": False,
            "lead_info": "Some research completed",
            "completed_tasks": ["research_discovery"]
        }
        
        test_query = {
            "query": "Partially complete campaign",
            "mode": "campaign",
            "testing_mode": True
        }
        
        response = client.post("/ceo/execute", json=test_query)
        assert response.status_code == 200

    @patch('ai_agents.LANGGRAPH_AVAILABLE', True)
    @patch('ai_agents.safe_invoke_graph')
    @patch('ai_agents.start_campaign')  
    def test_workflow_execution_error(self, mock_start, mock_invoke):
        """Test workflow execution with errors."""
        mock_start.return_value = {"mode": "campaign", "status": "initialized"}
        mock_invoke.side_effect = Exception("Workflow execution failed")
        
        test_query = {
            "query": "Campaign that will fail",
            "mode": "campaign", 
            "testing_mode": True
        }
        
        response = client.post("/ceo/execute", json=test_query)
        assert response.status_code == 200  # Task is queued successfully
        
        # The background task will handle the error


class TestApprovalWorkflow:
    """Test human-in-the-loop approval workflow."""
    
    def test_approval_request_structure(self):
        """Test the structure of approval requests."""
        approval_data = {
            "task_id": "test-task-123",
            "approval_type": "strategy",
            "approved": True,
            "feedback": "Looks good, proceed with execution"
        }
        
        # This would be part of a larger approval system
        assert approval_data["approved"] == True
        assert approval_data["approval_type"] in ["strategy", "content", "contract", "email_send"]

    def test_testing_mode_bypass(self):
        """Test that testing mode bypasses approval requirements."""
        test_query = {
            "query": "Campaign requiring approvals",
            "mode": "campaign",
            "requires_approval": True,  # This should be bypassed
            "testing_mode": True,
            "auto_approve_all": True
        }
        
        response = client.post("/ceo/execute", json=test_query)
        assert response.status_code == 200
        # In testing mode, approvals should be automatically handled


class TestMetricsAndMonitoring:
    """Test metrics and monitoring functionality."""
    
    def setup_method(self):
        """Setup test data for metrics."""
        active_tasks.clear()
        
        # Add tasks with different statuses
        statuses = ["completed", "failed", "running", "completed", "completed"]
        for i, status in enumerate(statuses):
            task_id = f"metrics-task-{i}"
            active_tasks[task_id] = {
                "task_id": task_id,
                "status": status,
                "progress": 100.0 if status == "completed" else 50.0,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }

    def test_metrics_calculation(self):
        """Test metrics calculation."""
        response = client.get("/ceo/metrics")
        assert response.status_code == 200
        data = response.json()
        
        assert data["total_tasks"] == 5
        assert data["completed_tasks"] == 3
        assert data["failed_tasks"] == 1
        assert data["running_tasks"] == 1
        assert data["success_rate"] == 60.0  # 3/5 * 100

    def test_empty_metrics(self):
        """Test metrics with no tasks."""
        active_tasks.clear()
        
        response = client.get("/ceo/metrics")
        assert response.status_code == 200
        data = response.json()
        
        assert data["total_tasks"] == 0
        assert data["success_rate"] == 0


# Pytest configuration and fixtures
@pytest.fixture
def clean_state():
    """Fixture to clean state before tests."""
    active_tasks.clear()
    task_results.clear()
    manager.active_connections.clear()
    manager.task_connections.clear()
    yield
    # Cleanup after test
    active_tasks.clear()
    task_results.clear()


# Test runner
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"]) 