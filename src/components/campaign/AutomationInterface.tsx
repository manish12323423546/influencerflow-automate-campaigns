import React, { useEffect, useState } from 'react';
import { CampaignState, CampaignStatus, Communication, Creator, CreatorContactPreference, ContactMethod } from '@/lib/agents/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, ArrowRight, Mail, Phone, Bot, Brain, Users, BarChart3 } from 'lucide-react';
import { useAutomationAgent } from '@/hooks/useAutomationAgent';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCampaignStore } from '@/stores/useCampaignStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CreatorDetailsModal } from './CreatorDetailsModal';
import { LineChart } from '@/components/ui/line-chart';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AutomationReport } from './AutomationReport';

interface AutomationInterfaceProps {
  campaignId: string;
  mode: 'AUTOMATIC' | 'MANUAL';
  onComplete: (state: CampaignState) => void;
}

const statusConfig = {
  [CampaignStatus.INITIATED]: {
    color: 'bg-coral',
    label: 'Initializing',
    progress: 0,
    description: 'Setting up the campaign automation...',
  },
  [CampaignStatus.CREATOR_SEARCH]: {
    color: 'bg-coral',
    label: 'Finding Creators',
    progress: 20,
    description: 'Searching for the best creators that match your campaign criteria...',
  },
  [CampaignStatus.CONTRACT_PHASE]: {
    color: 'bg-coral',
    label: 'Generating Contracts',
    progress: 40,
    description: 'Creating and customizing contracts for selected creators...',
  },
  [CampaignStatus.OUTREACH]: {
    color: 'bg-coral',
    label: 'Conducting Outreach',
    progress: 60,
    description: 'Reaching out to creators via email and phone...',
  },
  [CampaignStatus.RESPONSE_PROCESSING]: {
    color: 'bg-coral',
    label: 'Processing Responses',
    progress: 80,
    description: 'Analyzing creator responses and updating campaign status...',
  },
  [CampaignStatus.COMPLETED]: {
    color: 'bg-green-500',
    label: 'Completed',
    progress: 100,
    description: 'Campaign automation completed successfully!',
  },
  [CampaignStatus.FAILED]: {
    color: 'bg-red-500',
    label: 'Failed',
    progress: 100,
    description: 'An error occurred during campaign automation.',
  },
};

const CommunicationList = ({ communications }: { communications: Communication[] }) => {
  return (
    <div className="space-y-2 mt-4">
      {communications.map((comm) => (
        <div
          key={comm.id}
          className={`p-3 rounded-md ${
            comm.status === 'SENT'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {comm.type === 'EMAIL' && <Mail className="h-4 w-4 text-gray-600" />}
              {comm.type === 'PHONE' && <Phone className="h-4 w-4 text-gray-600" />}
              {comm.type === 'SYSTEM' && <Bot className="h-4 w-4 text-gray-600" />}
              <span className={`text-sm ${
                comm.status === 'SENT' ? 'text-green-600' : 'text-red-600'
              }`}>
                {comm.content}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {new Date(comm.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

const ExecutionPlan = ({ plan }: { plan: any }) => {
  if (!plan) return null;

  const chartData = plan.sequence.map((action: any, index: number) => ({
    x: index + 1,
    y: action.priority,
    type: action.type,
    creator: action.creatorId,
  }));

  return (
    <Card className="p-4 bg-white border-gray-200 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <Brain className="h-5 w-5 text-coral" />
        <h3 className="font-medium text-gray-900">CEO Agent Execution Plan</h3>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">{plan.strategy_reasoning}</p>
      </div>

      <div className="h-48 w-full">
        <LineChart
          data={chartData}
          xLabel="Sequence"
          yLabel="Priority"
          tooltipFormat={(d) => `${d.type} - Creator ${d.creator}`}
        />
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Sequence:</h4>
        <div className="space-y-2">
          {plan.sequence.map((action: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="w-6">{index + 1}.</span>
              {action.type === 'EMAIL' ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
              <span>Creator {action.creatorId}</span>
              <span className="text-coral">Priority: {action.priority}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

const CreatorPreferenceSelector = ({ 
  creators, 
  preferences,
  onPreferenceChange 
}: { 
  creators: Creator[],
  preferences: CreatorContactPreference[],
  onPreferenceChange: (preferences: CreatorContactPreference[]) => void
}) => {
  const handlePreferenceChange = (creatorId: string, method: ContactMethod) => {
    const newPreferences = [...preferences];
    const index = newPreferences.findIndex(p => p.creatorId === creatorId);
    if (index >= 0) {
      newPreferences[index] = { creatorId, contactMethod: method };
    } else {
      newPreferences.push({ creatorId, contactMethod: method });
    }
    onPreferenceChange(newPreferences);
  };

  return (
    <Card className="p-4 bg-white border-gray-200 shadow-sm">
      <h3 className="font-medium mb-4 text-gray-900 flex items-center">
        <Users className="h-5 w-5 mr-2 text-coral" />
        Creator Contact Preferences
      </h3>
      <div className="space-y-4">
        {creators.map((creator) => {
          const preference = preferences.find(p => p.creatorId === creator.id)?.contactMethod || 'NONE';
          return (
            <div key={creator.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{creator.name}</h4>
                  <p className="text-sm text-gray-600">
                    {creator.metrics.followers.toLocaleString()} followers • {creator.metrics.engagement}% engagement
                  </p>
                </div>
              </div>
              <RadioGroup
                value={preference}
                onValueChange={(value) => handlePreferenceChange(creator.id, value as ContactMethod)}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="EMAIL" id={`email-${creator.id}`} />
                  <Label htmlFor={`email-${creator.id}`} className="text-gray-900">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PHONE" id={`phone-${creator.id}`} />
                  <Label htmlFor={`phone-${creator.id}`} className="text-gray-900">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Phone
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="NONE" id={`none-${creator.id}`} />
                  <Label htmlFor={`none-${creator.id}`} className="text-gray-900">
                    No Contact
                  </Label>
                </div>
              </RadioGroup>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export const AutomationInterface: React.FC<AutomationInterfaceProps> = ({
  campaignId,
  mode,
  onComplete,
}) => {
  const [showCreatorDetails, setShowCreatorDetails] = useState(false);
  const [showAutomationReport, setShowAutomationReport] = useState(false);
  const [testingLogging, setTestingLogging] = useState(false);
  const {
    state: campaignState,
    isRunning,
    error,
    startAutomation,
    resetAutomation,
    updateCreatorPreferences,
    testAutomationLogging
  } = useAutomationAgent({
    campaignId,
    mode,
  });

  const updateCampaignState = useCampaignStore((state) => state.updateCampaignState);

  useEffect(() => {
    if (campaignState.status === CampaignStatus.COMPLETED) {
      onComplete(campaignState);
    }
  }, [campaignState.status, onComplete]);

  // Initialize preferences when creators are loaded
  useEffect(() => {
    if (campaignState.selectedCreators.length > 0 && !campaignState.creatorPreferences?.length) {
      // Initialize all creators with 'NONE' preference
      const initialPreferences = campaignState.selectedCreators.map(creator => ({
        creatorId: creator.id,
        contactMethod: 'NONE' as const
      }));
      updateCreatorPreferences(initialPreferences);
    }
  }, [campaignState.selectedCreators, campaignState.creatorPreferences, updateCreatorPreferences]);

  // Optimize state updates by using a ref to track previous state
  const prevStateRef = React.useRef(JSON.stringify(campaignState));
  useEffect(() => {
    const prevState = prevStateRef.current;
    const currentState = JSON.stringify(campaignState);
    
    if (prevState !== currentState) {
      prevStateRef.current = currentState;
      updateCampaignState(campaignState);
    }
  }, [campaignState, updateCampaignState]);

  const currentStatus = statusConfig[campaignState.status];

  // Calculate active creators (those with contact preferences set)
  const activeCreatorsCount = campaignState.selectedCreators.filter(
    creator => creator.contactPreference && creator.contactPreference !== 'NONE'
  ).length;

  return (
    <>
      <div className="space-y-6">
        <Card className="p-6 bg-white border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Campaign Automation</h2>
              <p className="text-gray-600 mt-1">{currentStatus.description}</p>
            </div>
            <Badge variant={mode === 'AUTOMATIC' ? 'default' : 'secondary'} className="bg-coral text-white">
              {mode} Mode
            </Badge>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-50 text-red-600 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">{currentStatus.label}</span>
              <span className="text-sm text-gray-600">
                {currentStatus.progress}%
              </span>
            </div>
            <Progress value={currentStatus.progress} className={`${currentStatus.color} h-2`} />
          </div>

          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="ghost"
                className="p-4 h-auto bg-gray-50 hover:bg-gray-100 flex flex-col items-stretch border border-gray-200 text-gray-900"
                onClick={() => setShowCreatorDetails(true)}
                disabled={campaignState.selectedCreators.length === 0}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium">Selected Creators</h3>
                    <p className="text-xs text-gray-600">
                      {activeCreatorsCount} active / {campaignState.selectedCreators.length} total
                    </p>
                  </div>
                  {campaignState.selectedCreators.length > 0 && (
                    <ArrowRight className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </Button>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-medium mb-2 text-gray-900">Contracts Sent</h3>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    {campaignState.sentContracts.length}
                  </span>
                  {campaignState.sentContracts.length > 0 && (
                    <ArrowRight className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </div>
            </div>

            {campaignState.selectedCreators.length > 0 && (
              <CreatorPreferenceSelector
                creators={campaignState.selectedCreators}
                preferences={campaignState.creatorPreferences || []}
                onPreferenceChange={updateCreatorPreferences}
              />
            )}

            {/* Execution Plan */}
            {campaignState.executionPlan && (
              <ExecutionPlan plan={campaignState.executionPlan} />
            )}

            {/* Communication Log */}
            <Card className="p-4 bg-white border-gray-200 shadow-sm">
              <h3 className="font-medium mb-3 text-gray-900 flex items-center">
                <Mail className="h-4 w-4 mr-2 text-coral" />
                Communication Log
                <span className="ml-2 text-xs bg-coral/10 text-coral px-2 py-1 rounded-full">
                  Gmail Integration Active
                </span>
              </h3>
              <CommunicationList communications={campaignState.communications} />
            </Card>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex space-x-4">
              <Button
                onClick={() => startAutomation()}
                disabled={isRunning || activeCreatorsCount === 0}
                className="flex-1 bg-coral hover:bg-coral/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
                variant={isRunning ? 'secondary' : 'default'}
              >
                {isRunning ? 'Automation Running...' :
                  activeCreatorsCount === 0 ? 'Select Contact Methods' : 'Start Automation'}
              </Button>
              <Button
                onClick={resetAutomation}
                disabled={isRunning}
                className="flex-1 border-gray-200 text-gray-900 hover:bg-gray-50"
                variant="outline"
              >
                Reset
              </Button>
            </div>

            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => setShowAutomationReport(true)}
                variant="outline"
                className="border-coral text-coral hover:bg-coral/5"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Automation Report
              </Button>
              <Button
                onClick={async () => {
                  setTestingLogging(true);
                  try {
                    await testAutomationLogging(campaignId, 'e5c58861-fada-4c8c-bbe7-f7aff2879fcb');
                    alert('Logging test completed successfully! Check console for details.');
                  } catch (error) {
                    alert(`Logging test failed: ${error}`);
                  } finally {
                    setTestingLogging(false);
                  }
                }}
                disabled={testingLogging}
                variant="outline"
                className="border-gray-200 text-gray-900 hover:bg-gray-50"
              >
                {testingLogging ? 'Testing...' : 'Test Logging'}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <CreatorDetailsModal
        creators={campaignState.selectedCreators}
        open={showCreatorDetails}
        onClose={() => setShowCreatorDetails(false)}
      />

      {/* Automation Report Modal */}
      {showAutomationReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <AutomationReport
                campaignId={campaignId}
                onClose={() => setShowAutomationReport(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};