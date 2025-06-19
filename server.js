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

const runtime = new CopilotRuntime({
  remoteEndpoints: [
    // Connect to your external LangGraph deployment
    // Note: Using /copilotkit/ (with trailing slash) as per API response
    { 
      url: "http://localhost:8000/copilotkit/"
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
    external_api: 'http://localhost:8000/copilotkit/',
    local_langgraph: process.env.LANGGRAPH_API_URL || 'http://localhost:8000',
    integration_type: 'Self-hosted FastAPI LangGraph',
    copilotkit_version: require('./package.json').dependencies['@copilotkit/runtime']
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
  console.log(`🔗 External LangGraph API: http://localhost:8000/copilotkit/`);
  console.log(`🏠 Local LangGraph API: ${process.env.LANGGRAPH_API_URL || 'http://localhost:8000'}`);
  console.log(`💚 Health check: http://localhost:${port}/health`);
  console.log(`📚 Integration: Self-hosted FastAPI LangGraph + CopilotKit`);
}); 