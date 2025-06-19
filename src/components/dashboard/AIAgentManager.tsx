import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Bot, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { CopilotChat } from "@copilotkit/react-ui";
import { CopilotKit } from "@copilotkit/react-core";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DebugCopilotKit from '../DebugCopilotKit';

const AIAgentManager: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  
  // Fixed backend URL for local main.py only - HARDCODED to prevent any overrides
  const BACKEND_URL = 'http://localhost:8000';

  // Enhanced logging utility
  const log = (level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const prefix = `[AI-Agent ${timestamp}]`;
    
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

  // Check backend connection
  useEffect(() => {
    log('info', 'AI Agent Manager initialized');
    log('debug', 'Backend URL configured (HARDCODED)', { url: BACKEND_URL });
    
    // Log all environment variables that might affect CopilotKit
    log('debug', 'Environment check', {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_LANGGRAPH_BACKEND_URL: process.env.NEXT_PUBLIC_LANGGRAPH_BACKEND_URL,
      LANGGRAPH_API_URL: process.env.LANGGRAPH_API_URL,
      allEnvKeys: Object.keys(process.env).filter(key => 
        key.includes('LANGGRAPH') || key.includes('COPILOT') || key.includes('BACKEND')
      ).map(key => `${key}=${process.env[key]}`)
    });

    const checkConnection = async () => {
      try {
        log('info', 'Starting connection check...');
        setConnectionStatus('connecting');
        
        // First check if backend is reachable
        log('debug', 'Checking backend health endpoint', { endpoint: `${BACKEND_URL}/health` });
        
        const healthResponse = await fetch(`${BACKEND_URL}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        log('debug', 'Health endpoint response', { 
          status: healthResponse.status, 
          ok: healthResponse.ok,
          statusText: healthResponse.statusText 
        });
        
        if (healthResponse.ok) {
          log('info', '✅ Backend health check passed');
          
          // Check if CopilotKit endpoint is available
          log('debug', 'Checking CopilotKit info endpoint', { endpoint: `${BACKEND_URL}/info` });
          
          const infoResponse = await fetch(`${BACKEND_URL}/info`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          
          log('debug', 'Info endpoint response', { 
            status: infoResponse.status, 
            ok: infoResponse.ok,
            statusText: infoResponse.statusText 
          });
          
          if (infoResponse.ok) {
            const info = await infoResponse.json();
            log('debug', 'Info endpoint data received', info);
            
            if (info.copilotkit_available) {
              log('info', '✅ CopilotKit integration confirmed - Connection successful!');
              setConnectionStatus('connected');
            } else {
              log('error', '❌ CopilotKit not available on backend', info);
              setConnectionStatus('error');
            }
          } else {
            log('error', '❌ Info endpoint failed', { 
              status: infoResponse.status,
              statusText: infoResponse.statusText 
            });
            setConnectionStatus('error');
          }
        } else {
          log('error', '❌ Backend health check failed', { 
            status: healthResponse.status,
            statusText: healthResponse.statusText 
          });
          setConnectionStatus('error');
        }
      } catch (error) {
        log('error', '❌ Connection check failed with exception', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        setConnectionStatus('error');
      }
    };

    checkConnection();
    
    // Check connection every 30 seconds
    log('debug', 'Setting up connection monitoring (30s intervals)');
    const interval = setInterval(() => {
      log('debug', 'Running scheduled connection check...');
      checkConnection();
    }, 30000);
    
    return () => {
      log('debug', 'Cleaning up connection monitoring');
      clearInterval(interval);
    };
  }, []);

  const handleRetryConnection = () => {
    log('info', 'User triggered connection retry');
    setConnectionStatus('connecting');
    // Trigger connection check by reloading
    log('warn', 'Reloading page for connection retry...');
    window.location.reload();
  };

  // Log status changes
  useEffect(() => {
    log('info', `🔄 Connection status changed: ${connectionStatus.toUpperCase()}`);
  }, [connectionStatus]);

  // Force log the runtime URL being used by CopilotKit
  useEffect(() => {
    log('warn', '🚨 COPILOTKIT RUNTIME URL FORCED TO: /api/copilotkit');
    log('warn', '🚨 This should connect to hardcoded localhost:8000 in route.ts');
    log('debug', 'CopilotKit configuration', {
      runtimeUrl: '/api/copilotkit',
      agent: 'campaign_agent',
      backendEndpoint: `${BACKEND_URL}/copilotkit`
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Alert className={`border ${
        connectionStatus === 'connected' ? 'border-green-200 bg-green-50' :
        connectionStatus === 'error' ? 'border-red-200 bg-red-50' :
        'border-yellow-200 bg-yellow-50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : connectionStatus === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <Bot className="h-4 w-4 text-yellow-600 animate-pulse" />
            )}
            <AlertDescription className={
              connectionStatus === 'connected' ? 'text-green-800' :
              connectionStatus === 'error' ? 'text-red-800' :
              'text-yellow-800'
            }>
              {connectionStatus === 'connected' && 'Connected to Local LangGraph Multi-Agent System'}
              {connectionStatus === 'error' && 'Failed to connect to local AI agent. Please ensure main.py is running on localhost:8000.'}
              {connectionStatus === 'connecting' && 'Connecting to local AI agent...'}
            </AlertDescription>
          </div>
          
          {connectionStatus === 'error' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetryConnection}
              className="text-red-700 border-red-300 hover:bg-red-50"
            >
              Retry
            </Button>
          )}
        </div>
      </Alert>

      {/* Force No Remote URL Warning */}
      <Alert className="border-red-500 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>🚨 FORCED LOCAL ONLY:</strong> This AI Agent is hardcoded to use localhost:8000 only. 
          If you see any remote URLs in console, there's a configuration override happening.
          <br />
          <strong>Runtime URL:</strong> /api/copilotkit → localhost:8000/copilotkit
        </AlertDescription>
      </Alert>

      {/* AI Agent Interface */}
      {connectionStatus === 'connected' ? (
        <CopilotKit 
          runtimeUrl="/api/copilotkit"
          agent="campaign_agent"
        >
          <Card className="shadow-lg border-coral/20">
            <CardHeader className="bg-gradient-to-r from-coral/10 to-purple-500/10">
              <CardTitle className="flex items-center text-xl">
                <MessageSquare className="w-6 h-6 mr-3 text-coral" />
                AI Campaign Assistant (LOCAL ONLY)
                <Bot className="w-5 h-5 ml-2 text-purple-600" />
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Powered by Local LangGraph Multi-Agent System (localhost:8000) • Campaign planning, execution, and analysis
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[650px] border-t border-gray-100">
                <CopilotChat 
                  className="h-full"
                  labels={{
                    title: "AI Campaign Assistant (Local)",
                    initial: "Hi! I'm your AI campaign assistant powered by your LOCAL LangGraph system at localhost:8000. I can help you with:\n\n• 🎯 Campaign planning and strategy\n• 👥 Influencer discovery and analysis\n• 📝 Contract creation and management\n• 📧 Email automation and outreach\n• 📞 Phone call scheduling and management\n• 📊 Performance analysis and ROI tracking\n• 💰 Budget planning and optimization\n\nHow can I assist you with your campaign today?",
                    placeholder: "Ask about campaigns, influencers, contracts, or analytics...",
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </CopilotKit>
      ) : (
        <Card className="shadow-lg border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center text-xl text-gray-600">
              <MessageSquare className="w-6 h-6 mr-3" />
              AI Campaign Assistant (LOCAL ONLY)
              <Bot className="w-5 h-5 ml-2" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center space-y-4">
                <Bot className="w-16 h-16 mx-auto text-gray-400" />
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-700">Local AI Assistant Unavailable</h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    {connectionStatus === 'error' 
                      ? 'Unable to connect to the local LangGraph backend. Please ensure main.py is running.'
                      : 'Connecting to your local AI assistant...'
                    }
                  </p>
                  {connectionStatus === 'error' && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-gray-600">To start the local backend:</p>
                      <div className="bg-gray-100 p-3 rounded text-xs font-mono text-left">
                        <div>cd langgraph-example</div>
                        <div>python main.py</div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">Make sure it's running on localhost:8000</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          log('info', 'User clicked to open console for debugging');
                          alert('Open browser console (F12) to see detailed connection logs');
                        }}
                        className="mt-2"
                      >
                        View Debug Logs
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Integration Info with Debug Panel */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-sm text-gray-700 flex items-center justify-between">
            Local Integration Details (FORCED)
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                log('info', '🔍 Debug info requested by user');
                console.group('🔍 AI Agent Debug Information');
                console.log('Backend URL (Hardcoded):', BACKEND_URL);
                console.log('Connection Status:', connectionStatus);
                console.log('Runtime URL:', '/api/copilotkit');
                console.log('Expected Backend Endpoint:', `${BACKEND_URL}/copilotkit`);
                console.log('Current Time:', new Date().toISOString());
                console.log('User Agent:', navigator.userAgent);
                console.log('Window Location:', window.location.href);
                console.log('Environment Variables:', Object.keys(process.env).filter(key => 
                  key.includes('LANGGRAPH') || key.includes('COPILOT') || key.includes('BACKEND')
                ).reduce((acc, key) => {
                  acc[key] = process.env[key];
                  return acc;
                }, {} as Record<string, string | undefined>));
                console.groupEnd();
              }}
              className="text-xs"
            >
              Debug Info
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <div className="flex justify-between">
            <span>Frontend Runtime:</span>
            <code className="bg-gray-200 px-2 py-1 rounded text-xs">/api/copilotkit</code>
          </div>
          <div className="flex justify-between">
            <span>Backend Endpoint (FORCED):</span>
            <code className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">{BACKEND_URL}/copilotkit</code>
          </div>
          <div className="flex justify-between">
            <span>Agent:</span>
            <code className="bg-gray-200 px-2 py-1 rounded text-xs">campaign_agent</code>
          </div>
          <div className="flex justify-between">
            <span>Backend:</span>
            <code className="bg-gray-200 px-2 py-1 rounded text-xs">Local LangGraph Multi-Agent (main.py)</code>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
              connectionStatus === 'error' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {connectionStatus.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Configuration:</span>
            <code className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">HARDCODED - NO OVERRIDES</code>
          </div>
          <div className="flex justify-between">
            <span>Logs:</span>
            <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Check Browser Console (F12)</code>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Debug Tool */}
      <DebugCopilotKit />

      {/* Console Logging Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm text-blue-700">🔍 Debug Logging Active</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-600">
          <p className="mb-2">Comprehensive logging is active. Open your browser console (F12) to view:</p>
          <ul className="text-xs space-y-1 list-disc list-inside">
            <li>Connection status changes and API calls</li>
            <li>Backend health and CopilotKit availability checks</li>
            <li>Environment variable inspection</li>
            <li>CopilotKit runtime configuration</li>
            <li>Error details and troubleshooting information</li>
            <li>Performance and timing data</li>
          </ul>
          <p className="mt-2 text-xs">
            Look for logs prefixed with <code className="bg-blue-100 px-1 rounded">[AI-Agent]</code> and <code className="bg-red-100 px-1 rounded">[CopilotKit-API]</code>
          </p>
          <p className="mt-2 text-xs font-bold">
            🚨 If you see ANY remote URLs in the logs, that indicates a configuration override problem!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAgentManager; 