#!/usr/bin/env python3
"""
Simple Marketing Campaign Report Client

A simplified script to request campaign reports from the CEO Agent.
"""

import requests
import json
import time
from datetime import datetime

# Configuration
API_URL = "http://localhost:8000"

def check_api():
    """Check if the API is running."""
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ AI Agents API is running")
            return True
        else:
            print(f"❌ API returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException:
        print("❌ Cannot connect to AI Agents API")
        print("💡 Make sure to run: python3 ai_agents.py")
        return False

def request_campaign_report():
    """Send campaign report request to CEO Agent."""
    
    # Marketing campaign report query
    campaign_query = """
    Generate a comprehensive marketing campaign report that includes:
    
    📊 CAMPAIGN PERFORMANCE ANALYSIS
    - Key metrics and KPIs analysis
    - ROI and conversion rate calculations  
    - Audience engagement statistics
    - Traffic and lead generation data
    
    🤝 INFLUENCER PARTNERSHIP RESULTS
    - Top performing influencer collaborations
    - Content performance breakdown by creator
    - Engagement rates and reach analysis
    - Partnership ROI assessment
    
    📱 CONTENT STRATEGY ASSESSMENT  
    - Most successful content types and formats
    - Platform-specific performance metrics
    - Viral content analysis and trends
    - Content calendar effectiveness
    
    💰 FINANCIAL SUMMARY
    - Budget allocation and actual spending
    - Cost per acquisition (CPA) analysis
    - Revenue attribution by channel
    - Profitability assessment
    
    🎯 STRATEGIC RECOMMENDATIONS
    - Areas for improvement and optimization
    - Budget reallocation suggestions
    - Future campaign opportunities
    - Competitive analysis insights
    
    Please provide actionable insights, data visualizations, and an executive summary.
    Create detailed reports with charts and recommendations for the marketing team.
    """
    
    # Prepare request data
    request_data = {
        "query": campaign_query,
        "mode": "campaign",
        "recipient_email": "marketing@company.com",
        "phone_number": "",
        "priority": "high",
        "requires_approval": False,
        "testing_mode": True,
        "auto_approve_all": True
    }
    
    print("🚀 SENDING CAMPAIGN REPORT REQUEST TO CEO AGENT")
    print("=" * 60)
    print("📊 Request: Generate comprehensive marketing campaign report")
    print("🤖 Agent: CEO Orchestrator will handle the workflow")
    print("⚡ Mode: Auto-approval enabled for uninterrupted execution")
    print("=" * 60)
    
    try:
        response = requests.post(
            f"{API_URL}/ceo/execute",
            json=request_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ REQUEST ACCEPTED BY CEO AGENT")
            print(f"🎯 Task ID: {result['task_id']}")
            print(f"📊 Status: {result['status']}")
            print(f"🤖 Orchestrator: {result['orchestrator']}")
            print(f"💬 Message: {result['message']}")
            return result['task_id']
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"Error details: {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return None

def monitor_task(task_id):
    """Monitor task progress by polling."""
    print(f"\n🔍 MONITORING TASK PROGRESS: {task_id}")
    print("=" * 50)
    
    start_time = time.time()
    max_wait = 300  # 5 minutes
    last_progress = -1
    
    while time.time() - start_time < max_wait:
        try:
            response = requests.get(f"{API_URL}/tasks/{task_id}")
            
            if response.status_code == 200:
                status = response.json()
                
                progress = status.get("progress", 0)
                task_status = status.get("status", "unknown")
                current_step = status.get("current_step", "Processing...")
                
                # Show progress updates
                if progress != last_progress:
                    timestamp = datetime.now().strftime("%H:%M:%S")
                    print(f"[{timestamp}] 📊 {progress:.1f}% | {task_status.upper()}")
                    print(f"            🔄 {current_step}")
                    last_progress = progress
                
                # Check if completed
                if task_status in ["completed", "failed", "cancelled"]:
                    print(f"\n🏁 TASK {task_status.upper()}")
                    
                    if task_status == "completed":
                        print("🎉 CAMPAIGN REPORT GENERATED SUCCESSFULLY!")
                        display_results(status)
                    elif task_status == "failed":
                        print("❌ Report generation failed")
                        if status.get("current_step"):
                            print(f"Error: {status['current_step']}")
                    
                    return status
                    
            elif response.status_code == 404:
                print("❌ Task not found")
                return None
            else:
                print(f"❌ Error checking status: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Error checking task status: {e}")
        
        time.sleep(3)  # Wait 3 seconds between checks
    
    print("⏰ Timeout reached - task may still be running")
    return None

def display_results(task_status):
    """Display the campaign report results."""
    print("\n" + "=" * 60)
    print("📊 CAMPAIGN REPORT RESULTS")
    print("=" * 60)
    
    result = task_status.get("result", {})
    
    if result.get("campaign_complete"):
        print("✅ Status: COMPLETED")
    else:
        print("⚠️ Status: PARTIAL COMPLETION")
    
    # Show execution details
    execution_time = result.get("execution_time", "Unknown")
    print(f"⏱️ Execution Time: {execution_time}")
    
    agents_executed = result.get("agents_executed", [])
    if agents_executed:
        print(f"🎯 Agents Used: {len(agents_executed)}")
        print(f"   {' → '.join(agents_executed)}")
    
    # Show workflow summary
    execution_summary = result.get("execution_summary", {})
    if execution_summary:
        print(f"\n📋 Workflow Summary:")
        for key, value in execution_summary.items():
            if isinstance(value, bool):
                icon = "✅" if value else "❌"
                print(f"   {icon} {key.replace('_', ' ').title()}")
    
    # Show generated content preview
    workflow_data = result.get("workflow_data", {})
    if workflow_data:
        print(f"\n📄 Generated Content:")
        for content_type, content in workflow_data.items():
            if isinstance(content, str) and content:
                preview = content[:60] + "..." if len(content) > 60 else content
                print(f"   📊 {content_type.title()}: {preview}")
    
    print("=" * 60)
    print("🎯 Campaign report workflow orchestrated by CEO Agent")

def main():
    """Main execution function."""
    print("📊 MARKETING CAMPAIGN REPORT GENERATOR")
    print("=" * 50)
    print("🤖 Powered by CEO Agent Orchestration")
    print("=" * 50)
    
    # Check API
    if not check_api():
        return
    
    # Request campaign report
    task_id = request_campaign_report()
    if not task_id:
        print("❌ Failed to submit request")
        return
    
    # Monitor progress
    try:
        result = monitor_task(task_id)
        if result:
            print(f"\n✅ Task completed: {task_id}")
        else:
            print(f"\n⚠️ Task may still be running: {task_id}")
            print("💡 You can check status later with: GET /tasks/{task_id}")
    
    except KeyboardInterrupt:
        print(f"\n🛑 Monitoring interrupted")
        print(f"📋 Task ID: {task_id}")
        print("💡 Task continues running in background")

if __name__ == "__main__":
    main() 