
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Bell, Mail, Smartphone, MessageSquare, TrendingUp } from 'lucide-react';

interface NotificationPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  campaign_updates: boolean;
  influencer_responses: boolean;
  contract_updates: boolean;
  performance_reports: boolean;
  marketing_emails: boolean;
}

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Mock user data
  const mockUser = {
    id: 'mock-user-123',
    email: 'brand@example.com'
  };

  const [preferences, setPreferences] = useState({
    email_notifications: true,
    push_notifications: true,
    campaign_updates: true,
    influencer_responses: true,
    contract_updates: true,
    performance_reports: true,
    marketing_emails: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handlePreferenceChange = (key: string, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setIsSaving(true);
    
    // Simulate saving preferences
    setTimeout(() => {
      toast({
        title: "Settings saved successfully",
        description: "Your notification preferences have been updated.",
      });
      setIsSaving(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-carbon">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard" 
                className="inline-flex items-center text-snow/70 hover:text-purple-500 transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                Dashboard
              </Link>
              <h1 className="text-2xl font-space font-bold text-snow">
                Settings
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-snow">Loading settings...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Account Information */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-snow">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-snow/70 mb-1">Email Address</p>
                  <p className="text-snow">{mockUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-snow/70 mb-1">User ID</p>
                  <p className="text-snow/80 font-mono text-sm">{mockUser.id}</p>
                </div>
                <Button
                  onClick={() => navigate('/brand-profile')}
                  variant="outline"
                  className="border-zinc-700 text-snow hover:bg-zinc-800"
                >
                  Edit Brand Profile
                </Button>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-snow flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-purple-500" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Communication Methods */}
                <div>
                  <h3 className="text-snow font-medium mb-4">Communication Methods</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-snow font-medium">Email Notifications</p>
                          <p className="text-snow/60 text-sm">Receive notifications via email</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.email_notifications}
                        onCheckedChange={(checked) => handlePreferenceChange('email_notifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Smartphone className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-snow font-medium">Push Notifications</p>
                          <p className="text-snow/60 text-sm">Receive notifications on your device</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.push_notifications}
                        onCheckedChange={(checked) => handlePreferenceChange('push_notifications', checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* Notification Types */}
                <div>
                  <h3 className="text-snow font-medium mb-4">Notification Types</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <MessageSquare className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="text-snow font-medium">Campaign Updates</p>
                          <p className="text-snow/60 text-sm">Status changes, milestones, and important updates</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.campaign_updates}
                        onCheckedChange={(checked) => handlePreferenceChange('campaign_updates', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <MessageSquare className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="text-snow font-medium">Influencer Responses</p>
                          <p className="text-snow/60 text-sm">When influencers accept, decline, or respond to campaigns</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.influencer_responses}
                        onCheckedChange={(checked) => handlePreferenceChange('influencer_responses', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <MessageSquare className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-snow font-medium">Contract Updates</p>
                          <p className="text-snow/60 text-sm">Contract signatures, changes, and approvals</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.contract_updates}
                        onCheckedChange={(checked) => handlePreferenceChange('contract_updates', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-snow font-medium">Performance Reports</p>
                          <p className="text-snow/60 text-sm">Weekly and monthly campaign performance reports</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.performance_reports}
                        onCheckedChange={(checked) => handlePreferenceChange('performance_reports', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-snow font-medium">Marketing Emails</p>
                          <p className="text-snow/60 text-sm">Product updates, tips, and promotional content</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.marketing_emails}
                        onCheckedChange={(checked) => handlePreferenceChange('marketing_emails', checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-zinc-800">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-snow">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => navigate('/campaigns')}
                    variant="outline"
                    className="border-zinc-700 text-snow hover:bg-zinc-800"
                  >
                    Manage Campaigns
                  </Button>
                  <Button
                    onClick={() => navigate('/influencers')}
                    variant="outline"
                    className="border-zinc-700 text-snow hover:bg-zinc-800"
                  >
                    Discover Influencers
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
