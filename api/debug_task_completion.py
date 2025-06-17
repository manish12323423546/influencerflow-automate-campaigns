#!/usr/bin/env python3
"""
Debug script to analyze task completion logic
"""

import requests
import json
import time

def debug_task_completion():
    """Debug why tasks are being marked as complete"""
    
    print("🔍 DEBUGGING TASK COMPLETION LOGIC")
    print("=" * 60)
    
    # Start a test workflow
    response = requests.post('http://localhost:8001/ceo/execute', json={
        'query': 'Find influencer for my campaign',
        'mode': 'campaign',
        'testing_mode': True,
        'auto_approve_all': True
    })
    
    if response.status_code == 200:
        result = response.json()
        task_id = result.get('task_id')
        print(f"✅ Task created: {task_id}")
        
        # Wait for completion
        time.sleep(3)
        
        # Get the final result
        status_response = requests.get(f'http://localhost:8001/tasks/{task_id}')
        if status_response.status_code == 200:
            task_status = status_response.json()
            result_data = task_status.get('result', {})
            full_results = result_data.get('full_results', {})
            
            print('\n=== FINAL STATE ANALYSIS ===')
            print(f"Status: {full_results.get('status')}")
            print(f"Task List: {full_results.get('task_list', [])}")
            print(f"Completed Tasks: {full_results.get('completed_tasks', [])}")
            print(f"Required Agents: {full_results.get('required_agents', [])}")
            
            print('\n=== DISCOVERY TASK STATE ===')
            print(f"Lead Info Exists: {bool(full_results.get('lead_info'))}")
            print(f"Lead Info Length: {len(full_results.get('lead_info', ''))}")
            print(f"Lead Info Content: {full_results.get('lead_info', 'None')[:100]}...")
            print(f"Discovery Agent Executed: {bool(full_results.get('discover_agent_executed'))}")
            print(f"Discovery Metadata Exists: {bool(full_results.get('discovery_metadata'))}")
            print(f"Discovered Influencers Exists: {bool(full_results.get('discovered_influencers'))}")
            print(f"Discovered Influencers Length: {len(full_results.get('discovered_influencers', []))}")
            
            print('\n=== TASK COMPLETION ANALYSIS ===')
            tasks = full_results.get('task_list', [])
            completed = full_results.get('completed_tasks', [])
            
            for task in tasks:
                print(f"Task: '{task}'")
                print(f"  In completed_tasks: {task in completed}")
                
                # Check discovery task completion conditions
                if any(keyword in task.lower() for keyword in ["research", "discover", "find", "identify"]):
                    has_lead_info = bool(full_results.get("lead_info"))
                    has_discovered_influencers = bool(full_results.get("discovered_influencers"))
                    has_discovery_metadata = bool(full_results.get("discovery_metadata"))
                    discover_agent_executed = bool(full_results.get("discover_agent_executed"))
                    
                    traditional_complete = has_lead_info and (has_discovered_influencers or has_discovery_metadata or len(full_results.get("lead_info", "")) > 50)
                    agent_executed_complete = discover_agent_executed
                    
                    result = traditional_complete or agent_executed_complete
                    
                    print(f"  DISCOVERY TASK ANALYSIS:")
                    print(f"    - Traditional complete: {traditional_complete}")
                    print(f"      (lead_info: {has_lead_info}, discovered: {has_discovered_influencers}, metadata: {has_discovery_metadata}, length > 50: {len(full_results.get('lead_info', '')) > 50})")
                    print(f"    - Agent executed: {agent_executed_complete}")
                    print(f"    - FINAL RESULT: {result}")
                    
                    if result:
                        print(f"  ❌ ISSUE: Task marked complete but shouldn't be!")
                    else:
                        print(f"  ✅ Task correctly marked incomplete")
                
            print('\n=== CONCLUSION ===')
            if len(completed) == 0 and len(tasks) > 0:
                print("✅ GOOD: No tasks marked as completed (they should execute)")
            else:
                print("❌ ISSUE: Tasks are being marked as completed prematurely")
                print(f"Tasks that should execute: {[t for t in tasks if t not in completed]}")
        else:
            print(f"❌ Failed to get task status: {status_response.status_code}")
    else:
        print(f"❌ Failed to start workflow: {response.status_code}")

if __name__ == "__main__":
    debug_task_completion() 