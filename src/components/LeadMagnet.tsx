
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const LeadMagnet = () => {
  return (
    <section id="signup-cta" className="section-padding">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-space font-bold mb-8">
            Ready to transform your{' '}
            <span className="text-purple-500">influencer marketing?</span>
          </h2>
          
          <p className="text-xl text-snow/80 mb-12 max-w-2xl mx-auto">
            Join thousands of marketers who trust InfluencerFlow to scale their influencer campaigns efficiently.
          </p>

          <div className="animate-scale-in">
            <Link to="/signup">
              <Button className="btn-purple text-lg px-12 py-6">
                <ArrowRight className="mr-2 h-5 w-5" />
                Get Started Free
              </Button>
            </Link>
            
            <p className="text-sm text-snow/60 mt-6">
              No credit card required. Start automating in minutes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeadMagnet;
