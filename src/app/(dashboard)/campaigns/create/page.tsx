import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AutomationInterface } from '@/components/campaign/AutomationInterface';
import { CampaignState } from '@/lib/agents/types';
import { Button } from '@/components/ui/button';
import { Bot, Users } from 'lucide-react';
import { useCampaignStore } from '@/stores/useCampaignStore';
import { nanoid } from 'nanoid';

export default function CreateCampaign() {
  const { mode, setMode, setCampaignId, campaignId } = useCampaignStore();

  useEffect(() => {
    // Generate a new campaign ID if none exists
    if (!campaignId) {
      setCampaignId(nanoid());
    }
  }, [campaignId, setCampaignId]);

  const handleAutomationComplete = (state: CampaignState) => {
    // Handle automation completion
    console.log('Automation completed:', state);
  };

  const handleModeSelect = (selectedMode: 'AUTOMATIC' | 'MANUAL') => {
    setMode(selectedMode);
    document.getElementById('automation-section')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-8">Create Campaign</h1>

      <Tabs defaultValue="choose-mode" className="w-full">
        <TabsList className="grid w-full grid-cols-1 mb-8">
          <TabsTrigger value="choose-mode">Choose Campaign Mode</TabsTrigger>
        </TabsList>

        <TabsContent value="choose-mode">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Automatic Mode Card */}
            <Card 
              className={`p-6 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group
                ${mode === 'AUTOMATIC' ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
              onClick={() => handleModeSelect('AUTOMATIC')}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <Bot className="w-8 h-8 text-blue-500" />
                  <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
                    Recommended
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Automatic Mode</h3>
                <p className="text-gray-600 mb-4">
                  Let our AI agent handle the entire campaign process automatically,
                  from creator selection to outreach and contract management.
                </p>
                <ul className="space-y-2 mb-6 text-sm text-gray-600">
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    Intelligent creator selection
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    Automated contract generation
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    Smart communication handling
                  </li>
                </ul>
                <Button 
                  className="w-full"
                  variant={mode === 'AUTOMATIC' ? 'default' : 'secondary'}
                >
                  {mode === 'AUTOMATIC' ? 'Selected' : 'Select Automatic Mode'}
                </Button>
              </div>
            </Card>

            {/* Manual Mode Card */}
            <Card 
              className={`p-6 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group
                ${mode === 'MANUAL' ? 'ring-2 ring-gray-500 shadow-lg' : ''}`}
              onClick={() => handleModeSelect('MANUAL')}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-500/10 to-slate-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-gray-500" />
                  <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                    Traditional
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Manual Mode</h3>
                <p className="text-gray-600 mb-4">
                  Take full control of your campaign process with step-by-step
                  management and AI assistance when needed.
                </p>
                <ul className="space-y-2 mb-6 text-sm text-gray-600">
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    Full control over creator selection
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    Manual contract review
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    Personalized communications
                  </li>
                </ul>
                <Button 
                  variant={mode === 'MANUAL' ? 'default' : 'secondary'}
                  className="w-full"
                >
                  {mode === 'MANUAL' ? 'Selected' : 'Select Manual Mode'}
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Automation Interface Section */}
      <div id="automation-section" className="mt-12">
        {campaignId && (
          <AutomationInterface
            campaignId={campaignId}
            mode={mode}
            onComplete={handleAutomationComplete}
          />
        )}
      </div>
    </div>
  );
} 