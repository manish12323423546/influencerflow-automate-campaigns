import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Database, Eye } from 'lucide-react';

export const ContractsDebugger = () => {
  const { toast } = useToast();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check auth status
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      console.log('Fetching contracts...');
      
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          campaigns (name, brand),
          influencers (name, handle, platform)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching contracts:', error);
        throw error;
      }

      console.log('Fetched contracts:', data);
      setContracts(data || []);

      toast({
        title: 'Contracts Fetched',
        description: `Found ${data?.length || 0} contracts`,
      });

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const testDirectQuery = async () => {
    setLoading(true);
    try {
      console.log('Testing direct SQL query...');
      
      const { data, error } = await supabase
        .rpc('get_contracts_with_details');

      if (error) {
        console.error('RPC Error:', error);
        // Fallback to regular query
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('contracts')
          .select('*')
          .limit(5);
        
        if (fallbackError) throw fallbackError;
        
        console.log('Fallback query result:', fallbackData);
        toast({
          title: 'Direct Query Result',
          description: `Found ${fallbackData?.length || 0} contracts (fallback)`,
        });
        return;
      }

      console.log('RPC result:', data);
      toast({
        title: 'Direct Query Result',
        description: `Found ${data?.length || 0} contracts`,
      });

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Query Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-4 border-purple-200">
      <CardHeader>
        <CardTitle className="text-sm text-purple-900 flex items-center">
          <Database className="w-4 h-4 mr-2" />
          Contracts Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={fetchContracts}
            disabled={loading}
            variant="outline"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            Fetch Contracts
          </Button>

          <Button
            size="sm"
            onClick={testDirectQuery}
            disabled={loading}
            variant="outline"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
            Test Direct Query
          </Button>
        </div>

        <div className="text-xs space-y-2">
          <div><strong>Auth Status:</strong> {user ? `Logged in as ${user.email}` : 'Anonymous'}</div>
          <div><strong>Contracts Found:</strong> {contracts.length}</div>
          
          {contracts.length > 0 && (
            <div className="bg-green-50 p-2 rounded">
              <strong>Recent Contracts:</strong>
              <ul className="mt-1 space-y-1">
                {contracts.slice(0, 3).map((contract) => (
                  <li key={contract.id} className="text-xs">
                    • {contract.id.substring(0, 8)} - {contract.campaigns?.name || 'N/A'} - ₹{contract.contract_data?.fee || 'N/A'}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-600 space-y-1">
          <div><strong>Debug Info:</strong></div>
          <div>• This component tests direct database access</div>
          <div>• Check browser console for detailed logs</div>
          <div>• Should show contracts regardless of auth status</div>
        </div>
      </CardContent>
    </Card>
  );
};
