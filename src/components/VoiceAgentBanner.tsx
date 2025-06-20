import React, { useState, useEffect } from 'react';
import { X, Mic } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface VoiceAgentBannerProps {
  isWidgetOpen?: boolean;
  onClose?: () => void;
}

const VoiceAgentBanner: React.FC<VoiceAgentBannerProps> = ({ 
  isWidgetOpen = false, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);

  // Check if banner was previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('voiceAgentBannerDismissed');
    if (dismissed === 'true') {
      setHasBeenDismissed(true);
      setIsVisible(false);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setHasBeenDismissed(true);
    localStorage.setItem('voiceAgentBannerDismissed', 'true');
    onClose?.();
  };

  if (!isVisible || hasBeenDismissed) {
    return null;
  }

  const bannerContent = (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🚀</span>
        <h3 className="text-lg font-semibold text-dark-text font-space">
          Talk to Your AI Campaign Assistant
        </h3>
      </div>

      {/* Description */}
      <p className="text-sm text-medium-text mb-4">
        Get help with your influencer campaigns using natural voice conversations. Try these examples:
      </p>

      {/* Agent Examples */}
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <span className="text-green-500 text-sm mt-0.5">✅</span>
          <div>
            <p className="text-xs text-medium-text mt-0.5">
              "Find me tech influencers in Bangalore with over 100K followers"
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-green-500 text-sm mt-0.5">✅</span>
          <div>
            <p className="text-xs text-medium-text mt-0.5">
              "Create a campaign brief for a sustainable fashion brand launch"
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-green-500 text-sm mt-0.5">✅</span>
          <div>
            <p className="text-xs text-medium-text mt-0.5">
              "Show me the performance metrics of my active campaigns"
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-green-500 text-sm mt-0.5">✅</span>
          <div>
            <p className="text-xs text-medium-text mt-0.5">
              "Help me draft an outreach message for a potential collaboration"
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-coral/10 to-orange-400/10 rounded-lg p-3 mt-4">
        <div className="flex items-center gap-2 mb-2">
          <Mic className="w-4 h-4 text-coral" />
          <span className="font-medium text-dark-text text-sm">Click the widget and start speaking!</span>
        </div>
        <p className="text-xs text-medium-text">
          <strong>Tip:</strong> Speak naturally and be specific about what you need help with.
        </p>
      </div>
    </div>
  );

  return (
    <Card 
      className="fixed z-40 shadow-lg border-2 border-coral/20 bg-white bottom-20 right-4 w-80 max-h-[80vh] overflow-y-auto"
    >
      <CardContent className="p-4 relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 transition-colors z-10"
          aria-label="Close banner"
        >
          <X className="w-4 h-4 text-medium-text hover:text-dark-text" />
        </button>

        {bannerContent}
      </CardContent>
    </Card>
  );
};

export default VoiceAgentBanner;