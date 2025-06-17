# Copilot Setup Instructions

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# LangGraph API Configuration
LANGGRAPH_API_URL=http://localhost:8000
LANGSMITH_API_KEY=your_langsmith_api_key_here

# Copilot Configuration (for production)
COPILOTKIT_API_KEY=your_copilotkit_api_key_here
```

Replace the placeholder values with your actual API keys:
- `your_langsmith_api_key_here`: Your LangSmith API key if you're using LangSmith
- `your_copilotkit_api_key_here`: Your CopilotKit API key for production environments

Note: For local development, you typically don't need to set the COPILOTKIT_API_KEY.

## Installation

Install the required dependencies:

```bash
npm install @copilotkit/runtime @copilotkit/react-core @copilotkit/react-ui class-validator
```

## Components Added

1. **Copilot Runtime Endpoint**: Created at `/src/app/api/copilotkit/route.ts`
2. **CopilotKit Provider**: Added to `App.tsx` to wrap the entire application
3. **CopilotChat Component**: Added to the AIAgentManager component
4. **Test Page**: Created at `/src/test-copilot.tsx` and accessible at `/test-copilot`

## Troubleshooting

If you encounter the error:
```
Error: Remember to wrap your app in a `<CopilotKit> {...} </CopilotKit>` !!!
```

This means the CopilotKit provider is not properly wrapping your components. We've fixed this by:

1. Adding the CopilotKit provider in the App.tsx file to wrap the entire application
2. Creating a test page at `/test-copilot` that demonstrates the correct usage

## Using the AI Chat

The AI Chat has been simplified in the AIAgentManager component. You can access it by clicking on the "AI Agents" tab in the dashboard.

## LangGraph Integration

The Copilot Runtime is configured to use the LangGraph agent from the `langgraph-example-1` project. The agent is identified as `campaign_agent` in the Copilot Runtime configuration.

## Testing the Integration

To verify that the integration is working correctly:

1. Start your development server
2. Navigate to `/test-copilot` to see a standalone test page
3. Or go to the dashboard and click on the "AI Agents" tab

Make sure your LangGraph agent is running and accessible at the URL specified in your environment variables. 