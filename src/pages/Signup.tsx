import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, ArrowLeft, User, Mail, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
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
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          }
        }
      });

      if (error) {
        toast({
          title: "Signup failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setIsSuccess(true);
      toast({
        title: "Account created!",
        description: "Please login with your credentials.",
      });

      // Redirect to login page after signup
      setTimeout(() => navigate('/login'), 2000);
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
                      Account Created Successfully!
                    </h2>
                    
                    <p className="text-snow/80 mb-6">
                      Your account has been created. Redirecting you to login...
                    </p>

                    <Button
                      onClick={() => navigate('/login')}
                      className="btn-purple"
                    >
                      Go to Login
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
