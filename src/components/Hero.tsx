
import { Button } from '@/components/ui/button';
import { ArrowRight, Building, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="container-custom text-center relative z-10">
        <div className="animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-space font-bold mb-8 leading-tight">
            Automate your creator campaigns from{' '}
            <span className="text-purple-500">'discovery'</span> to{' '}
            <span className="text-purple-500">'paid'</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-snow/80 mb-12 max-w-4xl mx-auto leading-relaxed">
            Find the perfect influencers, negotiate fair rates, e-sign contracts, and pay in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link to="/dashboard">
              <Button className="btn-purple group text-lg h-14 px-8">
                <Building className="mr-3 h-6 w-6" />
                Brand Dashboard
                <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            
            <Link to="/creator-dashboard">
              <Button variant="outline" className="btn-outline text-lg group h-14 px-8">
                <Users className="mr-3 h-6 w-6" />
                Creator Dashboard
                <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="relative max-w-5xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="relative bg-gradient-to-br from-carbon via-zinc-900 to-carbon rounded-2xl border border-zinc-800 p-6 shadow-2xl">
            <div className="bg-zinc-800 rounded-xl p-8 min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building className="h-8 w-8 text-purple-500" />
                </div>
                <p className="text-snow/60">Dashboard Preview</p>
                <p className="text-sm text-snow/40 mt-2">Choose your role above to get started</p>
              </div>
            </div>
          </div>
          
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-transparent to-blue-500/20 rounded-2xl blur-xl -z-10"></div>
        </div>
      </div>

      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>
    </section>
  );
};

export default Hero;
