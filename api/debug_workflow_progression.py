#!/usr/bin/env python3
"""
Debug workflow progression to see why strategy_review is not being reached
"""

import requests
import json
import time

def debug_workflow_progression():
    """Debug the workflow progression step by step"""
    
    print("🔍 DEBUGGING WORKFLOW PROGRESSION")
    print("=" * 60)
    
    # Test the workflow 
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
        
        # Check status immediately
        status_response = requests.get(f'http://localhost:8001/tasks/{task_id}')
        if status_response.status_code == 200:
            immediate_status = status_response.json()
            print(f"Immediate Status: {immediate_status.get('status')}")
            
            # Wait and check final state
            time.sleep(3)
            final_response = requests.get(f'http://localhost:8001/tasks/{task_id}')
            if final_response.status_code == 200:
                final_status = final_response.json()
                print(f"Final Status: {final_status.get('status')}")
                
                result_data = final_status.get('result', {})
                if result_data:
                    full_results = result_data.get('full_results', {})
                    print(f"\n=== WORKFLOW STATE ANALYSIS ===")
                    print(f"Workflow Status: {full_results.get('status')}")
                    print(f"Next Node: {full_results.get('next_node')}")
                    print(f"Strategy Approved: {full_results.get('strategy_approved')}")
                    print(f"Testing Mode: {full_results.get('testing_mode')}")
                    print(f"Auto Approve Enabled: {full_results.get('auto_approve_enabled')}")
                    print(f"Skip Human Approval: {full_results.get('skip_human_approval')}")
                    
                    print(f"\n=== APPROVAL FLAGS ===")
                    print(f"Content Approved: {full_results.get('content_approved')}")
                    print(f"Contract Approved: {full_results.get('contract_approved')}")
                    print(f"Email Send Approved: {full_results.get('email_send_approved')}")
                    print(f"Strategy Approved: {full_results.get('strategy_approved')}")
                    
                    print(f"\n=== DIAGNOSIS ===")
                    if full_results.get('status') == 'strategy_analysis_complete':
                        print("❌ ISSUE: Workflow stuck at strategy_analysis_complete")
                        print("   This means strategy_review node was not reached or executed")
                        print("   Expected: strategy_analysis_complete -> strategy_review -> strategy_approved -> task execution")
                        
                        if full_results.get('next_node') == 'strategy_review':
                            print("   CEO Router Decision: ✅ Correctly set to strategy_review")
                            print("   But strategy_review node was not executed!")
                        else:
                            print(f"   CEO Router Decision: ❌ Incorrectly set to {full_results.get('next_node')}")
                    
                    elif full_results.get('status') == 'strategy_approved':
                        print("✅ Strategy approval reached")
                        print("   Now checking if task execution started...")
                        
                    else:
                        print(f"🤔 Unexpected status: {full_results.get('status')}")
                        
                else:
                    print("❌ No result data available")
            else:
                print(f"❌ Failed to get final status: {final_response.status_code}")
        else:
            print(f"❌ Failed to get immediate status: {status_response.status_code}")
    else:
        print(f"❌ Failed to start workflow: {response.status_code}")

if __name__ == "__main__":
    debug_workflow_progression() 