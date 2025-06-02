
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ReportsList from './ReportsList';
import GenerateReportModal from './GenerateReportModal';

const ReportsPage = () => {
  const [generateModalOpen, setGenerateModalOpen] = useState(false);

  const handleReportGenerated = () => {
    // The ReportsList component will handle the refresh via real-time subscription
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-snow">Performance Reports</h2>
          <p className="text-snow/60">Generate and download campaign performance reports</p>
        </div>
        <Button
          onClick={() => setGenerateModalOpen(true)}
          className="bg-coral hover:bg-coral/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
      </div>

      <ReportsList />

      <GenerateReportModal
        open={generateModalOpen}
        onOpenChange={setGenerateModalOpen}
        onReportGenerated={handleReportGenerated}
      />
    </div>
  );
};

export default ReportsPage;
