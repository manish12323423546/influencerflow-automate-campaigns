import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const SimpleEdgeFunctionTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const testDebugFunction = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      console.log('Testing debug function...');
      
      const { data, error } = await supabase.functions.invoke('debug-test', {
        body: { test: 'browser-test', timestamp: new Date().toISOString() }
      });

      console.log('Debug function result:', { data, error });

      if (error) {
        console.error('Debug function error:', error);
        setResult({ success: false, error });
        toast({
          title: 'Debug Function Failed',
          description: error.message || 'Unknown error',
          variant: 'destructive'
        });
      } else {
        console.log('Debug function success:', data);
        setResult({ success: true, data });
        toast({
          title: 'Debug Function Success',
          description: 'Function called successfully'
        });
      }
    } catch (err) {
      console.error('Test failed:', err);
      setResult({ success: false, error: err.message });
      toast({
        title: 'Test Failed',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testSimpleContract = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      console.log('Testing simple contract function...');
      
      const testData = {
        campaignId: '91636d5d-fd93-4ed5-8bb3-485ffff65152',
        influencerId: 'bf6f9db4-8b5e-472b-ab56-ba22c9673e82',
        fee: 1000,
        deadline: '2024-12-31'
      };

      const { data, error } = await supabase.functions.invoke('test-contract-simple', {
        body: testData
      });

      console.log('Simple contract result:', { data, error });

      if (error) {
        console.error('Simple contract error:', error);
        setResult({ success: false, error });
        toast({
          title: 'Simple Contract Failed',
          description: error.message || 'Unknown error',
          variant: 'destructive'
        });
      } else {
        console.log('Simple contract success:', data);
        setResult({ success: true, data });
        toast({
          title: 'Simple Contract Success',
          description: 'Contract created successfully'
        });
      }
    } catch (err) {
      console.error('Test failed:', err);
      setResult({ success: false, error: err.message });
      toast({
        title: 'Test Failed',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testFixedContract = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      console.log('Testing fixed contract function...');
      
      const testData = {
        campaignId: '91636d5d-fd93-4ed5-8bb3-485ffff65152',
        influencerId: 'bf6f9db4-8b5e-472b-ab56-ba22c9673e82',
        fee: 1000,
        deadline: '2024-12-31',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        paymentTerms: 'Payment due within 30 days',
        specialInstructions: 'Test from browser'
      };

      const { data, error } = await supabase.functions.invoke('create-apitemplate-contract-fixed', {
        body: testData
      });

      console.log('Fixed contract result:', { data, error });

      if (error) {
        console.error('Fixed contract error:', error);
        setResult({ success: false, error });
        toast({
          title: 'Fixed Contract Failed',
          description: error.message || 'Unknown error',
          variant: 'destructive'
        });
      } else {
        console.log('Fixed contract success:', data);
        setResult({ success: true, data });
        toast({
          title: 'Fixed Contract Success',
          description: 'Contract created successfully'
        });
      }
    } catch (err) {
      console.error('Test failed:', err);
      setResult({ success: false, error: err.message });
      toast({
        title: 'Test Failed',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Simple Edge Function Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={testDebugFunction} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Testing...' : 'Test Debug Function'}
          </Button>
          
          <Button 
            onClick={testSimpleContract} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Testing...' : 'Test Simple Contract'}
          </Button>
          
          <Button 
            onClick={testFixedContract} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Testing...' : 'Test Fixed Contract'}
          </Button>
        </div>

        {result && (
          <div className={`p-4 rounded border ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <h3 className="font-medium mb-2">
              {result.success ? '✅ Success' : '❌ Failed'}
            </h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p>Check the browser console for detailed logs.</p>
          <p>Environment: {import.meta.env.VITE_SUPABASE_URL ? '✅ URL Set' : '❌ URL Missing'}</p>
          <p>Anon Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Key Set' : '❌ Key Missing'}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleEdgeFunctionTest;
