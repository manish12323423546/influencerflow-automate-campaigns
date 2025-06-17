# InfluencerFlow AI Agents API

A comprehensive FastAPI backend that integrates with LangGraph agents for campaign management, influencer discovery, and workflow automation.

## Features

- 🤖 **Multi-Agent System**: Campaign, Discover, Content, Contract, Gmail, and Report agents
- 🔄 **Real-time Progress Tracking**: WebSocket connections for live updates
- 👤 **Human-in-the-Loop**: Approval workflows for agent decisions
- 📊 **Workflow Visualization**: LangGraph Studio-like interface
- 🎯 **Task Management**: Queue, monitor, and control agent executions
- 📈 **Analytics**: Performance metrics and execution history

## Quick Start

### 1. Install Dependencies

```bash
cd api
pip install -r requirements.txt
```

### 2. Set Up Environment

Create a `.env` file in the `api` directory:

```env
# API Configuration
HOST=0.0.0.0
PORT=8001
RELOAD=true

# LangGraph Configuration (if using LangGraph Studio)
LANGGRAPH_API_URL=your_langgraph_api_url
LANGCHAIN_TRACING_V2=false

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Anthropic Configuration (optional)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### 3. Start the Server

```bash
# Using the startup script
python start.py

# Or directly with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### 4. Access the API

- **API Docs**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc
- **Health Check**: http://localhost:8001/health

## API Endpoints

### Agent Execution

- `POST /agents/execute` - Execute an AI agent
- `GET /agents/available` - List available agents
- `GET /agents/metrics` - Get agent performance metrics

### Task Management

- `GET /tasks` - List all tasks
- `GET /tasks/{task_id}` - Get specific task
- `POST /tasks/{task_id}/cancel` - Cancel a task
- `DELETE /tasks/{task_id}` - Delete a task

### Human-in-the-Loop

- `POST /tasks/{task_id}/approve` - Approve/reject a paused task
- `GET /workflows/graph/{task_id}` - Get workflow visualization

### WebSocket

- `WS /ws/{client_id}` - Real-time task updates

## Usage Examples

### 1. Execute a Campaign Agent

```python
import requests

response = requests.post("http://localhost:8001/agents/execute", json={
    "query": "Create a tech influencer campaign for our new smartphone launch",
    "agent_type": "campaign",
    "mode": "campaign",
    "requires_approval": True,
    "priority": "high"
})

task_id = response.json()["task_id"]
print(f"Task started: {task_id}")
```

### 2. Monitor Task Progress

```python
import requests

task_id = "your-task-id"
response = requests.get(f"http://localhost:8001/tasks/{task_id}")
task = response.json()

print(f"Status: {task['status']}")
print(f"Progress: {task['progress']}%")
print(f"Current Step: {task['current_step']}")
```

### 3. Approve a Paused Task

```python
import requests

task_id = "your-task-id"
response = requests.post(f"http://localhost:8001/tasks/{task_id}/approve", json={
    "task_id": task_id,
    "approval_type": "content",
    "approved": True,
    "feedback": "Content looks great!"
})
```

### 4. WebSocket Connection (JavaScript)

```javascript
const ws = new WebSocket('ws://localhost:8001/ws/client_123');

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
    if (message.type === 'task_update') {
        console.log(`Task ${message.task_id}: ${message.status}`);
    } else if (message.type === 'approval_request') {
        console.log(`Approval needed for ${message.approval_type}`);
    }
};

// Subscribe to task updates
ws.send(JSON.stringify({
    type: 'subscribe_task',
    task_id: 'your-task-id'
}));
```

## Available Agents

### 1. Campaign Agent
- **Purpose**: Create and manage marketing campaigns
- **Capabilities**: Campaign creation, analysis, budget optimization
- **Usage**: `"agent_type": "campaign"`

### 2. Discover Agent
- **Purpose**: Find and analyze influencers
- **Capabilities**: Influencer search, audience analysis, engagement metrics
- **Usage**: `"agent_type": "discover"`

### 3. Content Agent
- **Purpose**: Generate and optimize content
- **Capabilities**: Content creation, copywriting, optimization
- **Usage**: `"agent_type": "content"`

### 4. Contract Agent
- **Purpose**: Draft and manage contracts
- **Capabilities**: Contract drafting, legal review, terms negotiation
- **Usage**: `"agent_type": "contract"`

### 5. Gmail Agent
- **Purpose**: Automate email communications
- **Capabilities**: Email automation, follow-up sequences, response handling
- **Usage**: `"agent_type": "gmail"`

### 6. Report Agent
- **Purpose**: Generate comprehensive reports
- **Capabilities**: Performance analysis, ROI calculation, data visualization
- **Usage**: `"agent_type": "report"`

### 7. CEO Orchestrator
- **Purpose**: Coordinate multiple agents
- **Capabilities**: Workflow orchestration, task routing, decision making
- **Usage**: `"agent_type": "ceo"`

## Human-in-the-Loop Workflows

The system supports several approval types:

1. **Strategy Approval**: Review campaign strategies before execution
2. **Content Approval**: Review generated content before publishing
3. **Contract Approval**: Review contract terms before sending
4. **Email Send Approval**: Review emails before sending

## Error Handling

The API includes comprehensive error handling:

- **Validation Errors**: 422 with detailed field errors
- **Not Found**: 404 for missing resources
- **Server Errors**: 500 with error details
- **WebSocket Errors**: Automatic reconnection attempts

## Development

### Running in Development Mode

```bash
# With auto-reload
python start.py

# With debug logging
UVICORN_LOG_LEVEL=debug python start.py
```

### Testing

```bash
# Run basic health check
curl http://localhost:8001/health

# Test agent execution
curl -X POST http://localhost:8001/agents/execute \
  -H "Content-Type: application/json" \
  -d '{"query": "Test campaign creation", "mode": "campaign"}'
```

## Deployment

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8001

CMD ["python", "start.py"]
```

### Environment Variables

For production, set these environment variables:

```env
HOST=0.0.0.0
PORT=8001
RELOAD=false
OPENAI_API_KEY=your_production_key
SUPABASE_URL=your_production_url
SUPABASE_KEY=your_production_key
```

## Troubleshooting

### Common Issues

1. **LangGraph Import Error**
   - Ensure the `langgraph-example-1` directory exists
   - Check Python path configuration
   - Verify all dependencies are installed

2. **WebSocket Connection Failed**
   - Check firewall settings
   - Verify port 8001 is available
   - Ensure no proxy blocking WebSocket upgrades

3. **Agent Execution Timeout**
   - Check API key configuration
   - Verify network connectivity
   - Review agent implementation for infinite loops

### Logs

The server logs all important events:

```bash
# Check server logs
tail -f api.log

# Debug WebSocket connections
grep "WebSocket" api.log
```

## Support

For issues and questions:

1. Check the API documentation at `/docs`
2. Review the troubleshooting section
3. Check server logs for detailed error messages
4. Test with simple queries first

## License

This project is part of the InfluencerFlow platform. 