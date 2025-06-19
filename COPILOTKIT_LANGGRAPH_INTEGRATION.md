# CopilotKit + LangGraph Integration Guide

## 🚀 Complete Setup for AI Agent Dashboard

This guide shows how to connect your InfluencerFlow frontend AI Agent section to your LangGraph multi-agent backend using CopilotKit.

## 📋 Prerequisites

1. **LangGraph Backend** - Your `langgraph-example` project with CopilotKit integration
2. **React Frontend** - Your `influencerflow-automate-campaigns` project  
3. **Node.js & Python** - Both environments set up
4. **API Keys** - OpenAI API key configured in your backend

## 🏗️ Architecture Overview

```
┌─────────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   React Frontend    │    │   CopilotKit     │    │   LangGraph         │
│   (Port 5173)       │◄──►│   Runtime        │◄──►│   Backend           │
│                     │    │   Proxy          │    │   (Port 8000)       │
│  AI Agent Manager   │    │                  │    │   Multi-Agent       │
│  + CopilotChat      │    │  /api/copilotkit │    │   /copilotkit       │
└─────────────────────┘    └──────────────────┘    └─────────────────────┘
```

## 🔧 Integration Components

### 1. Backend Integration ✅ (Already Done)
Your LangGraph backend is already configured with:
- CopilotKit FastAPI integration at `/copilotkit`
- Campaign agent named `campaign_agent`
- Health check at `/health` and info at `/info`

### 2. Frontend API Route ✅ (Configured)
**File:** `src/app/api/copilotkit/route.ts`
```typescript
import { 
  CopilotRuntime, 
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint 
} from "@copilotkit/runtime";

const runtime = new CopilotRuntime({
  remoteEndpoints: [{
    url: "http://localhost:8000/copilotkit",
  }],
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new OpenAIAdapter({ model: "gpt-4o-mini" }),
    endpoint: "/api/copilotkit",
  });
  return handleRequest(req);
};
```

### 3. AI Agent Manager Component ✅ (Enhanced)
**File:** `src/components/dashboard/AIAgentManager.tsx`

Features:
- 🔍 **Connection monitoring** - Automatically checks backend health
- ⚙️ **Configuration panel** - Adjust backend URL if needed
- 🔄 **Retry mechanism** - Easy reconnection on failures
- 💬 **CopilotChat integration** - Full chat interface with your agents
- 📊 **Status indicators** - Real-time connection status

## 🚀 Quick Start

### Option 1: Automated Startup (Recommended)
```bash
# From the influencerflow-automate-campaigns directory
./start-with-backend.sh
```

This script will:
1. ✅ Start your LangGraph backend on port 8000
2. ✅ Start your React frontend on port 5173  
3. ✅ Monitor both services
4. ✅ Handle graceful shutdown with Ctrl+C

### Option 2: Manual Startup

**Terminal 1 - Backend:**
```bash
cd langgraph-example
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd influencerflow-automate-campaigns
npm run dev
```

## 🎯 Testing the Integration

1. **Open your frontend:** http://localhost:5173
2. **Navigate to:** Dashboard → AI Agent section
3. **Check status:** Should show "Connected to LangGraph Multi-Agent System"
4. **Test chat:** Ask questions like:
   - "Help me plan a campaign"
   - "Find influencers in the tech niche"
   - "Analyze my campaign performance"

## 🔧 Configuration Options

### Environment Variables
Create `.env` in your frontend project:
```env
# Backend Configuration
VITE_LANGGRAPH_BACKEND_URL=http://localhost:8000
VITE_COPILOTKIT_AGENT_NAME=campaign_agent

# For production deployment
VITE_LANGGRAPH_BACKEND_URL=https://your-backend-domain.com
```

### Dynamic Backend URL
The AI Agent Manager includes a settings panel where you can:
- Change the backend URL
- Test connection status
- View integration details

## 🎨 UI Features

### Connection Status Indicators
- 🟢 **Connected** - Green indicator, full functionality
- 🟡 **Connecting** - Yellow pulsing indicator  
- 🔴 **Error** - Red indicator with retry button

### Chat Interface
- **Initial Message** - Welcomes users with available capabilities
- **Placeholder** - Helpful prompt suggestions
- **Full Height** - 650px chat interface
- **Branded** - Matches your app's design system

## 🛠️ Troubleshooting

### Backend Not Starting
```bash
# Check if backend is running
curl http://localhost:8000/health

# Check CopilotKit integration
curl http://localhost:8000/info
```

### Frontend Connection Issues
1. Check the browser console for errors
2. Verify the backend URL in settings
3. Ensure both services are running
4. Check CORS configuration in your backend

### Common Error Messages
- **"Failed to connect"** → Backend not running
- **"CopilotKit not available"** → Backend missing CopilotKit integration
- **"Runtime error"** → Check API route configuration

## 🚀 Production Deployment

### Backend Deployment
1. Deploy your LangGraph backend to a cloud service
2. Update the backend URL in your frontend environment
3. Ensure proper CORS configuration

### Frontend Deployment  
1. Update `VITE_LANGGRAPH_BACKEND_URL` to your production backend
2. Build and deploy your React app
3. Test the integration in production

## 🎯 Available Agent Capabilities

Your LangGraph multi-agent system provides:

- **🎯 Campaign Planning** - Strategy and goal setting
- **👥 Influencer Discovery** - Find and analyze creators
- **📝 Contract Generation** - Automated contract creation
- **📧 Email Automation** - Outreach and follow-ups  
- **📞 Call Scheduling** - Phone call management
- **📊 Performance Analysis** - Campaign analytics
- **💰 Budget Management** - ROI and financial planning

## 🔗 Integration Architecture

```
Frontend Components:
├── AIAgentManager.tsx (Main UI)
├── /api/copilotkit/route.ts (Runtime proxy)
└── CopilotKit + CopilotChat (UI components)

Backend Endpoints:
├── /copilotkit (CopilotKit integration)
├── /health (Health check)
├── /info (Integration info)
└── /v1/chat/completions (OpenAI-compatible)

Agent System:
├── campaign_agent (Main LangGraph agent)
├── Multi-agent workflows
└── Tool integrations (email, calls, contracts)
```

## 🎉 Success!

Once everything is running, you'll have:
- ✅ Real-time AI agent chat in your dashboard
- ✅ Full campaign management capabilities  
- ✅ Seamless LangGraph integration
- ✅ Production-ready architecture
- ✅ Monitoring and error handling

Navigate to your AI Agent section and start chatting with your intelligent campaign assistant! 🤖✨ 