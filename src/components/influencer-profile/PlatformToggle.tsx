
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface PlatformToggleProps {
  selectedPlatform: 'instagram' | 'youtube';
  onPlatformChange: (platform: 'instagram' | 'youtube') => void;
}

export const PlatformToggle = ({ selectedPlatform, onPlatformChange }: PlatformToggleProps) => {
  return (
    <div className="relative bg-zinc-800 rounded-lg p-1 flex">
      <motion.div
        className="absolute inset-y-1 bg-purple-500 rounded-md"
        initial={false}
        animate={{
          x: selectedPlatform === 'instagram' ? 0 : '100%',
          width: selectedPlatform === 'instagram' ? '50%' : '50%',
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPlatformChange('instagram')}
        className={`relative z-10 px-4 py-2 text-sm font-medium transition-colors ${
          selectedPlatform === 'instagram' ? 'text-white' : 'text-snow/70 hover:text-snow'
        }`}
      >
        Instagram
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPlatformChange('youtube')}
        className={`relative z-10 px-4 py-2 text-sm font-medium transition-colors ${
          selectedPlatform === 'youtube' ? 'text-white' : 'text-snow/70 hover:text-snow'
        }`}
      >
        YouTube
      </Button>
    </div>
  );
};
