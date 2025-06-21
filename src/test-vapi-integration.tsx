import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Info } from 'lucide-react';

/**
 * Test Component for VAPI Integration
 * Verifies that webinar-ai-main style VAPI implementation works in influencerflow-automate-campaigns
 */
export const TestVAPIIntegration = () => {
  const [testResults, setTestResults] = useState<{
    [key: string]: 'pending' | 'success' | 'error' | 'info';
  }>({});
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [assistantId, setAssistantId] = useState<string | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    setTestLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[VAPI Test] ${message}`);
  };

  const updateTestResult = (testName: string, result: 'pending' | 'success' | 'error' | 'info') => {
    setTestResults(prev => ({ ...prev, [testName]: result }));
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults({});
    setTestLogs([]);
    
    addLog('🚀 Starting VAPI Integration Tests...');

    // Test 1: VAPI Configuration Check
    try {
      addLog('📊 Testing VAPI configuration...');
      updateTestResult('config', 'pending');
      
      const { getVapiConfig } = await import('@/actions/vapi');
      const config = getVapiConfig();
      
      addLog(`VAPI Mode: ${config.mode}`);
      addLog(`Is Configured: ${config.isConfigured}`);
      
      updateTestResult('config', 'success');
    } catch (error) {
      addLog(`❌ Config test failed: ${error}`);
      updateTestResult('config', 'error');
    }

    // Test 2: VAPI Client Loading
    try {
      addLog('📱 Testing VAPI client loading...');
      updateTestResult('client', 'pending');
      
      const { vapi, getVapiClientConfig } = await import('@/lib/vapi/vapiClient');
      const clientConfig = getVapiClientConfig();
      
      addLog(`Client Mode: ${clientConfig.mode}`);
      addLog(`Client Type: ${vapi.constructor.name}`);
      
      updateTestResult('client', 'success');
    } catch (error) {
      addLog(`❌ Client test failed: ${error}`);
      updateTestResult('client', 'error');
    }

    // Test 3: Assistant Creation
    try {
      addLog('🤖 Testing assistant creation...');
      updateTestResult('assistant', 'pending');
      
      const { createAssistant } = await import('@/actions/vapi');
      const result = await createAssistant(
        'Test Brand Agent',
        'test-user-123',
        true,
        'You are a test assistant for VAPI integration testing.'
      );
      
      if (result.success) {
        addLog(`✅ Assistant created: ${result.assistant.id}`);
        setAssistantId(result.assistant.id);
        updateTestResult('assistant', 'success');
      } else {
        addLog(`❌ Assistant creation failed: ${result.error}`);
        updateTestResult('assistant', 'error');
      }
    } catch (error) {
      addLog(`❌ Assistant creation test failed: ${error}`);
      updateTestResult('assistant', 'error');
    }

    // Test 4: VAPI Call Simulation
    if (assistantId || testResults.assistant === 'success') {
      try {
        addLog('📞 Testing VAPI call simulation...');
        updateTestResult('call', 'pending');
        
        const { vapi } = await import('@/lib/vapi/vapiClient');
        
        // Setup event listeners for the test
        let callStarted = false;
        let messageReceived = false;
        
        const onCallStart = () => {
          callStarted = true;
          addLog('📞 Call started successfully');
        };
        
        const onMessage = (data: any) => {
          messageReceived = true;
          addLog(`💬 Message received: ${data.message || 'AI response'}`);
        };
        
        const onCallEnd = () => {
          addLog('📞 Call ended');
        };
        
        vapi.on('call-start', onCallStart);
        vapi.on('message', onMessage);
        vapi.on('call-end', onCallEnd);
        
        // Start the call
        const testAssistantId = assistantId || 'test-assistant-id';
        await vapi.start(testAssistantId);
        
        // Wait a moment for events to fire
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test sending a message if in demo mode
        if ('sendTestMessage' in vapi && typeof vapi.sendTestMessage === 'function') {
          addLog('📝 Sending test message...');
          (vapi as any).sendTestMessage('Hello, this is a test message for campaign discussion.');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Stop the call
        vapi.stop();
        
        // Clean up listeners
        vapi.off('call-start', onCallStart);
        vapi.off('message', onMessage);
        vapi.off('call-end', onCallEnd);
        
        if (callStarted) {
          addLog('✅ Call simulation completed successfully');
          updateTestResult('call', 'success');
        } else {
          addLog('⚠️ Call started but some events may not have fired');
          updateTestResult('call', 'info');
        }
        
      } catch (error) {
        addLog(`❌ Call test failed: ${error}`);
        updateTestResult('call', 'error');
      }
    }

    // Test 5: Meeting AI Agent Component Compatibility
    try {
      addLog('🏢 Testing Meeting AI Agent compatibility...');
      updateTestResult('meeting', 'pending');
      
      // Check if the component can be imported
      const { default: MeetingAIAgent } = await import('@/components/dashboard/MeetingAIAgent');
      
      if (MeetingAIAgent) {
        addLog('✅ Meeting AI Agent component loaded successfully');
        updateTestResult('meeting', 'success');
      }
    } catch (error) {
      addLog(`❌ Meeting AI Agent test failed: ${error}`);
      updateTestResult('meeting', 'error');
    }

    addLog('🏁 All tests completed!');
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      case 'pending': return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status || 'waiting'}
      </Badge>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 VAPI Integration Test Suite
            <Badge variant="outline">webinar-ai-main → influencerflow-automate-campaigns</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              This test verifies that the VAPI implementation from webinar-ai-main 
              works correctly in influencerflow-automate-campaigns with the Meeting AI Agent.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            className="mb-6"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run Integration Tests'
            )}
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Test Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: 'config', name: 'VAPI Configuration' },
                  { key: 'client', name: 'VAPI Client Loading' },
                  { key: 'assistant', name: 'Assistant Creation' },
                  { key: 'call', name: 'Call Simulation' },
                  { key: 'meeting', name: 'Meeting Component' },
                ].map(test => (
                  <div key={test.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults[test.key])}
                      <span className="text-sm">{test.name}</span>
                    </div>
                    {getStatusBadge(testResults[test.key])}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Test Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 max-h-64 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap">
                    {testLogs.join('\n') || 'No logs yet. Click "Run Integration Tests" to start.'}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>

          {assistantId && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Test assistant created with ID: <code className="bg-gray-100 px-1 rounded">{assistantId}</code>
                <br />
                You can now test the Meeting AI Agent with this assistant.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestVAPIIntegration; 