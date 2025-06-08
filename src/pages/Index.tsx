import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200/50 bg-white/90 backdrop-blur-xl fixed top-0 left-0 right-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-space font-bold text-gray-900 hover:text-coral transition-colors duration-300">
                Influencer<span className="text-coral">Flow</span>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/dashboard" className="text-gray-600 hover:text-coral transition-colors duration-300 font-medium">
                For Brands
              </Link>
              <Link to="/creator-dashboard" className="text-gray-600 hover:text-coral transition-colors duration-300 font-medium">
                For Creators
              </Link>
              <Link to="/login">
                <Button className="bg-coral hover:bg-coral/90 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 hover:shadow-lg">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <Hero />
        <Features />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
