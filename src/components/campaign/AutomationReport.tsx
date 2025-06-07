import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Clock, Users, Mail, Phone, FileText, Send } from 'lucide-react';

interface AutomationReportProps {
  sessionId: string;
  onClose: () => void;
}

export const AutomationReport: React.FC<AutomationReportProps> = ({
  sessionId,
  onClose,
}) => {
  // Mock data for demonstration
  const reportData = {
    status: 'COMPLETED',
    totalSteps: 10,
    completedSteps: 10,
    creatorsFound: 25,
    creatorsContacted: 20,
    contractsGenerated: 15,
    contractsSent: 12,
    emailsSent: 18,
    phoneCallsMade: 5,
    successfulCommunications: 16,
    failedCommunications: 2,
    stepLogs: [
      { step: 1, name: 'Initialize Campaign', status: 'completed', timestamp: new Date().toISOString() },
      { step: 2, name: 'Find Creators', status: 'completed', timestamp: new Date().toISOString() },
      // ... more steps
    ]
  };

  const successRate = Math.round((reportData.successfulCommunications / reportData.creatorsContacted) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Automation Report</h2>
        <Badge variant={reportData.status === 'COMPLETED' ? 'default' : 'secondary'}>
          {reportData.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Progress</CardTitle>
          <CardDescription>
            {reportData.completedSteps} of {reportData.totalSteps} steps completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={(reportData.completedSteps / reportData.totalSteps) * 100} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Creator Outreach</CardTitle>
            <CardDescription>Summary of creator engagement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-gray-500" />
                <span>Creators Found</span>
              </div>
              <Badge variant="secondary">{reportData.creatorsFound}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2 text-gray-500" />
                <span>Emails Sent</span>
              </div>
              <Badge variant="secondary">{reportData.emailsSent}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2 text-gray-500" />
                <span>Phone Calls Made</span>
              </div>
              <Badge variant="secondary">{reportData.phoneCallsMade}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contract Management</CardTitle>
            <CardDescription>Generated and sent contracts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-2 text-gray-500" />
                <span>Contracts Generated</span>
              </div>
              <Badge variant="secondary">{reportData.contractsGenerated}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Send className="w-4 h-4 mr-2 text-gray-500" />
                <span>Contracts Sent</span>
              </div>
              <Badge variant="secondary">{reportData.contractsSent}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Communication Results</CardTitle>
            <CardDescription>Success and failure rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                <span>Successful</span>
              </div>
              <Badge variant="default">{reportData.successfulCommunications}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                <span>Failed</span>
              </div>
              <Badge variant="destructive">{reportData.failedCommunications}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Success Rate</span>
              <Badge variant="outline">{successRate}%</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Step-by-Step Logs</h3>
        <ul className="space-y-2">
          {reportData.stepLogs.map((log) => (
            <li key={log.step} className="flex items-center justify-between">
              <div className="flex items-center">
                {log.status === 'completed' ? (
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <Clock className="w-4 h-4 mr-2 text-gray-500" />
                )}
                <span>Step {log.step}: {log.name}</span>
              </div>
              <Badge variant="secondary">{log.status}</Badge>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
