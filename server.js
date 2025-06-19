const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNodeHttpEndpoint,
} = require('@copilotkit/runtime');
const path = require('path');
require('dotenv').config();

const app = express();
// Use a specific port for CopilotKit proxy (not conflicting with LangGraph on 8000)
const port = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Create the CopilotKit runtime with external endpoint
const serviceAdapter = new ExperimentalEmptyAdapter();

// Force the local endpoint configuration
const LOCAL_BACKEND_URL = "http://localhost:8000/copilotkit/";

console.log(`🔧 FORCING CopilotKit to use LOCAL BACKEND: ${LOCAL_BACKEND_URL}`);
console.log(`🚨 If you see any references to 'project-x-c0ml.onrender.com', there's a configuration issue!`);

const runtime = new CopilotRuntime({
  remoteEndpoints: [
    { 
      url: LOCAL_BACKEND_URL
    },
  ],
});

// CopilotKit API endpoint using the new runtime approach
const copilotKitEndpoint = copilotRuntimeNodeHttpEndpoint({
  runtime,
  serviceAdapter,
  endpoint: "/api/copilotkit",
});

app.use("/api/copilotkit", copilotKitEndpoint);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'CopilotKit proxy server running',
    forced_local_backend: LOCAL_BACKEND_URL,
    local_langgraph: process.env.LANGGRAPH_API_URL || 'http://localhost:8000',
    integration_type: 'Self-hosted FastAPI LangGraph + LOCAL BACKEND ONLY',
    copilotkit_version: require('./package.json').dependencies['@copilotkit/runtime'],
    warning: 'If you see any remote URLs, clear your browser cache!'
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Start the server
app.listen(port, () => {
  console.log(`🚀 CopilotKit Proxy Server running on port ${port}`);
  console.log(`📡 CopilotKit API available at http://localhost:${port}/api/copilotkit`);
  console.log(`🏠 FORCED Local Backend: ${LOCAL_BACKEND_URL}`);
  console.log(`💚 Health check: http://localhost:${port}/health`);
  console.log(`📚 Integration: Self-hosted FastAPI LangGraph + CopilotKit`);
  console.log(`🚨 IMPORTANT: Browser cache may need clearing if you see remote URL errors!`);
}); 