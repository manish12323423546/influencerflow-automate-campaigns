const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { CopilotRuntime, LangGraphAgent } = require('@copilotkit/runtime');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Create the CopilotRuntime instance
const runtime = new CopilotRuntime({
  agents: { 
    'campaign_agent': new LangGraphAgent({
      deploymentUrl: process.env.LANGGRAPH_API_URL || 'http://localhost:8000',
      graphId: 'campaign_agent',
      langsmithApiKey: process.env.LANGSMITH_API_KEY,
    }),
  },
});

// CopilotKit API endpoint
app.post('/api/copilotkit', async (req, res) => {
  try {
    console.log('Received request to /api/copilotkit');
    
    // Process the request with the CopilotRuntime
    const result = await runtime.process(req.body);
    
    // Send the response back to the client
    res.json(result);
  } catch (error) {
    console.error('Error processing CopilotKit request:', error);
    res.status(500).json({ error: error.message });
  }
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
  console.log(`Server running on port ${port}`);
  console.log(`CopilotKit API available at http://localhost:${port}/api/copilotkit`);
}); 