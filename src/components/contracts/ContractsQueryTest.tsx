import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database, AlertCircle, CheckCircle } from 'lucide-react';

export const ContractsQueryTest = () => {
  const { toast } = useToast();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testQuery1 = async () => {
    setLoading(true);
    try {
      console.log('Testing basic contracts query...');
      
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      console.log('Basic query result:', { data, error });
      
      setResults({
        type: 'Basic Query',
        success: !error,
        data: data || [],
        error: error?.message || null,
        count: data?.length || 0
      });

    } catch (error) {
      console.error('Query 1 failed:', error);
      setResults({
        type: 'Basic Query',
        success: false,
        error: error.message,
        count: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const testQuery2 = async () => {
    setLoading(true);
    try {
      console.log('Testing contracts with relationships...');
      
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          campaigns (name, brand),
          influencers (name, handle, platform)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      console.log('Relationship query result:', { data, error });
      
      setResults({
        type: 'Relationship Query',
        success: !error,
        data: data || [],
        error: error?.message || null,
        count: data?.length || 0
      });

    } catch (error) {
      console.error('Query 2 failed:', error);
      setResults({
        type: 'Relationship Query',
        success: false,
        error: error.message,
        count: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const testQuery3 = async () => {
    setLoading(true);
    try {
      console.log('Testing exact frontend query...');
      
      let query = supabase
        .from('contracts')
        .select(`
          *,
          campaigns (name, brand),
          influencers (name, handle, platform)
        `)
        .order('created_at', { ascending: false });

      query = query.limit(50);

      const { data, error } = await query;

      console.log('Frontend query result:', { data, error });
      
      setResults({
        type: 'Frontend Query (Exact)',
        success: !error,
        data: data || [],
        error: error?.message || null,
        count: data?.length || 0
      });

    } catch (error) {
      console.error('Query 3 failed:', error);
      setResults({
        type: 'Frontend Query (Exact)',
        success: false,
        error: error.message,
        count: 0
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-4 border-red-200">
      <CardHeader>
        <CardTitle className="text-sm text-red-900 flex items-center">
          <Database className="w-4 h-4 mr-2" />
          Contracts Query Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={testQuery1}
            disabled={loading}
            variant="outline"
          >
            Test Basic Query
          </Button>

          <Button
            size="sm"
            onClick={testQuery2}
            disabled={loading}
            variant="outline"
          >
            Test Relationships
          </Button>

          <Button
            size="sm"
            onClick={testQuery3}
            disabled={loading}
            variant="outline"
          >
            Test Frontend Query
          </Button>
        </div>

        {results && (
          <div className="mt-4 p-3 rounded-lg border">
            <div className="flex items-center space-x-2 mb-2">
              {results.success ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="font-medium text-sm">
                {results.type} - {results.success ? 'Success' : 'Failed'}
              </span>
            </div>

            <div className="text-xs space-y-1">
              <div><strong>Count:</strong> {results.count} contracts</div>
              
              {results.error && (
                <div className="text-red-600">
                  <strong>Error:</strong> {results.error}
                </div>
              )}

              {results.success && results.data.length > 0 && (
                <div className="bg-green-50 p-2 rounded mt-2">
                  <strong>Sample Data:</strong>
                  <pre className="text-xs mt-1 overflow-auto max-h-32">
                    {JSON.stringify(results.data[0], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-600 space-y-1">
          <div><strong>Purpose:</strong> Test exact queries used by frontend</div>
          <div>• Basic: Simple contracts table query</div>
          <div>• Relationships: With campaigns and influencers</div>
          <div>• Frontend: Exact query from ContractsList component</div>
        </div>
      </CardContent>
    </Card>
  );
};
