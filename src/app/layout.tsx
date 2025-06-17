import { ReactNode } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CopilotKit
          runtimeUrl="/api/copilotkit"
          agent="campaign_agent" // The name of the agent we defined in route.ts
        >
          {children}
        </CopilotKit>
      </body>
    </html>
  );
} 