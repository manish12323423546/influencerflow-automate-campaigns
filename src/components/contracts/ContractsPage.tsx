import { ContractManager } from './ContractManager';
import ContractsList from './ContractsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ContractsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contracts</h1>
        <p className="text-gray-600 mt-2">Manage your influencer contracts and agreements</p>
      </div>

      <Tabs defaultValue="apitemplate-contracts" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100">
          <TabsTrigger
            value="apitemplate-contracts"
            className="data-[state=active]:bg-coral data-[state=active]:text-white"
          >
            APItemplate Contracts
          </TabsTrigger>
          <TabsTrigger
            value="legacy-contracts"
            className="data-[state=active]:bg-coral data-[state=active]:text-white"
          >
            Legacy Contracts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apitemplate-contracts" className="space-y-4">
          <ContractsList />
        </TabsContent>

        <TabsContent value="legacy-contracts" className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-amber-900 mb-2">Legacy Contract System</h3>
            <p className="text-sm text-amber-700">
              This is the existing contract management system. Use this for managing contracts created
              with the previous system or for basic contract operations.
            </p>
          </div>
          <ContractManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContractsPage;