import { 
  CopilotRuntime, 
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint 
} from "@copilotkit/runtime";
import { NextRequest, NextResponse } from "next/server";

// ABSOLUTELY FORCED backend URL - NO variables, NO overrides
const FORCED_BACKEND_URL = "http://localhost:8000";
const FORCED_COPILOT_ENDPOINT = `${FORCED_BACKEND_URL}/copilotkit`;

// Enhanced logging utility for API route
const log = (level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const prefix = `[CopilotKit-API ${timestamp}]`;
  
  switch (level) {
    case 'info':
      console.log(`${prefix} ℹ️ ${message}`, data || '');
      break;
    case 'warn':
      console.warn(`${prefix} ⚠️ ${message}`, data || '');
      break;
    case 'error':
      console.error(`${prefix} ❌ ${message}`, data || '');
      break;
    case 'debug':
      console.debug(`${prefix} 🔍 ${message}`, data || '');
      break;
  }
};

// Force log the configuration on module load
console.log('🚨🚨🚨 COPILOTKIT API ROUTE LOADED 🚨🚨🚨');
log('warn', '🚨 FORCED CONFIGURATION - NO OVERRIDES ALLOWED');
log('info', 'Backend URL (ABSOLUTELY FORCED)', { url: FORCED_BACKEND_URL });
log('info', 'CopilotKit Endpoint (ABSOLUTELY FORCED)', { endpoint: FORCED_COPILOT_ENDPOINT });

// Log all environment variables to check for interference
const envVars = Object.keys(process.env).filter(key => 
  key.includes('LANGGRAPH') || key.includes('COPILOT') || key.includes('BACKEND') || key.includes('URL')
).reduce((acc, key) => {
  acc[key] = process.env[key];
  return acc;
}, {} as Record<string, string | undefined>);

log('debug', 'Environment variables that might interfere', envVars);

// Check if any environment variables contain the problematic URL
const problematicVars = Object.entries(envVars).filter(([, value]) => 
  value && value.includes('project-x-c0ml.onrender.com')
);

if (problematicVars.length > 0) {
  log('error', '🚨 FOUND PROBLEMATIC ENVIRONMENT VARIABLES', problematicVars);
} else {
  log('info', '✅ No problematic environment variables found');
}

const serviceAdapter = new OpenAIAdapter({
  model: "gpt-4o-mini",
});

log('debug', 'OpenAI service adapter configured', { model: "gpt-4o-mini" });

// Create runtime with ABSOLUTELY FORCED configuration
const runtime = new CopilotRuntime({
  remoteEndpoints: [
    {
      url: FORCED_COPILOT_ENDPOINT,
    }
  ],
});

log('info', 'CopilotRuntime configured with FORCED local backend endpoint');
log('warn', `🚨 If you see ANY requests to URLs other than ${FORCED_COPILOT_ENDPOINT}, there is a configuration override happening!`);

export const POST = async (req: NextRequest) => {
  const requestId = Math.random().toString(36).substring(2, 15);
  
  try {
    log('info', `📨 Incoming POST request [${requestId}]`);
    log('warn', `🚨 Expected backend URL: ${FORCED_COPILOT_ENDPOINT}`);
    
    // Log request details
    const url = new URL(req.url);
    log('debug', `📝 Request details [${requestId}]`, {
      method: req.method,
      url: req.url,
      pathname: url.pathname,
      origin: req.headers.get('origin'),
      userAgent: req.headers.get('user-agent'),
      contentType: req.headers.get('content-type')
    });

    // Check if the request URL contains any problematic domains
    if (req.url.includes('project-x-c0ml.onrender.com')) {
      log('error', `🚨 DETECTED PROBLEMATIC URL IN REQUEST [${requestId}]`, { url: req.url });
      return NextResponse.json(
        { 
          error: 'Remote URL detected - this should not happen!', 
          requestId,
          detectedUrl: req.url,
          expectedUrl: FORCED_COPILOT_ENDPOINT
        }, 
        { status: 400 }
      );
    }

    // Log request body (truncated for security)
    const bodyText = await req.text();
    const body = bodyText ? JSON.parse(bodyText) : null;
    
    log('debug', `📝 Request body preview [${requestId}]`, {
      hasBody: !!body,
      bodyType: typeof body,
      bodyKeys: body ? Object.keys(body) : [],
      messageCount: body?.messages?.length || 0
    });

    // Recreate request with the body
    const newReq = new NextRequest(req.url, {
      method: req.method,
      headers: req.headers,
      body: bodyText
    });

    // Get the handler with FORCED configuration
    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: "/api/copilotkit",
    });

    log('debug', `🔄 Processing request through CopilotRuntime [${requestId}]`);
    log('warn', `🚨 Runtime should connect to: ${FORCED_COPILOT_ENDPOINT}`);
    
    const startTime = Date.now();
    const response = await handleRequest(newReq);
    const endTime = Date.now();
    
    log('info', `✅ Request processed successfully [${requestId}]`, {
      processingTime: `${endTime - startTime}ms`,
      status: response.status,
      statusText: response.statusText
    });

    // Log response headers (but not body for security)
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    log('debug', `📤 Response details [${requestId}]`, {
      headers: responseHeaders,
      hasBody: !!response.body
    });

    return response;

  } catch (error) {
    log('error', `❌ Request failed [${requestId}]`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });

    // Check if the error message contains the problematic URL
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('project-x-c0ml.onrender.com')) {
      log('error', `🚨 ERROR CONTAINS PROBLEMATIC URL [${requestId}]`, { errorMessage });
      
      return NextResponse.json(
        { 
          error: 'Remote URL detected in error - configuration override detected!', 
          requestId,
          originalError: errorMessage,
          expectedEndpoint: FORCED_COPILOT_ENDPOINT,
          troubleshooting: 'Clear browser cache, restart dev server, check for service workers'
        }, 
        { status: 500 }
      );
    }

    // Return a proper error response
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        requestId,
        message: errorMessage,
        expectedEndpoint: FORCED_COPILOT_ENDPOINT
      }, 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}; 