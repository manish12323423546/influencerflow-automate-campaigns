import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface DebugInfo {
  expectedUrl: string;
  environmentVars: Record<string, string>;
  windowLocation: string;
  userAgent: string;
  timestamp: string;
  apiRouteUrl: string;
}

const DebugCopilotKit: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [testResults, setTestResults] = useState<{
    apiRoute: 'pending' | 'success' | 'error';
    backend: 'pending' | 'success' | 'error';
    errorDetails?: string;
  }>({
    apiRoute: 'pending',
    backend: 'pending'
  });

  const collectDebugInfo = () => {
    console.log('🔍 COLLECTING DEBUG INFORMATION...');
    
    const envVars: Record<string, string> = {};
    
    // Check for client-side environment variables
    if (typeof window !== 'undefined') {
      Object.keys(window as any).forEach(key => {
        if (key.includes('LANGGRAPH') || key.includes('COPILOT') || key.includes('BACKEND')) {
          envVars[key] = (window as any)[key];
        }
      });
    }

    const info: DebugInfo = {
      expectedUrl: 'http://localhost:8000',
      environmentVars: envVars,
      windowLocation: typeof window !== 'undefined' ? window.location.href : 'SSR',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR',
      timestamp: new Date().toISOString(),
      apiRouteUrl: `/api/copilotkit`
    };

    console.log('📊 Debug Information Collected:', info);
    setDebugInfo(info);
  };

  const testApiRoute = async () => {
    console.log('🧪 TESTING API ROUTE...');
    setTestResults(prev => ({ ...prev, apiRoute: 'pending' }));
    
    try {
      const response = await fetch('/api/copilotkit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'test' }]
        })
      });

      console.log('📡 API Route Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        setTestResults(prev => ({ ...prev, apiRoute: 'success' }));
        console.log('✅ API Route test successful');
      } else {
        const errorText = await response.text();
        console.log('❌ API Route test failed:', errorText);
        setTestResults(prev => ({ 
          ...prev, 
          apiRoute: 'error',
          errorDetails: `${response.status}: ${errorText}`
        }));
      }
    } catch (error) {
      console.error('💥 API Route test error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setTestResults(prev => ({ 
        ...prev, 
        apiRoute: 'error',
        errorDetails: errorMessage
      }));
    }
  };

  const testBackendDirect = async () => {
    console.log('🧪 TESTING BACKEND DIRECTLY...');
    setTestResults(prev => ({ ...prev, backend: 'pending' }));
    
    try {
      const response = await fetch('http://localhost:8000/copilotkit/info', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      console.log('📡 Backend Direct Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend direct test successful:', data);
        setTestResults(prev => ({ ...prev, backend: 'success' }));
      } else {
        const errorText = await response.text();
        console.log('❌ Backend direct test failed:', errorText);
        setTestResults(prev => ({ 
          ...prev, 
          backend: 'error',
          errorDetails: `${response.status}: ${errorText}`
        }));
      }
    } catch (error) {
      console.error('💥 Backend direct test error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setTestResults(prev => ({ 
        ...prev, 
        backend: 'error',
        errorDetails: errorMessage
      }));
    }
  };

  const clearAllCache = () => {
    console.log('🧹 CLEARING ALL BROWSER CACHE...');
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
          console.log('🗑️ Unregistered service worker:', registration.scope);
        });
      });
    }

    // Clear localStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Force reload without cache
    window.location.reload();
  };

  useEffect(() => {
    collectDebugInfo();
  }, []);

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 CopilotKit Configuration Debug
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This debug tool helps identify why CopilotKit might be trying to contact remote URLs 
              instead of the local backend at http://localhost:8000
            </AlertDescription>
          </Alert>

          {debugInfo && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Expected Configuration</h4>
                  <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                    Backend: {debugInfo.expectedUrl}<br/>
                    Endpoint: {debugInfo.expectedUrl}/copilotkit<br/>
                    API Route: {debugInfo.apiRouteUrl}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Environment Variables</h4>
                  <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                    {Object.keys(debugInfo.environmentVars).length > 0 ? (
                      Object.entries(debugInfo.environmentVars).map(([key, value]) => (
                        <div key={key}>
                          {key}: {value}
                        </div>
                      ))
                    ) : (
                      <span className="text-green-600">✅ No conflicting environment variables found</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Browser Information</h4>
                <div className="bg-gray-100 p-3 rounded text-sm">
                  <div><strong>Location:</strong> {debugInfo.windowLocation}</div>
                  <div><strong>User Agent:</strong> {debugInfo.userAgent}</div>
                  <div><strong>Timestamp:</strong> {debugInfo.timestamp}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🧪 Connection Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.apiRoute)}
                <span className="font-semibold">API Route Test</span>
              </div>
              <p className="text-sm text-gray-600">
                Tests the /api/copilotkit endpoint
              </p>
              <Button 
                onClick={testApiRoute} 
                disabled={testResults.apiRoute === 'pending'}
                size="sm"
              >
                Test API Route
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.backend)}
                <span className="font-semibold">Backend Direct Test</span>
              </div>
              <p className="text-sm text-gray-600">
                Tests the backend directly at localhost:8000
              </p>
              <Button 
                onClick={testBackendDirect} 
                disabled={testResults.backend === 'pending'}
                size="sm"
              >
                Test Backend
              </Button>
            </div>
          </div>

          {testResults.errorDetails && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error Details:</strong> {testResults.errorDetails}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🧹 Troubleshooting Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button 
              onClick={collectDebugInfo} 
              variant="outline"
              className="w-full"
            >
              🔄 Refresh Debug Info
            </Button>
            
            <Button 
              onClick={clearAllCache} 
              variant="destructive"
              className="w-full"
            >
              🧹 Clear All Cache & Reload
            </Button>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              If you're still seeing remote URL errors, try:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Open Chrome DevTools → Application → Storage → Clear site data</li>
                <li>Disable browser extensions</li>
                <li>Try incognito/private browsing mode</li>
                <li>Check if main.py backend is running on localhost:8000</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugCopilotKit; 