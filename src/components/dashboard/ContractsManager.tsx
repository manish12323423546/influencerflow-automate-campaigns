import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ContractManager } from '@/components/contracts/ContractManager';

const ContractsManager = () => {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <ContractManager />
    </div>
  );
};

export default ContractsManager;
