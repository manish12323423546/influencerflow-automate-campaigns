
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, ArrowLeft, Mail, Lock, Users, Building } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(formData.email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.password) {
      toast({
        title: "Password required",
        description: "Please enter your password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Get user role to redirect appropriately
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });

      // Redirect based on role
      if (roleData?.role === 'creator') {
        navigate('/creator-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
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
            <div className="grid md:grid-cols-2 min-h-[600px]">
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
                      <Building className="h-5 w-5 text-purple-500 mr-3" />
                      <span>Brand Campaign Management</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-purple-500 mr-3" />
                      <span>Creator Collaboration Hub</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Login Form */}
              <div className="p-12 flex flex-col justify-center">
                <div className="mb-8">
                  <h2 className="text-3xl font-space font-bold text-snow mb-2">
                    Welcome back
                  </h2>
                  <p className="text-snow/70">
                    Sign in to your account
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                        placeholder="Enter your password"
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
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-snow/60">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-purple-500 hover:text-purple-400 font-medium">
                      Sign up free
                    </Link>
                  </p>
                </div>

                <p className="text-sm text-snow/60 mt-6 text-center">
                  By continuing, you agree to our{' '}
                  <a href="#terms" className="text-purple-500 hover:text-purple-400">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#privacy" className="text-purple-500 hover:text-purple-400">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;