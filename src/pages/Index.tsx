
import { useState } from 'react';
import LoadingScreen from '@/components/LoadingScreen';
import Hero from '@/components/Hero';
import ProblemSolution from '@/components/ProblemSolution';
import Features from '@/components/Features';
import SocialProof from '@/components/SocialProof';
import LeadMagnet from '@/components/LeadMagnet';
import Footer from '@/components/Footer';

const Index = () => {
  const [showContent, setShowContent] = useState(false);

  return (
    <>
      {!showContent && (
        <LoadingScreen onComplete={() => setShowContent(true)} />
      )}
      
      {showContent && (
        <div className="min-h-screen bg-carbon">
          <Hero />
          <ProblemSolution />
          <Features />
          <SocialProof />
          <LeadMagnet />
          <Footer />
        </div>
      )}
    </>
  );
};

export default Index;
