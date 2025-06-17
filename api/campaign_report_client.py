#!/usr/bin/env python3
"""
Marketing Campaign Report Client

This script sends a request to the AI Agents API to generate a comprehensive
marketing campaign report through the CEO agent orchestration system.
"""

import requests
import json
import time
import asyncio
import websockets
import uuid
from datetime import datetime
from typing import Dict, Any

# Configuration
API_BASE_URL = "http://localhost:8000"
WEBSOCKET_URL = "ws://localhost:8000"

class CampaignReportClient:
    """Client for requesting campaign reports from the CEO agent."""
    
    def __init__(self, base_url: str = API_BASE_URL):
        self.base_url = base_url
        self.session = requests.Session()
        self.client_id = str(uuid.uuid4())
        
    def check_api_health(self) -> bool:
        """Check if the API is healthy and responsive."""
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=5)
            if response.status_code == 200:
                health_data = response.json()
                print(f"✅ API Health Check: {health_data['status']}")
                print(f"🤖 CEO Agent: {health_data['ceo_agent']}")
                print(f"🧠 LangGraph: {health_data['langgraph']}")
                return True
            else:
                print(f"❌ API health check failed: {response.status_code}")
                return False
        except requests.RequestException as e:
            print(f"❌ Cannot connect to API: {e}")
            print("💡 Make sure the AI agents API is running: python3 ai_agents.py")
            return False
    
    def get_ceo_info(self) -> Dict[str, Any]:
        """Get CEO agent information and capabilities."""
        try:
            response = self.session.get(f"{self.base_url}/ceo/info")
            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ Failed to get CEO info: {response.status_code}")
                return {}
        except requests.RequestException as e:
            print(f"❌ Error getting CEO info: {e}")
            return {}
    
    def request_campaign_report(self, 
                              campaign_details: str = None,
                              recipient_email: str = None,
                              phone_number: str = None,
                              priority: str = "high") -> Dict[str, Any]:
        """Request a marketing campaign report from the CEO agent."""
        
        # Default campaign report query if none provided
        if not campaign_details:
            campaign_details = """
            Generate a comprehensive marketing campaign report that includes:
            
            1. Campaign Performance Analysis
               - Key metrics and KPIs
               - ROI and conversion rates
               - Audience engagement statistics
               
            2. Influencer Partnership Results
               - Top performing influencers
               - Content performance breakdown
               - Collaboration effectiveness
               
            3. Content Strategy Assessment
               - Most successful content types
               - Platform-specific performance
               - Viral content analysis
               
            4. Financial Summary
               - Budget allocation and spending
               - Cost per acquisition
               - Revenue attribution
               
            5. Recommendations and Next Steps
               - Strategic improvements
               - Budget optimization suggestions
               - Future campaign opportunities
               
            Please include data visualizations, actionable insights, and executive summary.
            """
        
        # Prepare the CEO agent query
        query_data = {
            "query": campaign_details.strip(),
            "mode": "campaign",
            "recipient_email": recipient_email or "",
            "phone_number": phone_number or "",
            "priority": priority,
            "requires_approval": False,
            "testing_mode": True,  # Enable for uninterrupted execution
            "auto_approve_all": True  # Auto-approve all workflow steps
        }
        
        print("🚀 Sending Marketing Campaign Report Request to CEO Agent")
        print("=" * 70)
        print(f"📋 Query: {campaign_details[:100]}...")
        print(f"📧 Email: {recipient_email or 'Not specified'}")
        print(f"📞 Phone: {phone_number or 'Not specified'}")
        print(f"⚡ Priority: {priority}")
        print(f"🧠 Mode: Testing (auto-approval enabled)")
        print("=" * 70)
        
        try:
            response = self.session.post(
                f"{self.base_url}/ceo/execute",
                json=query_data,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Request accepted by CEO Agent")
                print(f"🎯 Task ID: {result['task_id']}")
                print(f"📊 Status: {result['status']}")
                print(f"🤖 Orchestrator: {result['orchestrator']}")
                print(f"💬 Message: {result['message']}")
                return result
            else:
                print(f"❌ Request failed: {response.status_code}")
                print(f"Error: {response.text}")
                return {"error": f"HTTP {response.status_code}", "details": response.text}
                
        except requests.RequestException as e:
            print(f"❌ Request error: {e}")
            return {"error": "Request failed", "details": str(e)}
    
    def check_task_status(self, task_id: str) -> Dict[str, Any]:
        """Check the status of a specific task."""
        try:
            response = self.session.get(f"{self.base_url}/tasks/{task_id}")
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 404:
                return {"error": "Task not found"}
            else:
                return {"error": f"HTTP {response.status_code}"}
        except requests.RequestException as e:
            return {"error": str(e)}
    
    def monitor_task_progress(self, task_id: str, max_wait_time: int = 300):
        """Monitor task progress with polling."""
        print(f"\n🔍 Monitoring Task Progress: {task_id}")
        print("=" * 50)
        
        start_time = time.time()
        last_progress = -1
        
        while time.time() - start_time < max_wait_time:
            status = self.check_task_status(task_id)
            
            if "error" in status:
                print(f"❌ Error checking status: {status['error']}")
                break
            
            current_progress = status.get("progress", 0)
            task_status = status.get("status", "unknown")
            current_step = status.get("current_step", "No details")
            
            # Only print updates when progress changes
            if current_progress != last_progress:
                timestamp = datetime.now().strftime("%H:%M:%S")
                print(f"[{timestamp}] 📊 Progress: {current_progress:.1f}% | Status: {task_status}")
                print(f"           🔄 Step: {current_step}")
                last_progress = current_progress
            
            # Check if completed
            if task_status in ["completed", "failed", "cancelled"]:
                print(f"\n🏁 Task {task_status.upper()}")
                
                if task_status == "completed":
                    print("🎉 Marketing Campaign Report Generated Successfully!")
                    
                    # Display results if available
                    if "result" in status and status["result"]:
                        self.display_campaign_report_results(status["result"])
                    else:
                        print("📊 Report completed - check task details for full results")
                        
                elif task_status == "failed":
                    print("❌ Report generation failed")
                    if "message" in status:
                        print(f"Error: {status['message']}")
                
                return status
            
            time.sleep(2)  # Poll every 2 seconds
        
        print(f"⏰ Monitoring timeout after {max_wait_time} seconds")
        return self.check_task_status(task_id)
    
    def display_campaign_report_results(self, result: Dict[str, Any]):
        """Display the campaign report results in a formatted way."""
        print("\n" + "=" * 70)
        print("📊 MARKETING CAMPAIGN REPORT RESULTS")
        print("=" * 70)
        
        # Basic execution info
        if result.get("campaign_complete"):
            print("✅ Campaign Analysis: COMPLETED")
        else:
            print("⚠️ Campaign Analysis: PARTIAL")
            
        print(f"⏱️ Execution Time: {result.get('execution_time', 'Unknown')}")
        print(f"🤖 Orchestrated by: {result.get('orchestrator', 'CEO Agent')}")
        
        # Agents executed
        agents_executed = result.get("agents_executed", [])
        if agents_executed:
            print(f"\n🎯 Agents Executed ({len(agents_executed)}):")
            workflow_sequence = result.get("workflow_sequence", " → ".join(agents_executed))
            print(f"   {workflow_sequence}")
        
        # Execution summary
        execution_summary = result.get("execution_summary", {})
        if execution_summary:
            print(f"\n📋 Execution Summary:")
            for key, value in execution_summary.items():
                if isinstance(value, bool):
                    status = "✅" if value else "❌"
                    print(f"   {status} {key.replace('_', ' ').title()}: {value}")
                elif isinstance(value, list):
                    print(f"   📝 {key.replace('_', ' ').title()}: {len(value)} items")
        
        # Workflow data preview
        workflow_data = result.get("workflow_data", {})
        if workflow_data:
            print(f"\n📊 Generated Content Preview:")
            for key, value in workflow_data.items():
                if isinstance(value, str) and len(value) > 0:
                    preview = value[:80] + "..." if len(value) > 80 else value
                    print(f"   📄 {key.title()}: {preview}")
        
        # Tasks completed
        tasks_completed = execution_summary.get("tasks_completed", [])
        if tasks_completed:
            print(f"\n✅ Completed Tasks:")
            for task in tasks_completed:
                print(f"   • {task}")
        
        print("=" * 70)
        print("🎯 Report generation workflow completed by CEO Agent")
        print("💡 Full results available in task details")
    
    async def websocket_monitor(self, task_id: str):
        """Monitor task progress via WebSocket for real-time updates."""
        uri = f"{WEBSOCKET_URL}/ws/{self.client_id}"
        
        try:
            async with websockets.connect(uri) as websocket:
                # Subscribe to task updates
                subscribe_message = {
                    "type": "subscribe_task",
                    "task_id": task_id
                }
                await websocket.send(json.dumps(subscribe_message))
                
                print(f"🔌 Connected to WebSocket for real-time updates")
                print(f"📡 Subscribed to task: {task_id}")
                
                while True:
                    try:
                        message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                        data = json.loads(message)
                        
                        if data.get("type") == "task_update":
                            timestamp = datetime.now().strftime("%H:%M:%S")
                            progress = data.get("progress", 0)
                            status = data.get("status", "unknown")
                            message_text = data.get("message", "")
                            
                            print(f"[{timestamp}] 🔄 {progress:.1f}% | {status} | {message_text}")
                            
                            if status in ["completed", "failed", "cancelled"]:
                                print(f"🏁 WebSocket: Task {status}")
                                break
                                
                    except asyncio.TimeoutError:
                        continue
                    except websockets.exceptions.ConnectionClosed:
                        print("🔌 WebSocket connection closed")
                        break
                        
        except Exception as e:
            print(f"❌ WebSocket error: {e}")

def main():
    """Main function to execute the campaign report request."""
    print("🚀 Marketing Campaign Report Generator")
    print("=" * 60)
    print("📊 This script requests a comprehensive marketing campaign report")
    print("🤖 through the CEO Agent orchestration system")
    print("=" * 60)
    
    # Initialize client
    client = CampaignReportClient()
    
    # Check API health
    if not client.check_api_health():
        print("\n💡 To start the API, run: python3 ai_agents.py")
        return
    
    # Get CEO agent info
    print("\n🤖 CEO Agent Information:")
    ceo_info = client.get_ceo_info()
    if ceo_info:
        print(f"   Agent: {ceo_info.get('agent_name', 'Unknown')}")
        print(f"   Version: {ceo_info.get('version', 'Unknown')}")
        print(f"   LangGraph: {'✅ Available' if ceo_info.get('langgraph_available') else '❌ Unavailable'}")
        print(f"   Active Tasks: {ceo_info.get('active_tasks', 0)}")
    
    # Get user input for customization
    print("\n📝 Campaign Report Configuration:")
    
    # Ask for recipient email
    recipient_email = input("📧 Recipient email (optional, press Enter to skip): ").strip()
    if not recipient_email:
        recipient_email = None
    
    # Ask for phone number
    phone_number = input("📞 Phone number (optional, press Enter to skip): ").strip()
    if not phone_number:
        phone_number = None
    
    # Ask for custom campaign details
    print("\n💭 Custom campaign details (press Enter for default comprehensive report):")
    custom_query = input("Query: ").strip()
    
    # Request the campaign report
    result = client.request_campaign_report(
        campaign_details=custom_query if custom_query else None,
        recipient_email=recipient_email,
        phone_number=phone_number,
        priority="high"
    )
    
    if "error" in result:
        print(f"❌ Failed to submit request: {result['error']}")
        return
    
    task_id = result.get("task_id")
    if not task_id:
        print("❌ No task ID received")
        return
    
    # Choose monitoring method
    print(f"\n🔍 Monitoring Options:")
    print("1. Polling (recommended)")
    print("2. WebSocket (real-time)")
    
    choice = input("Choose monitoring method (1 or 2, default=1): ").strip()
    
    if choice == "2":
        # WebSocket monitoring
        try:
            asyncio.run(client.websocket_monitor(task_id))
        except KeyboardInterrupt:
            print("\n🛑 Monitoring interrupted by user")
        
        # Get final status
        final_status = client.check_task_status(task_id)
        if "result" in final_status and final_status["result"]:
            client.display_campaign_report_results(final_status["result"])
    else:
        # Polling monitoring
        try:
            final_status = client.monitor_task_progress(task_id, max_wait_time=300)
        except KeyboardInterrupt:
            print("\n🛑 Monitoring interrupted by user")
            final_status = client.check_task_status(task_id)
    
    print("\n🎯 Campaign Report Request Completed")
    print(f"📋 Task ID: {task_id}")
    print("💡 You can check the task status later using the task ID")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n🛑 Script interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc() 