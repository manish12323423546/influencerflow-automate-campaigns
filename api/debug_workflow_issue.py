#!/usr/bin/env python3
"""
Debug script to identify why workflow stops at strategy review instead of continuing to agents
"""

import requests
import json
import time

# Test configuration
API_BASE = "http://localhost:8000"

def test_workflow_progression():
    """Test workflow to see exactly where it stops and why"""
    print("🔍 DEBUGGING WORKFLOW PROGRESSION")
    print("=" * 60)
    
    # Test with a simple query that should execute discover_agent
    test_payload = {
        "query": "Find influencer for my campaign",
        "mode": "campaign",
        "recipient_email": "test@example.com", 
        "phone_number": "+1234567890",
        "priority": "high",
        "requires_approval": False,
        "testing_mode": True,
        "auto_approve_all": True
    }
    
    print(f"📋 Test Query: {test_payload['query']}")
    print(f"🚀 Testing Mode: {test_payload['testing_mode']}")
    print(f"✅ Auto Approve: {test_payload['auto_approve_all']}")
    print()
    
    # Execute workflow
    response = requests.post(f"{API_BASE}/ceo/execute", json=test_payload)
    
    if response.status_code == 200:
        task_data = response.json()
        task_id = task_data["task_id"]
        print(f"✅ Task created: {task_id}")
        
        # Monitor the task and check logs
        while True:
            task_response = requests.get(f"{API_BASE}/tasks/{task_id}")
            if task_response.status_code == 200:
                task_info = task_response.json()
                status = task_info["status"]
                progress = task_info["progress"]
                
                print(f"📊 Status: {status} ({progress}%)")
                
                if status in ["completed", "failed"]:
                    # Get final results
                    result = task_info.get("result", {})
                    
                    print("\n🎯 FINAL ANALYSIS:")
                    print(f"   Final Status: {result.get('status', 'unknown')}")
                    print(f"   Campaign Complete: {result.get('campaign_complete', False)}")
                    print(f"   Agents Executed: {result.get('agents_count', 0)}")
                    print(f"   Workflow Sequence: {result.get('workflow_sequence', 'N/A')}")
                    
                    # Check specific result details
                    if 'full_results' in result:
                        full_results = result['full_results']
                        print(f"   Final Workflow Status: {full_results.get('status', 'unknown')}")
                        print(f"   Next Node Set: {full_results.get('next_node', 'none')}")
                        print(f"   Required Agents: {full_results.get('required_agents', [])}")
                        print(f"   Task List: {full_results.get('task_list', [])}")
                        print(f"   Strategy Approved: {full_results.get('strategy_approved', False)}")
                        print(f"   Testing Mode Flags: {full_results.get('testing_mode', False)}")
                        
                        # Check if strategy review was bypassed
                        if full_results.get('status') == 'strategy_analysis_complete':
                            print("\n⚠️ ISSUE IDENTIFIED:")
                            print("   Workflow stopped at 'strategy_analysis_complete'")
                            print("   This means strategy_review node was not reached or executed")
                            print("   Expected: strategy_analysis_complete -> strategy_review -> strategy_approved -> agent execution")
                            
                            if full_results.get('next_node') == 'strategy_review':
                                print("   CEO Router Decision: ✅ Correctly set to strategy_review")
                                print("   But strategy_review node was not executed!")
                                print("   This suggests the graph execution stopped prematurely")
                            else:
                                print(f"   CEO Router Decision: ❌ Incorrectly set to {full_results.get('next_node')}")
                                print("   Should be 'strategy_review' or direct agent in testing mode")
                    
                    break
            
            time.sleep(1)
    
    else:
        print(f"❌ Failed to create task: {response.status_code}")
        print(response.text)

def test_direct_agent_routing():
    """Test if we can directly route to agents bypassing strategy review"""
    print("\n🧪 TESTING DIRECT AGENT ROUTING")
    print("=" * 60)
    
    # This should test if the CEO orchestrator bypass logic works
    test_payload = {
        "query": "Research influencers in tech industry",
        "mode": "campaign", 
        "recipient_email": "test@example.com",
        "phone_number": "+1234567890",
        "priority": "high",
        "requires_approval": False,
        "testing_mode": True,
        "auto_approve_all": True
    }
    
    print(f"📋 Direct Agent Test: {test_payload['query']}")
    print("🎯 Expected: Should bypass strategy_review and go directly to discover_agent")
    print()
    
    response = requests.post(f"{API_BASE}/ceo/execute", json=test_payload)
    
    if response.status_code == 200:
        task_data = response.json()
        task_id = task_data["task_id"]
        print(f"✅ Task created: {task_id}")
        
        # Wait for completion
        for _ in range(15):  # 15 second timeout
            task_response = requests.get(f"{API_BASE}/tasks/{task_id}")
            if task_response.status_code == 200:
                task_info = task_response.json()
                if task_info["status"] in ["completed", "failed"]:
                    result = task_info.get("result", {})
                    agents_executed = result.get('agents_count', 0)
                    
                    if agents_executed > 0:
                        print(f"✅ SUCCESS: {agents_executed} agents executed!")
                        print(f"   Sequence: {result.get('workflow_sequence', 'N/A')}")
                    else:
                        print("❌ FAILED: 0 agents executed - still stopping at strategy review")
                        
                        # Check if the bypass logic is working
                        full_results = result.get('full_results', {})
                        if full_results.get('status') == 'strategy_approved':
                            print("   Strategy was approved but no agents ran")
                        elif full_results.get('status') == 'strategy_analysis_complete':
                            print("   Strategy review was not even reached!")
                    break
            time.sleep(1)

if __name__ == "__main__":
    # Check if API is running
    try:
        health_response = requests.get(f"{API_BASE}/health")
        if health_response.status_code == 200:
            print("✅ API is running")
            test_workflow_progression()
            test_direct_agent_routing()
        else:
            print("❌ API health check failed")
    except Exception as e:
        print(f"❌ Cannot connect to API: {e}")
        print("💡 Make sure to run: cd api && python ai_agents.py") 