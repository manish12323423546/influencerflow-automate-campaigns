
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Building, Globe, Mail, Phone, MapPin, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface BrandProfile {
  id: string;
  user_id: string;
  company_name: string | null;
  company_description: string | null;
  industry: string | null;
  company_size: string | null;
  headquarters_location: string | null;
  company_website: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  company_logo_url: string | null;
  social_media_links: any;
}

const BrandProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    company_name: '',
    company_description: '',
    industry: '',
    company_size: '',
    headquarters_location: '',
    company_website: '',
    contact_email: '',
    contact_phone: '',
    company_logo_url: '',
    social_media_links: {
      website: '',
      linkedin: '',
      twitter: '',
      instagram: '',
      facebook: '',
    },
  });

  // Fetch existing brand profile
  const { data: brandProfile, isLoading } = useQuery({
    queryKey: ['brand-profile', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user found');
      
      const { data, error } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data as BrandProfile | null;
    },
    enabled: !!user,
  });

  // Update form data when profile loads
  useEffect(() => {
    if (brandProfile) {
      setFormData({
        company_name: brandProfile.company_name || '',
        company_description: brandProfile.company_description || '',
        industry: brandProfile.industry || '',
        company_size: brandProfile.company_size || '',
        headquarters_location: brandProfile.headquarters_location || '',
        company_website: brandProfile.company_website || '',
        contact_email: brandProfile.contact_email || user?.email || '',
        contact_phone: brandProfile.contact_phone || '',
        company_logo_url: brandProfile.company_logo_url || '',
        social_media_links: brandProfile.social_media_links || {
          website: '',
          linkedin: '',
          twitter: '',
          instagram: '',
          facebook: '',
        },
      });
    } else if (user) {
      // Set default email from user
      setFormData(prev => ({
        ...prev,
        contact_email: user.email || '',
      }));
    }
  }, [brandProfile, user]);

  // Save brand profile mutation
  const saveBrandProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error('No user found');
      
      const profileData = {
        user_id: user.id,
        ...data,
        updated_at: new Date().toISOString(),
      };

      if (brandProfile) {
        // Update existing profile
        const { data: updatedData, error } = await supabase
          .from('brand_profiles')
          .update(profileData)
          .eq('user_id', user.id)
          .select()
          .single();
        
        if (error) throw error;
        return updatedData;
      } else {
        // Create new profile
        const { data: newData, error } = await supabase
          .from('brand_profiles')
          .insert(profileData)
          .select()
          .single();
        
        if (error) throw error;
        return newData;
      }
    },
    onSuccess: () => {
      toast({
        title: "Profile saved successfully",
        description: "Your brand profile has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['brand-profile'] });
    },
    onError: (error) => {
      console.error('Save profile error:', error);
      toast({
        title: "Error saving profile",
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
          [socialField]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveBrandProfileMutation.mutate(formData);
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
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-snow">Loading profile...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Information */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-snow flex items-center">
                  <Building className="h-5 w-5 mr-2 text-purple-500" />
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
                    <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-snow">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="fashion">Fashion</SelectItem>
                        <SelectItem value="beauty">Beauty</SelectItem>
                        <SelectItem value="fitness">Fitness</SelectItem>
                        <SelectItem value="food">Food & Beverage</SelectItem>
                        <SelectItem value="travel">Travel</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="lifestyle">Lifestyle</SelectItem>
                        <SelectItem value="gaming">Gaming</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Company Description
                  </label>
                  <Textarea
                    value={formData.company_description}
                    onChange={(e) => handleInputChange('company_description', e.target.value)}
                    placeholder="Describe your company and what you do"
                    className="bg-zinc-800 border-zinc-700 text-snow"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-snow mb-2">
                      Company Size
                    </label>
                    <Select value={formData.company_size} onValueChange={(value) => handleInputChange('company_size', value)}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-snow">
                        <SelectValue placeholder="Select company size" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="501-1000">501-1000 employees</SelectItem>
                        <SelectItem value="1000+">1000+ employees</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <Mail className="h-5 w-5 mr-2 text-purple-500" />
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
              </CardContent>
            </Card>

            {/* Social Media Links */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-snow flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-purple-500" />
                  Social Media Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-snow mb-2">
                      LinkedIn
                    </label>
                    <Input
                      value={formData.social_media_links.linkedin}
                      onChange={(e) => handleInputChange('social_linkedin', e.target.value)}
                      placeholder="https://linkedin.com/company/yourcompany"
                      className="bg-zinc-800 border-zinc-700 text-snow"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-snow mb-2">
                      Twitter/X
                    </label>
                    <Input
                      value={formData.social_media_links.twitter}
                      onChange={(e) => handleInputChange('social_twitter', e.target.value)}
                      placeholder="https://twitter.com/yourcompany"
                      className="bg-zinc-800 border-zinc-700 text-snow"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-snow mb-2">
                      Instagram
                    </label>
                    <Input
                      value={formData.social_media_links.instagram}
                      onChange={(e) => handleInputChange('social_instagram', e.target.value)}
                      placeholder="https://instagram.com/yourcompany"
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
                      placeholder="https://facebook.com/yourcompany"
                      className="bg-zinc-800 border-zinc-700 text-snow"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={saveBrandProfileMutation.isPending}
                className="bg-purple-500 hover:bg-purple-600"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveBrandProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BrandProfile;
