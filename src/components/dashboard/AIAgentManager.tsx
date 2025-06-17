import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { CopilotChat } from "@copilotkit/react-ui";
import { CopilotKit } from "@copilotkit/react-core";

const AIAgentManager: React.FC = () => {
  return (
    <CopilotKit 
      publicApiKey="ck_pub_b29645000abf6b393417b16c2560b9b4"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              AI Campaign Assistant
            </CardTitle>
            <p className="text-sm text-gray-600">
              Chat with your AI campaign assistant to get help with campaign planning, execution, and analysis
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] border rounded-lg overflow-hidden">
              <CopilotChat 
                className="h-full"
                labels={{
                  title: "AI Campaign Assistant",
                  initial: "Hi! I'm your AI campaign assistant. How can I help you today?"
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </CopilotKit>
  );
};

export default AIAgentManager; 