import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
  LangGraphAgent
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";
 
// You can use any service adapter here for multi-agent support.
const serviceAdapter = new ExperimentalEmptyAdapter();
 
const runtime = new CopilotRuntime({
  agents: { 
    // Using the LangGraph agent from the langgraph-example-1 project
    'campaign_agent': new LangGraphAgent({
      deploymentUrl: process.env.LANGGRAPH_API_URL || 'http://localhost:8000',
      graphId: 'campaign_agent',
      langsmithApiKey: process.env.LANGSMITH_API_KEY, // Optional
    }),
  },
});
 
export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });
 
  return handleRequest(req);
}; 