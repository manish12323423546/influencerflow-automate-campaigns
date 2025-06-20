import { Button } from '@/components/ui/button';
import { Building, ArrowRight, Sparkles, Target, BarChart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

// Animated Counter Component
const AnimatedCounter = ({ 
  end, 
  suffix = '', 
  duration = 2000 
}: { 
  end: number; 
  suffix?: string; 
  duration?: number; 
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let startTime: number;
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(easeOutQuart * end));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isInView, end, duration]);

  return (
    <span ref={ref} className="text-3xl font-bold text-gray-900 mb-2">
      {count.toLocaleString()}{suffix}
    </span>
  );
};

const Hero = () => {
  return (
    <div className="relative bg-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full">
          <div className="absolute top-20 left-10 w-72 h-72 bg-coral/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-24">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h1 
            className="text-4xl sm:text-5xl lg:text-6xl font-space font-bold text-gray-900"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Scale Your Influencer Marketing with{' '}
            <motion.span 
              className="text-coral"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              AI-Powered
            </motion.span> Automation
          </motion.h1>
          
          <motion.p 
            className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Find the perfect creators, automate campaigns, and track performance - all in one platform.
          </motion.p>

          <motion.div 
            className="mt-10 flex justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Link to="/dashboard">
              <Button className="bg-coral hover:bg-coral/90 text-white group w-full sm:w-auto h-14 px-12 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <Building className="mr-3 h-6 w-6" />
                Start as Brand
                <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats Section */}
        <motion.div 
          className="mt-20 grid grid-cols-1 gap-y-8 sm:grid-cols-3 sm:gap-12"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.div 
              className="bg-coral/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Sparkles className="h-6 w-6 text-coral" />
            </motion.div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              <AnimatedCounter end={10000} suffix="+" />
            </div>
            <p className="text-sm text-gray-600">Active Creators</p>
          </motion.div>

          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.div 
              className="bg-coral/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Target className="h-6 w-6 text-coral" />
            </motion.div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              <AnimatedCounter end={95} suffix="%" />
            </div>
            <p className="text-sm text-gray-600">Campaign Success Rate</p>
          </motion.div>

          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.div 
              className="bg-coral/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <BarChart className="h-6 w-6 text-coral" />
            </motion.div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              <AnimatedCounter end={3} suffix="x" />
            </div>
            <p className="text-sm text-gray-600">Average ROI Increase</p>
          </motion.div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div 
          className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
        >
          <motion.div 
            className="bg-gray-50 border border-gray-200 rounded-xl p-6 hover:border-coral/50 hover:shadow-lg transition-all duration-300"
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.div 
              className="bg-coral/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4"
              whileHover={{ rotate: 15 }}
              transition={{ duration: 0.3 }}
            >
              <Sparkles className="h-6 w-6 text-coral" />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Matching</h3>
            <p className="text-sm text-gray-600">Find creators that perfectly align with your brand values and campaign goals.</p>
          </motion.div>

          <motion.div 
            className="bg-gray-50 border border-gray-200 rounded-xl p-6 hover:border-coral/50 hover:shadow-lg transition-all duration-300"
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.div 
              className="bg-coral/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4"
              whileHover={{ rotate: 15 }}
              transition={{ duration: 0.3 }}
            >
              <Building className="h-6 w-6 text-coral" />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Campaign Automation</h3>
            <p className="text-sm text-gray-600">Automate your workflow from creator discovery to performance tracking.</p>
          </motion.div>

          <motion.div 
            className="bg-gray-50 border border-gray-200 rounded-xl p-6 hover:border-coral/50 hover:shadow-lg transition-all duration-300"
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.div 
              className="bg-coral/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4"
              whileHover={{ rotate: 15 }}
              transition={{ duration: 0.3 }}
            >
              <BarChart className="h-6 w-6 text-coral" />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Performance Analytics</h3>
            <p className="text-sm text-gray-600">Track campaign metrics and ROI with detailed analytics and insights.</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;