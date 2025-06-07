import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ContractsList from '@/components/contracts/ContractsList';

const ContractsManager = () => {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <ContractsList />
    </div>
  );
};

export default ContractsManager;
