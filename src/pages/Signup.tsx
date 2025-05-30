import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, ArrowLeft, User, Mail, Lock, Building, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'brand' | 'creator';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'brand' as UserRole,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(formData.email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Starting signup process for:', formData.email, 'as', formData.role);
      
      // Sign up the user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            role: formData.role,
          }
        }
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        toast({
          title: "Signup failed",
          description: authError.message,
          variant: "destructive",
        });
        return;
      }

      if (!authData.user) {
        toast({
          title: "Signup failed",
          description: "No user data returned from signup.",
          variant: "destructive",
        });
        return;
      }

      console.log('Auth signup successful, user ID:', authData.user.id);

      // Wait a moment for the trigger to run, then manually create records if needed
      setTimeout(async () => {
        try {
          // Check if profile exists
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user!.id)
            .single();

          if (profileError && profileError.code === 'PGRST116') {
            // Profile doesn't exist, create it
            console.log('Creating profile manually');
            const { error: insertProfileError } = await supabase
              .from('profiles')
              .insert({
                id: authData.user!.id,
                email: formData.email,
                full_name: formData.name,
              });
            
            if (insertProfileError) {
              console.error('Error creating profile:', insertProfileError);
            }
          }

          // Check if role exists
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', authData.user!.id)
            .single();

          if (roleError && roleError.code === 'PGRST116') {
            // Role doesn't exist, create it
            console.log('Creating user role manually');
            const { error: insertRoleError } = await supabase
              .from('user_roles')
              .insert({
                user_id: authData.user!.id,
                role: formData.role,
              });
            
            if (insertRoleError) {
              console.error('Error creating user role:', insertRoleError);
            }
          }

          setIsSuccess(true);
          toast({
            title: "Account created!",
            description: "Welcome to InfluencerFlow! You can now sign in.",
          });

          // Redirect based on role after a delay
          setTimeout(() => {
            if (formData.role === 'creator') {
              navigate('/creator-dashboard');
            } else {
              navigate('/dashboard');
            }
          }, 2000);

        } catch (error) {
          console.error('Error in post-signup setup:', error);
          setIsSuccess(true);
          toast({
            title: "Account created!",
            description: "Welcome to InfluencerFlow! Please sign in to continue.",
          });
          setTimeout(() => navigate('/login'), 2000);
        }
      }, 1000);

    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-carbon flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Back to home link */}
        <Link 
          to="/" 
          className="inline-flex items-center text-snow/70 hover:text-purple-500 transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to home
        </Link>

        <Card className="bg-zinc-900 border-zinc-800 shadow-2xl overflow-hidden animate-scale-in">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-2 min-h-[700px]">
              {/* Left Side - Branding */}
              <div className="bg-gradient-to-br from-carbon via-zinc-900 to-carbon p-12 flex flex-col justify-center">
                <div className="max-w-sm">
                  <h1 className="text-4xl font-space font-bold text-snow mb-4">
                    Influencer<span className="text-purple-500">Flow</span>
                  </h1>
                  <p className="text-snow/80 text-lg leading-relaxed mb-8">
                    Automate creator campaigns
                  </p>
                  <div className="space-y-4 text-snow/60">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-purple-500 mr-3" />
                      <span>AI-powered influencer discovery</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-purple-500 mr-3" />
                      <span>Automated contract management</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-purple-500 mr-3" />
                      <span>Real-time campaign analytics</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Signup Form */}
              <div className="p-12 flex flex-col justify-center">
                {!isSuccess ? (
                  <>
                    <div className="mb-8">
                      <h2 className="text-3xl font-space font-bold text-snow mb-2">
                        Create your account
                      </h2>
                      <p className="text-snow/70">
                        Start automating your influencer campaigns today
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Role Selection */}
                      <div>
                        <label className="block text-sm font-medium text-snow/80 mb-3">
                          I am a...
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => handleInputChange('role', 'brand')}
                            className={`p-4 rounded-lg border-2 transition-colors ${
                              formData.role === 'brand'
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-zinc-700 bg-zinc-800'
                            }`}
                          >
                            <Building className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                            <p className="text-snow font-medium">Brand</p>
                            <p className="text-snow/60 text-xs">Manage campaigns</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInputChange('role', 'creator')}
                            className={`p-4 rounded-lg border-2 transition-colors ${
                              formData.role === 'creator'
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-zinc-700 bg-zinc-800'
                            }`}
                          >
                            <Users className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                            <p className="text-snow font-medium">Creator</p>
                            <p className="text-snow/60 text-xs">Join campaigns</p>
                          </button>
                        </div>
                      </div>

                      
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-snow/80 mb-2">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-snow/50" />
                          <Input
                            id="name"
                            type="text"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-snow placeholder:text-snow/50 focus:border-purple-500 h-12 pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-snow/80 mb-2">
                          Email address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-snow/50" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@company.com"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-snow placeholder:text-snow/50 focus:border-purple-500 h-12 pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-snow/80 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-snow/50" />
                          <Input
                            id="password"
                            type="password"
                            placeholder="Create a secure password"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-snow placeholder:text-snow/50 focus:border-purple-500 h-12 pl-10"
                            required
                          />
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full btn-purple h-12 text-lg"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin w-5 h-5 border-2 border-carbon border-t-transparent rounded-full mr-3"></div>
                            Creating account...
                          </>
                        ) : (
                          'Create Account'
                        )}
                      </Button>
                    </form>

                    <div className="mt-6 text-center">
                      <p className="text-sm text-snow/60">
                        Already have an account?{' '}
                        <Link to="/login" className="text-purple-500 hover:text-purple-400 font-medium">
                          Sign in
                        </Link>
                      </p>
                    </div>

                    <p className="text-sm text-snow/60 mt-6 text-center">
                      By creating an account, you agree to our{' '}
                      <a href="#terms" className="text-purple-500 hover:text-purple-400">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="#privacy" className="text-purple-500 hover:text-purple-400">
                        Privacy Policy
                      </a>
                    </p>
                  </>
                ) : (
                  <div className="text-center animate-fade-in-up">
                    <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                      <CheckCircle className="h-10 w-10 text-purple-500" />
                    </div>
                    
                    <h2 className="text-3xl font-space font-bold text-snow mb-4">
                      Welcome to InfluencerFlow!
                    </h2>
                    
                    <p className="text-snow/80 mb-6">
                      Your account has been created successfully. Taking you to your dashboard...
                    </p>

                    <Button
                      onClick={() => {
                        if (formData.role === 'creator') {
                          navigate('/creator-dashboard');
                        } else {
                          navigate('/dashboard');
                        }
                      }}
                      className="btn-purple"
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
