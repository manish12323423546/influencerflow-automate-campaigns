import React from 'react';
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

const TestCopilot: React.FC = () => {
  return (
    <CopilotKit
      runtimeUrl="http://localhost:3001/api/copilotkit"
      agent="campaign_agent"
    >
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-2xl font-bold mb-4">Copilot Test Page</h1>
        <p className="mb-8">This is a simple test page to verify that the CopilotKit integration is working.</p>
        
        <div className="border rounded-lg overflow-hidden h-[600px] max-w-3xl mx-auto">
          <CopilotChat
            instructions="You are a helpful campaign assistant for InfluencerFlow. Help users plan, execute, and analyze their influencer marketing campaigns."
            labels={{
              title: "Test Campaign Assistant",
              initial: "Hi! 👋 I'm your test AI campaign assistant. How can I help you today?",
              placeholder: "Ask me a question...",
            }}
          />
        </div>
      </div>
    </CopilotKit>
  );
};

export default TestCopilot; 