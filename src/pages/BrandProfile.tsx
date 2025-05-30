
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Building2, Globe, Mail, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface BrandProfile {
  id: string;
  user_id: string;
  company_name: string | null;
  company_description: string | null;
  company_website: string | null;
  company_logo_url: string | null;
  industry: string | null;
  company_size: string | null;
  headquarters_location: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  social_media_links: Record<string, string>;
  created_at: string;
  updated_at: string;
}

const BrandProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    company_name: '',
    company_description: '',
    company_website: '',
    company_logo_url: '',
    industry: '',
    company_size: '',
    headquarters_location: '',
    contact_email: '',
    contact_phone: '',
    social_media_links: {
      twitter: '',
      linkedin: '',
      instagram: '',
      facebook: ''
    }
  });

  // Fetch brand profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['brand-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as BrandProfile | null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        company_name: profile.company_name || '',
        company_description: profile.company_description || '',
        company_website: profile.company_website || '',
        company_logo_url: profile.company_logo_url || '',
        industry: profile.industry || '',
        company_size: profile.company_size || '',
        headquarters_location: profile.headquarters_location || '',
        contact_email: profile.contact_email || '',
        contact_phone: profile.contact_phone || '',
        social_media_links: profile.social_media_links || {
          twitter: '',
          linkedin: '',
          instagram: '',
          facebook: ''
        }
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error('No user found');

      const profileData = {
        user_id: user.id,
        ...data,
      };

      if (profile) {
        const { error } = await supabase
          .from('brand_profiles')
          .update(profileData)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('brand_profiles')
          .insert(profileData);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-profile'] });
      toast({
        title: "Profile updated successfully",
        description: "Your brand profile has been saved.",
      });
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: "There was a problem saving your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('social_')) {
      const socialField = field.replace('social_', '');
      setFormData(prev => ({
        ...prev,
        social_media_links: {
          ...prev.social_media_links,
          [socialField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
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
                Brand Profile
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-snow flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Company Name
                  </label>
                  <Input
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="Enter company name"
                    className="bg-zinc-800 border-zinc-700 text-snow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Industry
                  </label>
                  <Input
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    placeholder="e.g., Technology, Fashion, Food"
                    className="bg-zinc-800 border-zinc-700 text-snow"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-snow mb-2">
                  Company Description
                </label>
                <Textarea
                  value={formData.company_description}
                  onChange={(e) => handleInputChange('company_description', e.target.value)}
                  placeholder="Brief description of your company"
                  className="bg-zinc-800 border-zinc-700 text-snow"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Company Size
                  </label>
                  <Input
                    value={formData.company_size}
                    onChange={(e) => handleInputChange('company_size', e.target.value)}
                    placeholder="e.g., 1-10, 11-50, 51-200"
                    className="bg-zinc-800 border-zinc-700 text-snow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Headquarters Location
                  </label>
                  <Input
                    value={formData.headquarters_location}
                    onChange={(e) => handleInputChange('headquarters_location', e.target.value)}
                    placeholder="City, Country"
                    className="bg-zinc-800 border-zinc-700 text-snow"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-snow flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Contact Email
                  </label>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    placeholder="contact@company.com"
                    className="bg-zinc-800 border-zinc-700 text-snow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Contact Phone
                  </label>
                  <Input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="bg-zinc-800 border-zinc-700 text-snow"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-snow mb-2">
                  <Globe className="h-4 w-4 inline mr-1" />
                  Company Website
                </label>
                <Input
                  type="url"
                  value={formData.company_website}
                  onChange={(e) => handleInputChange('company_website', e.target.value)}
                  placeholder="https://www.company.com"
                  className="bg-zinc-800 border-zinc-700 text-snow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-snow mb-2">
                  Company Logo URL
                </label>
                <Input
                  type="url"
                  value={formData.company_logo_url}
                  onChange={(e) => handleInputChange('company_logo_url', e.target.value)}
                  placeholder="https://www.company.com/logo.png"
                  className="bg-zinc-800 border-zinc-700 text-snow"
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Media Links */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-snow">Social Media Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Twitter
                  </label>
                  <Input
                    value={formData.social_media_links.twitter}
                    onChange={(e) => handleInputChange('social_twitter', e.target.value)}
                    placeholder="https://twitter.com/company"
                    className="bg-zinc-800 border-zinc-700 text-snow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    LinkedIn
                  </label>
                  <Input
                    value={formData.social_media_links.linkedin}
                    onChange={(e) => handleInputChange('social_linkedin', e.target.value)}
                    placeholder="https://linkedin.com/company/company"
                    className="bg-zinc-800 border-zinc-700 text-snow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Instagram
                  </label>
                  <Input
                    value={formData.social_media_links.instagram}
                    onChange={(e) => handleInputChange('social_instagram', e.target.value)}
                    placeholder="https://instagram.com/company"
                    className="bg-zinc-800 border-zinc-700 text-snow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Facebook
                  </label>
                  <Input
                    value={formData.social_media_links.facebook}
                    onChange={(e) => handleInputChange('social_facebook', e.target.value)}
                    placeholder="https://facebook.com/company"
                    className="bg-zinc-800 border-zinc-700 text-snow"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/settings')}
              className="border-zinc-700 text-snow hover:bg-zinc-800"
            >
              Notification Settings
            </Button>
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending || isLoading}
              className="bg-purple-500 hover:bg-purple-600"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrandProfile;
