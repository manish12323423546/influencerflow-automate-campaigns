import { Button } from '@/components/ui/button';
import { Users, Building, ArrowRight, Sparkles, Target, BarChart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-space font-bold text-snow">
            Scale Your Influencer Marketing with{' '}
            <span className="text-coral">AI-Powered</span> Automation
          </h1>
          <p className="mt-6 text-lg text-snow/70 max-w-3xl mx-auto">
            Find the perfect creators, automate campaigns, and track performance - all in one platform.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/creator-dashboard">
              <Button className="bg-coral hover:bg-coral/90 text-white group w-full sm:w-auto h-12 px-8">
                <Users className="mr-2 h-5 w-5" />
                Start as Creator
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            
            <Link to="/dashboard">
              <Button variant="outline" className="border-coral text-coral hover:bg-coral hover:text-white group w-full sm:w-auto h-12 px-8">
                <Building className="mr-2 h-5 w-5" />
                Start as Brand
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 grid grid-cols-1 gap-y-8 sm:grid-cols-3 sm:gap-12">
          <div className="text-center">
            <div className="bg-coral/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-6 w-6 text-coral" />
            </div>
            <p className="text-3xl font-bold text-snow mb-2">10,000+</p>
            <p className="text-sm text-snow/70">Active Creators</p>
          </div>

          <div className="text-center">
            <div className="bg-coral/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Target className="h-6 w-6 text-coral" />
            </div>
            <p className="text-3xl font-bold text-snow mb-2">95%</p>
            <p className="text-sm text-snow/70">Campaign Success Rate</p>
          </div>

          <div className="text-center">
            <div className="bg-coral/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BarChart className="h-6 w-6 text-coral" />
            </div>
            <p className="text-3xl font-bold text-snow mb-2">3x</p>
            <p className="text-sm text-snow/70">Average ROI Increase</p>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6 hover:border-coral/50 transition-colors">
            <div className="bg-coral/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-coral" />
            </div>
            <h3 className="text-xl font-semibold text-snow mb-2">AI-Powered Matching</h3>
            <p className="text-sm text-snow/70">Find creators that perfectly align with your brand values and campaign goals.</p>
          </div>

          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6 hover:border-coral/50 transition-colors">
            <div className="bg-coral/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Building className="h-6 w-6 text-coral" />
            </div>
            <h3 className="text-xl font-semibold text-snow mb-2">Campaign Automation</h3>
            <p className="text-sm text-snow/70">Automate your workflow from creator discovery to performance tracking.</p>
          </div>

          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6 hover:border-coral/50 transition-colors">
            <div className="bg-coral/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <BarChart className="h-6 w-6 text-coral" />
            </div>
            <h3 className="text-xl font-semibold text-snow mb-2">Performance Analytics</h3>
            <p className="text-sm text-snow/70">Track campaign metrics and ROI with detailed analytics and insights.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
