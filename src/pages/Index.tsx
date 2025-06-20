import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <motion.div 
      className="min-h-screen bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Navigation */}
      <motion.nav 
        className="border-b border-gray-200/50 bg-white/90 backdrop-blur-xl fixed top-0 left-0 right-0 z-50 shadow-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <motion.div 
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Link to="/" className="text-2xl font-space font-bold text-gray-900 hover:text-coral transition-colors duration-300">
                Influencer<span className="text-coral">Flow</span>
              </Link>
            </motion.div>
            <motion.div 
              className="hidden md:flex items-center space-x-8"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                <Link to="/dashboard" className="text-gray-600 hover:text-coral transition-colors duration-300 font-medium">
                  For Brands
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                <Link to="/creator-dashboard" className="text-gray-600 hover:text-coral transition-colors duration-300 font-medium">
                  For Creators
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main>
        <Hero />
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Features />
        </motion.div>
      </main>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <Footer />
      </motion.div>
    </motion.div>
  );
};

export default Index;
