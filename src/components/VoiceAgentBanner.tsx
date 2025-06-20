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

  // Debug: Log when isWidgetOpen changes
  useEffect(() => {
    console.log('🎯 VoiceAgentBanner: isWidgetOpen changed to:', isWidgetOpen);
  }, [isWidgetOpen]);

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
          Talk to Your AI Agents
        </h3>
      </div>

      {/* Description */}
      <p className="text-sm text-medium-text mb-4">
        Maximize your influencer campaigns with smart agents — here are some quick ideas to get started:
      </p>

      {/* Agent Examples */}
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <span className="text-green-500 text-sm mt-0.5">✅</span>
          <div>
            <span className="font-medium text-coral text-sm">CEO Agent:</span>
            <p className="text-xs text-medium-text mt-0.5">
              "Draft a high-level campaign strategy for a summer product launch."
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-green-500 text-sm mt-0.5">✅</span>
          <div>
            <span className="font-medium text-coral text-sm">Discovery Specialist Agent:</span>
            <p className="text-xs text-medium-text mt-0.5">
              "Find 10 lifestyle influencers in Mumbai with over 50K followers."
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-green-500 text-sm mt-0.5">✅</span>
          <div>
            <span className="font-medium text-coral text-sm">Negotiation Agent:</span>
            <p className="text-xs text-medium-text mt-0.5">
              "Negotiate a better rate with @fitnessguru for a 3-post package."
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-green-500 text-sm mt-0.5">✅</span>
          <div>
            <span className="font-medium text-coral text-sm">Report Summary Agent:</span>
            <p className="text-xs text-medium-text mt-0.5">
              "Summarize last month's campaign ROI and key insights in 3 bullet points."
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-green-500 text-sm mt-0.5">✅</span>
          <div>
            <span className="font-medium text-coral text-sm">Campaign Management Agent:</span>
            <p className="text-xs text-medium-text mt-0.5">
              "Schedule weekly check-ins with creators and share content deadlines."
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-coral/10 to-orange-400/10 rounded-lg p-3 mt-4">
        <div className="flex items-center gap-2 mb-2">
          <Mic className="w-4 h-4 text-coral" />
          <span className="font-medium text-dark-text text-sm">Just say it — your agents handle the rest!</span>
        </div>
        <p className="text-xs text-medium-text">
          <strong>Tip:</strong> Keep this banner short, friendly, and actionable — so users feel inspired to speak naturally to the widget.
        </p>
      </div>
    </div>
  );

  return (
    <Card 
      className={`
        fixed z-40 shadow-lg border-2 border-coral/20 bg-white
        transition-all duration-500 ease-in-out max-h-[80vh] overflow-y-auto
        ${isWidgetOpen 
          ? 'bottom-20 right-[400px] w-80' 
          : 'bottom-20 right-4 w-80'
        }
      `}
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