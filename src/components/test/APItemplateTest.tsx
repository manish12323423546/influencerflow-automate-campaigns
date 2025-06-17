import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cleanEnvVar } from '@/lib/utils';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

export const APItemplateTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [formData, setFormData] = useState({
    campaignId: '',
    influencerId: '',
    fee: 1000,
    deadline: '2024-12-31',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    paymentTerms: 'Payment due within 30 days',
    specialInstructions: 'Test contract creation'
  });
  const { toast } = useToast();

  const runEnvironmentTest = (): TestResult => {
    try {
      const apiKey = cleanEnvVar(import.meta.env.VITE_APITEMPLATE_API_KEY);
      const templateId = cleanEnvVar(import.meta.env.VITE_APITEMPLATE_TEMPLATE_ID);
      
      const results = {
        apiKey: !!apiKey,
        apiKeyLength: apiKey?.length || 0,
        templateId: !!templateId,
        templateIdValue: templateId
      };

      if (!apiKey) {
        return {
          success: false,
          message: 'VITE_APITEMPLATE_API_KEY not found in environment',
          details: results
        };
      }

      if (!templateId) {
        return {
          success: false,
          message: 'VITE_APITEMPLATE_TEMPLATE_ID not found in environment',
          details: results
        };
      }

      return {
        success: true,
        message: 'Environment variables configured correctly',
        details: results
      };
    } catch (error) {
      return {
        success: false,
        message: `Environment test failed: ${error}`,
        details: { error: error.message }
      };
    }
  };

  const runDatabaseTest = async (): Promise<TestResult> => {
    try {
      // Test database connection
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name')
        .limit(1);

      if (error) {
        return {
          success: false,
          message: `Database connection failed: ${error.message}`,
          details: { error }
        };
      }

      return {
        success: true,
        message: 'Database connection successful',
        details: { campaignCount: data?.length || 0 }
      };
    } catch (error) {
      return {
        success: false,
        message: `Database test failed: ${error}`,
        details: { error: error.message }
      };
    }
  };

  const runEdgeFunctionTest = async (): Promise<TestResult> => {
    try {
      if (!formData.campaignId || !formData.influencerId) {
        return {
          success: false,
          message: 'Campaign ID and Influencer ID are required for edge function test',
          details: { formData }
        };
      }

      console.log('Calling edge function with data:', formData);

      // Try multiple functions to see which one works
      let result;
      let functionName = '';

      // Try debug function first to test basic connectivity
      try {
        functionName = 'debug-test';
        console.log(`Trying debug function: ${functionName}`);
        result = await supabase.functions.invoke(functionName, {
          body: { test: 'debug', ...formData }
        });
        console.log(`Debug result:`, result);

        if (result.error) {
          throw new Error(`Debug function failed: ${result.error.message}`);
        }
      } catch (debugError) {
        console.error(`Debug function failed:`, debugError);
        return {
          success: false,
          message: `Debug function failed: ${debugError.message}`,
          details: { error: debugError, formData }
        };
      }

      // Try the fixed function
      try {
        functionName = 'create-apitemplate-contract-fixed';
        console.log(`Trying function: ${functionName}`);
        result = await supabase.functions.invoke(functionName, {
          body: formData
        });
        console.log(`Result from ${functionName}:`, result);
      } catch (fixedError) {
        console.error(`Error with ${functionName}:`, fixedError);

        // Fallback to simple test function
        try {
          functionName = 'test-contract-simple';
          console.log(`Trying fallback function: ${functionName}`);
          result = await supabase.functions.invoke(functionName, {
            body: formData
          });
          console.log(`Result from ${functionName}:`, result);
        } catch (simpleError) {
          console.error(`Error with ${functionName}:`, simpleError);
          throw simpleError;
        }
      }

      const { data, error } = result;

      if (error) {
        console.error('Edge function error:', error);
        return {
          success: false,
          message: `Edge function failed: ${error.message || JSON.stringify(error)}`,
          details: { error, formData, functionUsed: functionName }
        };
      }

      return {
        success: true,
        message: `Edge function executed successfully (${functionName})`,
        details: { ...data, functionUsed: functionName }
      };
    } catch (error) {
      console.error('Edge function test failed:', error);
      return {
        success: false,
        message: `Edge function test failed: ${error.message || error}`,
        details: { error: error.message || error.toString(), formData }
      };
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    try {
      const results: TestResult[] = [];

      // Test 1: Environment Variables
      toast({ title: 'Running environment test...' });
      const envTest = runEnvironmentTest();
      results.push({ ...envTest, message: `ENV: ${envTest.message}` });

      // Test 2: Database Connection
      toast({ title: 'Testing database connection...' });
      const dbTest = await runDatabaseTest();
      results.push({ ...dbTest, message: `DB: ${dbTest.message}` });

      // Test 3: Edge Function (only if previous tests pass)
      if (envTest.success && dbTest.success) {
        toast({ title: 'Testing edge function...' });
        const edgeTest = await runEdgeFunctionTest();
        results.push({ ...edgeTest, message: `EDGE: ${edgeTest.message}` });
      } else {
        results.push({
          success: false,
          message: 'EDGE: Skipped due to previous test failures',
          details: { skipped: true }
        });
      }

      setTestResults(results);

      const allPassed = results.every(r => r.success);
      toast({
        title: allPassed ? 'All tests passed!' : 'Some tests failed',
        description: `${results.filter(r => r.success).length}/${results.length} tests passed`,
        variant: allPassed ? 'default' : 'destructive'
      });

    } catch (error) {
      toast({
        title: 'Test execution failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>APItemplate Integration Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Form */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="campaignId">Campaign ID</Label>
            <Input
              id="campaignId"
              value={formData.campaignId}
              onChange={(e) => setFormData(prev => ({ ...prev, campaignId: e.target.value }))}
              placeholder="Enter campaign UUID"
            />
          </div>
          <div>
            <Label htmlFor="influencerId">Influencer ID</Label>
            <Input
              id="influencerId"
              value={formData.influencerId}
              onChange={(e) => setFormData(prev => ({ ...prev, influencerId: e.target.value }))}
              placeholder="Enter influencer UUID"
            />
          </div>
          <div>
            <Label htmlFor="fee">Fee</Label>
            <Input
              id="fee"
              type="number"
              value={formData.fee}
              onChange={(e) => setFormData(prev => ({ ...prev, fee: parseInt(e.target.value) }))}
            />
          </div>
          <div>
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="specialInstructions">Special Instructions</Label>
          <Textarea
            id="specialInstructions"
            value={formData.specialInstructions}
            onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
            placeholder="Enter any special instructions"
          />
        </div>

        {/* Test Button */}
        <Button 
          onClick={runAllTests} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Running Tests...' : 'Run APItemplate Tests'}
        </Button>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Test Results</h3>
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded border ${
                  result.success 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="font-medium">{result.message}</div>
                {result.details && (
                  <pre className="text-xs mt-2 overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Environment Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h4 className="font-medium mb-2">Environment Status</h4>
          <div className="text-sm space-y-1">
            <div>API Key: {cleanEnvVar(import.meta.env.VITE_APITEMPLATE_API_KEY) ? '✅ Set' : '❌ Missing'}</div>
            <div>Template ID: {cleanEnvVar(import.meta.env.VITE_APITEMPLATE_TEMPLATE_ID) ? '✅ Set' : '❌ Missing'}</div>
            <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default APItemplateTest;
