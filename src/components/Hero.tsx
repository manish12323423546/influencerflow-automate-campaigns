
import { Button } from '@/components/ui/button';
import { ArrowRight, Building, Users, Star, Zap, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="container-custom text-center relative z-10">
        <div className="animate-fade-in-up">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-6 py-2 mb-6">
              <Star className="h-4 w-4 text-purple-500" />
              <span className="text-purple-500 font-medium">Trusted by 10,000+ creators</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-space font-bold mb-8 leading-tight">
            Automate your creator campaigns from{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">'discovery'</span> to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">'paid'</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-snow/80 mb-12 max-w-4xl mx-auto leading-relaxed">
            The all-in-one platform that finds perfect influencers, negotiates fair rates, handles contracts, and processes payments automatically.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link to="/creator-dashboard">
              <Button className="btn-purple group text-lg h-16 px-10">
                <Users className="mr-3 h-6 w-6" />
                Start as Creator
                <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            
            <Link to="/dashboard">
              <Button variant="outline" className="btn-outline text-lg group h-16 px-10">
                <Building className="mr-3 h-6 w-6" />
                Start as Brand
                <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl p-8 border border-zinc-700 hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
            <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
              <Target className="h-8 w-8 text-purple-500" />
            </div>
            <h3 className="text-2xl font-space font-bold mb-4 text-snow">Smart Discovery</h3>
            <p className="text-snow/70 leading-relaxed">
              AI-powered matching finds perfect influencers based on audience, engagement, and content quality.
            </p>
          </div>

          <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl p-8 border border-zinc-700 hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
            <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-2xl font-space font-bold mb-4 text-snow">Auto Negotiation</h3>
            <p className="text-snow/70 leading-relaxed">
              Automated chatbot handles rate discussions and contract terms while maintaining your brand voice.
            </p>
          </div>

          <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl p-8 border border-zinc-700 hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
            <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center mb-6">
              <ArrowRight className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-2xl font-space font-bold mb-4 text-snow">Instant Payments</h3>
            <p className="text-snow/70 leading-relaxed">
              Streamlined payment processing with milestone releases and global payment support.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <p className="text-4xl font-space font-bold text-purple-500 mb-2">50M+</p>
            <p className="text-snow/70">Creator Database</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-space font-bold text-blue-500 mb-2">$100M+</p>
            <p className="text-snow/70">Payments Processed</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-space font-bold text-green-500 mb-2">98%</p>
            <p className="text-snow/70">Success Rate</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-space font-bold text-yellow-500 mb-2">24/7</p>
            <p className="text-snow/70">AI Support</p>
          </div>
        </div>
      </div>

      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-1/3 w-1 h-1 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>
    </section>
  );
};

export default Hero;
