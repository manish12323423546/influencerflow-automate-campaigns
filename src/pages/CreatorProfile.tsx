
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Plus, X, Save, Instagram, Youtube, Twitter, Linkedin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CreatorProfile {
  id?: string;
  user_id: string;
  bio: string;
  niche: string;
  preferred_language: string;
  portfolio_urls: string[];
  social_media_links: Record<string, string>;
  profile_image_url: string;
  location: string;
  experience_level: string;
  content_categories: string[];
  rate_per_post: number;
  rate_per_story: number;
  rate_per_reel: number;
}

const CreatorProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<CreatorProfile>({
    user_id: user?.id || '',
    bio: '',
    niche: '',
    preferred_language: 'english',
    portfolio_urls: [],
    social_media_links: {},
    profile_image_url: '',
    location: '',
    experience_level: '',
    content_categories: [],
    rate_per_post: 0,
    rate_per_story: 0,
    rate_per_reel: 0,
  });
  
  const [newPortfolioUrl, setNewPortfolioUrl] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const niches = [
    'Fashion & Lifestyle',
    'Beauty & Cosmetics',
    'Food & Cooking',
    'Travel & Adventure',
    'Fitness & Health',
    'Technology',
    'Gaming',
    'Music & Entertainment',
    'Art & Design',
    'Business & Finance',
    'Education',
    'Parenting & Family'
  ];

  const languages = [
    'english',
    'spanish',
    'french',
    'german',
    'italian',
    'portuguese',
    'hindi',
    'mandarin',
    'japanese',
    'korean'
  ];

  const experienceLevels = [
    'beginner',
    'intermediate',
    'advanced',
    'expert'
  ];

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const profileData = {
        ...profile,
        user_id: user.id,
      };

      const { error } = await supabase
        .from('creator_profiles')
        .upsert(profileData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error saving profile:', error);
        toast({
          title: "Error",
          description: "Failed to save profile. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Profile saved successfully!",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addPortfolioUrl = () => {
    if (newPortfolioUrl.trim()) {
      setProfile(prev => ({
        ...prev,
        portfolio_urls: [...prev.portfolio_urls, newPortfolioUrl.trim()]
      }));
      setNewPortfolioUrl('');
    }
  };

  const removePortfolioUrl = (index: number) => {
    setProfile(prev => ({
      ...prev,
      portfolio_urls: prev.portfolio_urls.filter((_, i) => i !== index)
    }));
  };

  const addCategory = () => {
    if (newCategory.trim() && !profile.content_categories.includes(newCategory.trim())) {
      setProfile(prev => ({
        ...prev,
        content_categories: [...prev.content_categories, newCategory.trim()]
      }));
      setNewCategory('');
    }
  };

  const removeCategory = (category: string) => {
    setProfile(prev => ({
      ...prev,
      content_categories: prev.content_categories.filter(c => c !== category)
    }));
  };

  const updateSocialMedia = (platform: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      social_media_links: {
        ...prev.social_media_links,
        [platform]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-carbon p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-space font-bold text-snow mb-2">
              Creator Profile
            </h1>
            <p className="text-snow/70">
              Manage your profile information and showcase your work
            </p>
          </div>
          <Button 
            onClick={saveProfile} 
            disabled={loading}
            className="btn-purple"
          >
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Image & Basic Info */}
          <div className="lg:col-span-1">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-snow">Profile Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={profile.profile_image_url} />
                    <AvatarFallback className="bg-zinc-800 text-snow text-2xl">
                      {user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" className="btn-outline">
                    <Camera className="mr-2 h-4 w-4" />
                    Upload Photo
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-snow">Profile Image URL</Label>
                    <Input
                      value={profile.profile_image_url}
                      onChange={(e) => setProfile(prev => ({ ...prev, profile_image_url: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                      className="bg-zinc-800 border-zinc-700 text-snow"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-snow">Location</Label>
                    <Input
                      value={profile.location}
                      onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="City, Country"
                      className="bg-zinc-800 border-zinc-700 text-snow"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Profile Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-snow">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-snow">Bio</Label>
                  <Textarea
                    value={profile.bio}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself and your content style..."
                    className="bg-zinc-800 border-zinc-700 text-snow min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-snow">Niche</Label>
                    <Select 
                      value={profile.niche} 
                      onValueChange={(value) => setProfile(prev => ({ ...prev, niche: value }))}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-snow">
                        <SelectValue placeholder="Select your niche" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {niches.map((niche) => (
                          <SelectItem key={niche} value={niche} className="text-snow">
                            {niche}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-snow">Experience Level</Label>
                    <Select 
                      value={profile.experience_level} 
                      onValueChange={(value) => setProfile(prev => ({ ...prev, experience_level: value }))}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-snow">
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {experienceLevels.map((level) => (
                          <SelectItem key={level} value={level} className="text-snow">
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-snow">Preferred Language</Label>
                  <Select 
                    value={profile.preferred_language} 
                    onValueChange={(value) => setProfile(prev => ({ ...prev, preferred_language: value }))}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-snow">
                      <SelectValue placeholder="Select preferred language" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {languages.map((lang) => (
                        <SelectItem key={lang} value={lang} className="text-snow">
                          {lang.charAt(0).toUpperCase() + lang.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Label className="text-snow flex items-center">
                      <Instagram className="mr-2 h-4 w-4" />
                      Instagram
                    </Label>
                    <Input
                      value={profile.social_media_links.instagram || ''}
                      onChange={(e) => updateSocialMedia('instagram', e.target.value)}
                      placeholder="@username"
                      className="bg-zinc-800 border-zinc-700 text-snow"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-snow flex items-center">
                      <Youtube className="mr-2 h-4 w-4" />
                      YouTube
                    </Label>
                    <Input
                      value={profile.social_media_links.youtube || ''}
                      onChange={(e) => updateSocialMedia('youtube', e.target.value)}
                      placeholder="Channel name"
                      className="bg-zinc-800 border-zinc-700 text-snow"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-snow flex items-center">
                      <Twitter className="mr-2 h-4 w-4" />
                      Twitter
                    </Label>
                    <Input
                      value={profile.social_media_links.twitter || ''}
                      onChange={(e) => updateSocialMedia('twitter', e.target.value)}
                      placeholder="@username"
                      className="bg-zinc-800 border-zinc-700 text-snow"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-snow flex items-center">
                      <Linkedin className="mr-2 h-4 w-4" />
                      LinkedIn
                    </Label>
                    <Input
                      value={profile.social_media_links.linkedin || ''}
                      onChange={(e) => updateSocialMedia('linkedin', e.target.value)}
                      placeholder="Profile URL"
                      className="bg-zinc-800 border-zinc-700 text-snow"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Portfolio */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-snow">Portfolio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={newPortfolioUrl}
                    onChange={(e) => setNewPortfolioUrl(e.target.value)}
                    placeholder="Add portfolio URL"
                    className="bg-zinc-800 border-zinc-700 text-snow"
                  />
                  <Button onClick={addPortfolioUrl} variant="outline" className="btn-outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {profile.portfolio_urls.map((url, index) => (
                    <div key={index} className="flex items-center justify-between bg-zinc-800 p-3 rounded">
                      <span className="text-snow truncate">{url}</span>
                      <Button
                        onClick={() => removePortfolioUrl(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Content Categories */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-snow">Content Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Add content category"
                    className="bg-zinc-800 border-zinc-700 text-snow"
                  />
                  <Button onClick={addCategory} variant="outline" className="btn-outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {profile.content_categories.map((category) => (
                    <Badge key={category} variant="secondary" className="bg-purple-600 text-snow">
                      {category}
                      <Button
                        onClick={() => removeCategory(category)}
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-auto p-0 text-snow hover:text-red-300"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Rates */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-snow">Content Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-snow">Rate per Post ($)</Label>
                    <Input
                      type="number"
                      value={profile.rate_per_post}
                      onChange={(e) => setProfile(prev => ({ ...prev, rate_per_post: Number(e.target.value) }))}
                      className="bg-zinc-800 border-zinc-700 text-snow"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-snow">Rate per Story ($)</Label>
                    <Input
                      type="number"
                      value={profile.rate_per_story}
                      onChange={(e) => setProfile(prev => ({ ...prev, rate_per_story: Number(e.target.value) }))}
                      className="bg-zinc-800 border-zinc-700 text-snow"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-snow">Rate per Reel ($)</Label>
                    <Input
                      type="number"
                      value={profile.rate_per_reel}
                      onChange={(e) => setProfile(prev => ({ ...prev, rate_per_reel: Number(e.target.value) }))}
                      className="bg-zinc-800 border-zinc-700 text-snow"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorProfile;
