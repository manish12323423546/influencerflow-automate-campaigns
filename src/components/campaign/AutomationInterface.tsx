import React, { useEffect, useState } from 'react';
import { CampaignState, CampaignStatus, Communication, Creator, CreatorContactPreference, ContactMethod } from '@/lib/agents/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, ArrowRight, Mail, Phone, Bot, Brain, Users } from 'lucide-react';
import { useAutomationAgent } from '@/hooks/useAutomationAgent';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCampaignStore } from '@/stores/useCampaignStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CreatorDetailsModal } from './CreatorDetailsModal';
import { LineChart } from '@/components/ui/line-chart';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface AutomationInterfaceProps {
  campaignId: string;
  mode: 'AUTOMATIC' | 'MANUAL';
  onComplete: (state: CampaignState) => void;
}

const statusConfig = {
  [CampaignStatus.INITIATED]: {
    color: 'bg-blue-500',
    label: 'Initializing',
    progress: 0,
    description: 'Setting up the campaign automation...',
  },
  [CampaignStatus.CREATOR_SEARCH]: {
    color: 'bg-purple-500',
    label: 'Finding Creators',
    progress: 20,
    description: 'Searching for the best creators that match your campaign criteria...',
  },
  [CampaignStatus.CONTRACT_PHASE]: {
    color: 'bg-indigo-500',
    label: 'Generating Contracts',
    progress: 40,
    description: 'Creating and customizing contracts for selected creators...',
  },
  [CampaignStatus.OUTREACH]: {
    color: 'bg-pink-500',
    label: 'Conducting Outreach',
    progress: 60,
    description: 'Reaching out to creators via email and phone...',
  },
  [CampaignStatus.RESPONSE_PROCESSING]: {
    color: 'bg-yellow-500',
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
              ? 'bg-green-500/10 border border-green-500/30'
              : 'bg-red-500/10 border border-red-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {comm.type === 'EMAIL' && <Mail className="h-4 w-4" />}
              {comm.type === 'PHONE' && <Phone className="h-4 w-4" />}
              {comm.type === 'SYSTEM' && <Bot className="h-4 w-4" />}
              <span className={`text-sm ${
                comm.status === 'SENT' ? 'text-green-400' : 'text-red-400'
              }`}>
                {comm.content}
              </span>
            </div>
            <span className="text-xs text-snow/60">
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
    <Card className="p-4 bg-zinc-800 border-zinc-700">
      <div className="flex items-center space-x-2 mb-4">
        <Brain className="h-5 w-5 text-purple-400" />
        <h3 className="font-medium text-snow">CEO Agent Execution Plan</h3>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-snow/70">{plan.strategy_reasoning}</p>
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
        <h4 className="text-sm font-medium text-snow mb-2">Sequence:</h4>
        <div className="space-y-2">
          {plan.sequence.map((action: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 text-sm text-snow/70">
              <span className="w-6">{index + 1}.</span>
              {action.type === 'EMAIL' ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
              <span>Creator {action.creatorId}</span>
              <span className="text-purple-400">Priority: {action.priority}</span>
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
    <Card className="p-4 bg-zinc-800 border-zinc-700">
      <h3 className="font-medium mb-4 text-snow flex items-center">
        <Users className="h-5 w-5 mr-2 text-purple-400" />
        Creator Contact Preferences
      </h3>
      <div className="space-y-4">
        {creators.map((creator) => {
          const preference = preferences.find(p => p.creatorId === creator.id)?.contactMethod || 'NONE';
          return (
            <div key={creator.id} className="p-4 bg-zinc-900 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-snow">{creator.name}</h4>
                  <p className="text-sm text-snow/70">
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
                  <Label htmlFor={`email-${creator.id}`} className="text-snow">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PHONE" id={`phone-${creator.id}`} />
                  <Label htmlFor={`phone-${creator.id}`} className="text-snow">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Phone
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="NONE" id={`none-${creator.id}`} />
                  <Label htmlFor={`none-${creator.id}`} className="text-snow">
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
  const {
    state: campaignState,
    isRunning,
    error,
    startAutomation,
    resetAutomation,
    updateCreatorPreferences
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
        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-snow">Campaign Automation</h2>
              <p className="text-snow/70 mt-1">{currentStatus.description}</p>
            </div>
            <Badge variant={mode === 'AUTOMATIC' ? 'default' : 'secondary'} className="bg-purple-500">
              {mode} Mode
            </Badge>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-500/10 text-red-400 border-red-500/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-snow">{currentStatus.label}</span>
              <span className="text-sm text-snow/70">
                {currentStatus.progress}%
              </span>
            </div>
            <Progress value={currentStatus.progress} className={`${currentStatus.color} h-2`} />
          </div>

          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="ghost"
                className="p-4 h-auto bg-zinc-800 hover:bg-zinc-700 flex flex-col items-stretch border border-zinc-700 text-snow"
                onClick={() => setShowCreatorDetails(true)}
                disabled={campaignState.selectedCreators.length === 0}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium">Selected Creators</h3>
                    <p className="text-xs text-snow/60">
                      {activeCreatorsCount} active / {campaignState.selectedCreators.length} total
                    </p>
                  </div>
                  {campaignState.selectedCreators.length > 0 && (
                    <ArrowRight className="w-4 h-4 text-snow/50" />
                  )}
                </div>
              </Button>
              <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                <h3 className="font-medium mb-2 text-snow">Contracts Sent</h3>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-snow">
                    {campaignState.sentContracts.length}
                  </span>
                  {campaignState.sentContracts.length > 0 && (
                    <ArrowRight className="w-4 h-4 text-snow/50" />
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
            <Card className="p-4 bg-zinc-800 border-zinc-700">
              <h3 className="font-medium mb-3 text-snow">Communication Log</h3>
              <CommunicationList communications={campaignState.communications} />
            </Card>
          </div>

          <div className="mt-6 space-x-4">
            <Button
              onClick={() => startAutomation()}
              disabled={isRunning || activeCreatorsCount === 0}
              className="w-1/2 bg-purple-500 hover:bg-purple-600 text-white"
              variant={isRunning ? 'secondary' : 'default'}
            >
              {isRunning ? 'Automation Running...' : 
                activeCreatorsCount === 0 ? 'Select Contact Methods' : 'Start Automation'}
            </Button>
            <Button
              onClick={resetAutomation}
              disabled={isRunning}
              className="w-1/2 border-zinc-700 text-snow hover:bg-zinc-800"
              variant="outline"
            >
              Reset
            </Button>
          </div>
        </Card>
      </div>

      <CreatorDetailsModal
        creators={campaignState.selectedCreators}
        open={showCreatorDetails}
        onClose={() => setShowCreatorDetails(false)}
      />
    </>
  );
}; 