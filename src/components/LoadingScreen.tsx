
import { useEffect, useState } from 'react';

const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setTimeout(onComplete, 300);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 bg-carbon z-50 flex items-center justify-center transition-opacity duration-300 ${isLoading ? 'opacity-100' : 'opacity-0'}`}>
      <div className="text-center">
        <div className="animate-scale-in">
          <h1 className="text-6xl font-space font-bold text-snow mb-4">
            Influencer<span className="text-coral">Flow</span>
          </h1>
          <div className="w-24 h-1 bg-coral mx-auto rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
