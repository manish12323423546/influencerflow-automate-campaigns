# Marketing Campaign Report Client Usage

This document explains how to use the campaign report client scripts to generate comprehensive marketing reports through the CEO Agent orchestration system.

## Overview

The campaign report client sends requests to the AI Agents API to generate detailed marketing campaign reports. The CEO Agent orchestrates the entire workflow, coordinating multiple specialized agents to create comprehensive reports.

## Files Created

1. **`simple_campaign_report.py`** - Simple, easy-to-use client
2. **`campaign_report_client.py`** - Full-featured client with WebSocket support
3. **`run_campaign_report.sh`** - Shell script for easy execution
4. **Test files** - Comprehensive test suite

## Quick Start

### Option 1: Using the Shell Script (Recommended)

```bash
cd api
./run_campaign_report.sh
```

The shell script will:
- ✅ Check Python installation
- ✅ Activate virtual environment (if available)
- ✅ Install required packages
- ✅ Check if AI Agents API is running
- ✅ Run the selected client

### Option 2: Direct Python Execution

```bash
cd api

# Activate virtual environment (if you have one)
source venv/bin/activate

# Install requirements
pip install requests

# Run simple client
python3 simple_campaign_report.py

# OR run full-featured client
python3 campaign_report_client.py
```

## Prerequisites

### 1. Start the AI Agents API

In one terminal window:

```bash
cd api
source venv/bin/activate  # If using virtual environment
python3 ai_agents.py
```

You should see:
```
✅ Successfully imported LangGraph agents - CEO orchestration ready
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
🚀 Starting CEO-Centric AI Agents API...
👔 All workflows will be orchestrated by the CEO Agent
✅ LangGraph integration active - Full workflow execution available
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 2. Install Client Dependencies

```bash
pip install requests websockets  # For full client
# OR
pip install requests  # For simple client only
```

## Usage Examples

### Simple Campaign Report

The simple client automatically generates a comprehensive marketing campaign report:

```bash
python3 simple_campaign_report.py
```

### Custom Campaign Report

The full-featured client allows customization:

```bash
python3 campaign_report_client.py
```

Then enter:
- Recipient email (optional)
- Phone number (optional) 
- Custom campaign details (or press Enter for default)

### Example Report Query

The default query generates reports covering:

- **📊 Campaign Performance Analysis**
  - Key metrics and KPIs
  - ROI and conversion rates
  - Audience engagement statistics

- **🤝 Influencer Partnership Results**
  - Top performing influencers
  - Content performance breakdown
  - Partnership ROI assessment

- **📱 Content Strategy Assessment**
  - Most successful content types
  - Platform-specific performance
  - Viral content analysis

- **💰 Financial Summary**
  - Budget allocation and spending
  - Cost per acquisition analysis
  - Revenue attribution

- **🎯 Strategic Recommendations**
  - Improvement areas
  - Budget optimization
  - Future opportunities

## How It Works

### CEO Agent Orchestration

1. **Query Analysis**: CEO Agent analyzes the campaign report request
2. **Workflow Planning**: Determines which specialized agents to use
3. **Agent Coordination**: Orchestrates Discovery, Content, Contract, Gmail, and Report agents
4. **Progress Tracking**: Provides real-time updates on workflow progress
5. **Result Compilation**: Combines outputs from all agents into comprehensive report

### Agent Workflow Sequence

```
CEO Agent → Discovery Agent → Content Agent → Report Agent → Gmail Agent
    ↓           ↓              ↓              ↓           ↓
  Planning → Research → Content Creation → Report Gen → Delivery
```

### Monitoring Options

1. **Polling Monitor** (Default): Checks status every 3 seconds
2. **WebSocket Monitor**: Real-time updates via WebSocket connection

## Expected Output

### Successful Execution

```
📊 MARKETING CAMPAIGN REPORT GENERATOR
==================================================
✅ AI Agents API is running
🚀 SENDING CAMPAIGN REPORT REQUEST TO CEO AGENT
============================================================
✅ REQUEST ACCEPTED BY CEO AGENT
🎯 Task ID: abc123-def456-ghi789
📊 Status: queued
🤖 Orchestrator: CEO Agent

🔍 MONITORING TASK PROGRESS: abc123-def456-ghi789
==================================================
[14:30:15] 📊 15.0% | RUNNING
            🔄 CEO Agent: Starting workflow execution...
[14:30:18] 📊 45.0% | RUNNING
            🔄 Discovery Agent: Analyzing campaign data...
[14:30:21] 📊 75.0% | RUNNING
            🔄 Report Agent: Generating comprehensive report...
[14:30:24] 📊 100.0% | COMPLETED
            🔄 CEO Agent: Workflow execution completed

🏁 TASK COMPLETED
🎉 CAMPAIGN REPORT GENERATED SUCCESSFULLY!

============================================================
📊 CAMPAIGN REPORT RESULTS
============================================================
✅ Status: COMPLETED
⏱️ Execution Time: 12.3 seconds
🎯 Agents Used: 4
   Discovery Agent → Content Agent → Report Agent → Gmail Agent
```

## Troubleshooting

### Common Issues

1. **API Not Running**
   ```
   ❌ Cannot connect to AI Agents API
   💡 Make sure to run: python3 ai_agents.py
   ```
   **Solution**: Start the AI Agents API in another terminal

2. **Python Command Not Found**
   ```
   zsh: command not found: python
   ```
   **Solution**: Use `python3` instead or create an alias

3. **Missing Dependencies**
   ```
   ModuleNotFoundError: No module named 'requests'
   ```
   **Solution**: Install requirements: `pip install requests`

4. **Virtual Environment Issues**
   ```
   ❌ Package not found
   ```
   **Solution**: Activate virtual environment: `source venv/bin/activate`

### Debugging

1. **Check API Health**:
   ```bash
   curl http://localhost:8000/health
   ```

2. **View Active Tasks**:
   ```bash
   curl http://localhost:8000/tasks
   ```

3. **Check Specific Task**:
   ```bash
   curl http://localhost:8000/tasks/{task-id}
   ```

## Testing

Run the test suite to verify everything works:

```bash
# Install test dependencies
pip install -r test_requirements.txt

# Run tests
python3 run_tests.py --all

# Or run specific tests
python3 run_tests.py --ceo --workflow
```

## Customization

### Custom Report Queries

Edit the query in `simple_campaign_report.py` or provide custom input in the full client:

```python
campaign_query = """
Generate a quarterly marketing performance report focusing on:
- Social media engagement trends
- Email marketing conversion rates  
- Paid advertising ROI by platform
- Customer acquisition cost analysis
- Brand sentiment analysis
"""
```

### Configuration

Modify these variables in the scripts:

```python
API_URL = "http://localhost:8000"  # Change if API runs elsewhere
max_wait = 300  # Maximum wait time in seconds
```

## Support

If you encounter issues:

1. Check the AI Agents API logs
2. Verify all dependencies are installed
3. Ensure virtual environment is activated
4. Run the test suite to identify problems
5. Check network connectivity to localhost:8000

The CEO Agent orchestration system is designed to handle complex workflows automatically, providing comprehensive campaign reports through intelligent agent coordination. 