
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simulate Supabase auth call
      // In real implementation: await supabase.auth.signInWithOtp({ email })
      setTimeout(() => {
        setIsLoading(false);
        setIsSuccess(true);
        toast({
          title: "Magic link sent!",
          description: "Check your inbox for a secure login link.",
        });
      }, 1500);
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-carbon flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Back to home link */}
        <Link 
          to="/" 
          className="inline-flex items-center text-snow/70 hover:text-coral transition-colors mb-8 group"
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
                    Influencer<span className="text-coral">Flow</span>
                  </h1>
                  <p className="text-snow/80 text-lg leading-relaxed mb-8">
                    Automate creator campaigns
                  </p>
                  <p className="text-snow/60">
                    Join thousands of marketers who trust InfluencerFlow to scale their influencer campaigns efficiently.
                  </p>
                </div>
              </div>

              {/* Right Side - Login Form */}
              <div className="p-12 flex flex-col justify-center">
                {!isSuccess ? (
                  <>
                    <div className="mb-8">
                      <h2 className="text-3xl font-space font-bold text-snow mb-2">
                        Welcome back
                      </h2>
                      <p className="text-snow/70">
                        Enter your email to receive a secure login link
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-snow/80 mb-2">
                          Email address
                        </label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-zinc-800 border-zinc-700 text-snow placeholder:text-snow/50 focus:border-coral h-12"
                          required
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full btn-coral h-12 text-lg"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin w-5 h-5 border-2 border-carbon border-t-transparent rounded-full mr-3"></div>
                            Sending magic link...
                          </>
                        ) : (
                          'Send Magic Link'
                        )}
                      </Button>
                    </form>

                    <p className="text-sm text-snow/60 mt-6 text-center">
                      By continuing, you agree to our{' '}
                      <a href="#terms" className="text-coral hover:text-coral/80">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="#privacy" className="text-coral hover:text-coral/80">
                        Privacy Policy
                      </a>
                    </p>
                  </>
                ) : (
                  <div className="text-center animate-fade-in-up">
                    <div className="w-20 h-20 bg-coral/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-coral">
                      <CheckCircle className="h-10 w-10 text-coral" />
                    </div>
                    
                    <h2 className="text-3xl font-space font-bold text-snow mb-4">
                      Check your inbox
                    </h2>
                    
                    <p className="text-snow/80 mb-2">
                      We've sent a secure login link to:
                    </p>
                    
                    <p className="text-coral font-semibold text-lg mb-6">
                      {email}
                    </p>
                    
                    <p className="text-sm text-snow/60">
                      Click the link in your email to sign in safely. The link will expire in 15 minutes.
                    </p>

                    <Button
                      onClick={() => {
                        setIsSuccess(false);
                        setEmail('');
                      }}
                      variant="outline"
                      className="btn-outline mt-6"
                    >
                      Use different email
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

export default Login;
