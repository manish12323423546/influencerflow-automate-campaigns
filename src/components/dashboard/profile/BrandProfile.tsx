import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Building, Globe, Mail, Phone, MapPin, Users } from 'lucide-react';

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
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  // Simulate loading existing brand profile
  useEffect(() => {
    // Mock brand profile data
    const mockBrandProfile: BrandProfile = {
      id: '1',
      user_id: 'mock-user-123',
      company_name: 'TechCorp Inc.',
      company_description: 'A leading technology company specializing in innovative solutions.',
      industry: 'technology',
      company_size: '51-200',
      headquarters_location: 'San Francisco, CA',
      company_website: 'https://techcorp.com',
      contact_email: 'contact@techcorp.com',
      contact_phone: '+1 (555) 123-4567',
      company_logo_url: '',
      social_media_links: {
        website: 'https://techcorp.com',
        linkedin: 'https://linkedin.com/company/techcorp',
        twitter: 'https://twitter.com/techcorp',
        instagram: 'https://instagram.com/techcorp',
        facebook: 'https://facebook.com/techcorp',
      },
    };

    // Simulate API delay
    setTimeout(() => {
      setFormData({
        company_name: mockBrandProfile.company_name || '',
        company_description: mockBrandProfile.company_description || '',
        industry: mockBrandProfile.industry || '',
        company_size: mockBrandProfile.company_size || '',
        headquarters_location: mockBrandProfile.headquarters_location || '',
        company_website: mockBrandProfile.company_website || '',
        contact_email: mockBrandProfile.contact_email || 'user@example.com',
        contact_phone: mockBrandProfile.contact_phone || '',
        company_logo_url: mockBrandProfile.company_logo_url || '',
        social_media_links: mockBrandProfile.social_media_links || {
          website: '',
          linkedin: '',
          twitter: '',
          instagram: '',
          facebook: '',
        },
      });
      setIsLoading(false);
    }, 500);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('social_')) {
      const platform = field.replace('social_', '');
      setFormData(prev => ({
        ...prev,
        social_media_links: {
          ...prev.social_media_links,
          [platform]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Success',
        description: 'Brand profile updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update brand profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          className="mr-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Brand Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="company_name">Company Name</label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  placeholder="Enter company name"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="industry">Industry</label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => handleInputChange('industry', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="company_description">Company Description</label>
              <Textarea
                id="company_description"
                value={formData.company_description}
                onChange={(e) => handleInputChange('company_description', e.target.value)}
                placeholder="Enter company description"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="company_size">Company Size</label>
                <Select
                  value={formData.company_size}
                  onValueChange={(value) => handleInputChange('company_size', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="501+">501+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="headquarters_location">Headquarters Location</label>
                <Input
                  id="headquarters_location"
                  value={formData.headquarters_location}
                  onChange={(e) => handleInputChange('headquarters_location', e.target.value)}
                  placeholder="Enter headquarters location"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="contact_email">Contact Email</label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  placeholder="Enter contact email"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="contact_phone">Contact Phone</label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  placeholder="Enter contact phone"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="company_website">Company Website</label>
              <Input
                id="company_website"
                type="url"
                value={formData.company_website}
                onChange={(e) => handleInputChange('company_website', e.target.value)}
                placeholder="Enter company website"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Social Media Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="social_linkedin">LinkedIn</label>
                <Input
                  id="social_linkedin"
                  type="url"
                  value={formData.social_media_links.linkedin}
                  onChange={(e) => handleInputChange('social_linkedin', e.target.value)}
                  placeholder="Enter LinkedIn profile URL"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="social_twitter">Twitter</label>
                <Input
                  id="social_twitter"
                  type="url"
                  value={formData.social_media_links.twitter}
                  onChange={(e) => handleInputChange('social_twitter', e.target.value)}
                  placeholder="Enter Twitter profile URL"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="social_instagram">Instagram</label>
                <Input
                  id="social_instagram"
                  type="url"
                  value={formData.social_media_links.instagram}
                  onChange={(e) => handleInputChange('social_instagram', e.target.value)}
                  placeholder="Enter Instagram profile URL"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="social_facebook">Facebook</label>
                <Input
                  id="social_facebook"
                  type="url"
                  value={formData.social_media_links.facebook}
                  onChange={(e) => handleInputChange('social_facebook', e.target.value)}
                  placeholder="Enter Facebook profile URL"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BrandProfile;