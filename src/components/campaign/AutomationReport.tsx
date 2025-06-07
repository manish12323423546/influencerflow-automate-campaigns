import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  Mail, 
  Phone, 
  FileText,
  TrendingUp,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAutomationAgent } from '@/hooks/useAutomationAgent';

interface AutomationReportProps {
  campaignId: string;
  onClose?: () => void;
}

export const AutomationReport: React.FC<AutomationReportProps> = ({ 
  campaignId, 
  onClose 
}) => {
  const { getAutomationReport, getAutomationLogs } = useAutomationAgent(campaignId, 'AUTOMATIC');
  const [report, setReport] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [reportData, logsData] = await Promise.all([
        getAutomationReport(campaignId),
        getAutomationLogs(campaignId)
      ]);
      setReport(reportData);
      setLogs(logsData);
    } catch (error) {
      console.error('Failed to load automation report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [campaignId]);

  if (loading) {
    return (
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-coral mr-2" />
            <span className="text-gray-600">Loading automation report...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No automation report available for this campaign.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-500';
      case 'RUNNING': return 'bg-coral';
      case 'FAILED': return 'bg-red-500';
      case 'CANCELLED': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const metrics = report.calculated_metrics || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Automation Report</h2>
          <p className="text-gray-600">Campaign automation performance and metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={loadReportData}
            className="border-gray-200 text-gray-900 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {onClose && (
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-200 text-gray-900 hover:bg-gray-50"
            >
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Status Overview */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-coral" />
            Automation Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Badge className={`${getStatusColor(report.status)} text-white mb-2`}>
                {report.status}
              </Badge>
              <p className="text-sm text-gray-600">Status</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{report.completed_steps}/{report.total_steps}</div>
              <p className="text-sm text-gray-600">Steps Completed</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-coral">{metrics.success_rate?.toFixed(1) || 0}%</div>
              <p className="text-sm text-gray-600">Success Rate</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {metrics.total_duration_ms ? formatDuration(metrics.total_duration_ms) : 'N/A'}
              </div>
              <p className="text-sm text-gray-600">Duration</p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Progress</span>
              <span className="text-sm text-gray-600">
                {((report.completed_steps / report.total_steps) * 100).toFixed(0)}%
              </span>
            </div>
            <Progress 
              value={(report.completed_steps / report.total_steps) * 100} 
              className="bg-coral h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Creators Found</p>
                <p className="text-2xl font-bold text-gray-900">{report.creators_found || 0}</p>
              </div>
              <Users className="h-8 w-8 text-coral" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Contracts Generated</p>
                <p className="text-2xl font-bold text-gray-900">{report.contracts_generated || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-coral" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Emails Sent</p>
                <p className="text-2xl font-bold text-gray-900">{report.emails_sent || 0}</p>
              </div>
              <Mail className="h-8 w-8 text-coral" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Phone Calls</p>
                <p className="text-2xl font-bold text-gray-900">{report.phone_calls_made || 0}</p>
              </div>
              <Phone className="h-8 w-8 text-coral" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Communication Results */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-coral" />
            Communication Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-lg font-semibold text-gray-900">{report.successful_communications || 0}</p>
                <p className="text-sm text-gray-600">Successful</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-lg font-semibold text-gray-900">{report.failed_communications || 0}</p>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-coral" />
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {metrics.automation_efficiency?.toFixed(1) || 0}%
                </p>
                <p className="text-sm text-gray-600">Efficiency</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Details */}
      {report.step_logs && report.step_logs.length > 0 && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">Step Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.step_logs.map((step: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {step.status === 'COMPLETED' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : step.status === 'FAILED' ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-coral" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{step.step_name}</p>
                      <p className="text-sm text-gray-600">{step.step_type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={step.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {step.status}
                    </Badge>
                    {step.duration_ms && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDuration(step.duration_ms)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Logs */}
      {report.error_logs && report.error_logs.length > 0 && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
              Error Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.error_logs.map((error: any, index: number) => (
                <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-red-900">{error.error_type}</p>
                      <p className="text-sm text-red-700">{error.error_message}</p>
                      {error.step_name && (
                        <p className="text-xs text-red-600 mt-1">Step: {error.step_name}</p>
                      )}
                      <p className="text-xs text-red-600">
                        {new Date(error.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
