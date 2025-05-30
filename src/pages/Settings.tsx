import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Bell, Mail, Smartphone, Megaphone, Users, FileText, BarChart3, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
  created_at: string;
  updated_at: string;
}

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [preferences, setPreferences] = useState({
    email_notifications: true,
    push_notifications: true,
    campaign_updates: true,
    influencer_responses: true,
    contract_updates: true,
    performance_reports: true,
    marketing_emails: false,
  });

  // Fetch notification preferences
  const { data: userPreferences, isLoading } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as NotificationPreferences | null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (userPreferences) {
      setPreferences({
        email_notifications: userPreferences.email_notifications,
        push_notifications: userPreferences.push_notifications,
        campaign_updates: userPreferences.campaign_updates,
        influencer_responses: userPreferences.influencer_responses,
        contract_updates: userPreferences.contract_updates,
        performance_reports: userPreferences.performance_reports,
        marketing_emails: userPreferences.marketing_emails,
      });
    }
  }, [userPreferences]);

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: typeof preferences) => {
      if (!user) throw new Error('No user found');

      const preferencesData = {
        user_id: user.id,
        ...data,
      };

      if (userPreferences) {
        const { error } = await supabase
          .from('notification_preferences')
          .update(preferencesData)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notification_preferences')
          .insert(preferencesData);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast({
        title: "Settings updated successfully",
        description: "Your notification preferences have been saved.",
      });
    },
    onError: (error) => {
      console.error('Error updating preferences:', error);
      toast({
        title: "Error updating settings",
        description: "There was a problem saving your preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePreferenceChange = (key: keyof typeof preferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = () => {
    updatePreferencesMutation.mutate(preferences);
  };

  if (!user) {
    navigate('/login');
    return null;
  }

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
        <div className="space-y-6">
          {/* General Notification Settings */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-snow flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                General Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-snow/70" />
                  <div>
                    <p className="text-snow font-medium">Email Notifications</p>
                    <p className="text-snow/60 text-sm">Receive notifications via email</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.email_notifications}
                  onCheckedChange={(value) => handlePreferenceChange('email_notifications', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-5 w-5 text-snow/70" />
                  <div>
                    <p className="text-snow font-medium">Push Notifications</p>
                    <p className="text-snow/60 text-sm">Receive push notifications in browser</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.push_notifications}
                  onCheckedChange={(value) => handlePreferenceChange('push_notifications', value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Campaign & Influencer Notifications */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-snow flex items-center">
                <Megaphone className="h-5 w-5 mr-2" />
                Campaign & Influencer Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Megaphone className="h-5 w-5 text-snow/70" />
                  <div>
                    <p className="text-snow font-medium">Campaign Updates</p>
                    <p className="text-snow/60 text-sm">Get notified about campaign status changes</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.campaign_updates}
                  onCheckedChange={(value) => handlePreferenceChange('campaign_updates', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-snow/70" />
                  <div>
                    <p className="text-snow font-medium">Influencer Responses</p>
                    <p className="text-snow/60 text-sm">Get notified when influencers respond to campaigns</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.influencer_responses}
                  onCheckedChange={(value) => handlePreferenceChange('influencer_responses', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-snow/70" />
                  <div>
                    <p className="text-snow font-medium">Contract Updates</p>
                    <p className="text-snow/60 text-sm">Get notified about contract changes and signatures</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.contract_updates}
                  onCheckedChange={(value) => handlePreferenceChange('contract_updates', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="h-5 w-5 text-snow/70" />
                  <div>
                    <p className="text-snow font-medium">Performance Reports</p>
                    <p className="text-snow/60 text-sm">Get notified about campaign performance reports</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.performance_reports}
                  onCheckedChange={(value) => handlePreferenceChange('performance_reports', value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Marketing & Promotional */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-snow flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Marketing & Promotional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-5 w-5 text-snow/70" />
                  <div>
                    <p className="text-snow font-medium">Marketing Emails</p>
                    <p className="text-snow/60 text-sm">Receive product updates and promotional content</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.marketing_emails}
                  onCheckedChange={(value) => handlePreferenceChange('marketing_emails', value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/brand-profile')}
              className="border-zinc-700 text-snow hover:bg-zinc-800"
            >
              Brand Profile
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={updatePreferencesMutation.isPending || isLoading}
              className="bg-purple-500 hover:bg-purple-600"
            >
              <Save className="h-4 w-4 mr-2" />
              {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
