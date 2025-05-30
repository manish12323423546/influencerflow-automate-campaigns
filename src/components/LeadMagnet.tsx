
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Download } from 'lucide-react';

const LeadMagnet = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      toast({
        title: "Success!",
        description: "We'll send you the feature brochure shortly.",
      });
    }, 1000);
  };

  return (
    <section id="lead-magnet" className="section-padding">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-space font-bold mb-8">
            Ready to transform your{' '}
            <span className="text-coral">influencer marketing?</span>
          </h2>
          
          <p className="text-xl text-snow/80 mb-12 max-w-2xl mx-auto">
            Get our comprehensive feature brochure and see how InfluencerFlow can 10x your campaign efficiency.
          </p>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  type="email"
                  placeholder="Enter your work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-snow placeholder:text-snow/50 focus:border-coral"
                  required
                />
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="btn-coral whitespace-nowrap"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-carbon border-t-transparent rounded-full mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Get Brochure
                    </>
                  )}
                </Button>
              </div>
              
              <p className="text-sm text-snow/60 mt-4">
                No spam, just insights. Unsubscribe anytime.
              </p>
            </form>
          ) : (
            <div className="animate-scale-in">
              <div className="w-20 h-20 bg-coral/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-coral" />
              </div>
              <h3 className="text-2xl font-space font-bold text-snow mb-4">
                Check your inbox!
              </h3>
              <p className="text-snow/80">
                We've sent the feature brochure to {email}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default LeadMagnet;
