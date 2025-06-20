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
          Talk to Your AI Campaign Assistants
        </h3>
      </div>

      {/* Description */}
      <p className="text-sm text-medium-text mb-4">
        Choose your AI assistant for different campaign needs. Click the widgets and start speaking!
      </p>

      {/* Agent Types */}
      <div className="space-y-4">
        {/* CEO Agent */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">👔</span>
            <h4 className="font-semibold text-dark-text text-sm">CEO Agent (Bottom Right)</h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 text-sm mt-0.5">✅</span>
              <p className="text-xs text-medium-text">
                "Create a strategic campaign brief for our Q2 launch"
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500 text-sm mt-0.5">✅</span>
              <p className="text-xs text-medium-text">
                "Show me performance metrics across all campaigns"
              </p>
            </div>
          </div>
        </div>

        {/* Negotiation Agent */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🤝</span>
            <h4 className="font-semibold text-dark-text text-sm">Negotiation Agent (Top Right)</h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-green-500 text-sm mt-0.5">✅</span>
              <p className="text-xs text-medium-text">
                "Help me negotiate rates with this influencer"
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 text-sm mt-0.5">✅</span>
              <p className="text-xs text-medium-text">
                "Draft an outreach message for potential collaboration"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-coral/10 to-orange-400/10 rounded-lg p-3 mt-4">
        <div className="flex items-center gap-2 mb-2">
          <Mic className="w-4 h-4 text-coral" />
          <span className="font-medium text-dark-text text-sm">Choose Your Agent & Start Speaking!</span>
        </div>
        <p className="text-xs text-medium-text">
          <strong>Tip:</strong> Select the right agent for your task - CEO for strategy, Negotiation for deals.
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