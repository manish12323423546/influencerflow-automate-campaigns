
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: number;
  format: 'number' | 'percentage' | 'currency' | 'decimal';
  change: number;
  period: string;
}

export const KpiCard = ({ title, value, format, change, period }: KpiCardProps) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      const duration = 1000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      
      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setAnimatedValue(value);
          clearInterval(interval);
        } else {
          setAnimatedValue(current);
        }
      }, duration / steps);
      
      return () => clearInterval(interval);
    }, 200);
    
    return () => clearTimeout(timer);
  }, [value]);

  const formatValue = (val: number) => {
    switch (format) {
      case 'number':
        if (val >= 1000000) {
          return `${(val / 1000000).toFixed(1)}M`;
        } else if (val >= 1000) {
          return `${(val / 1000).toFixed(0)}K`;
        }
        return Math.round(val).toString();
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'currency':
        return `$${val.toFixed(2)}`;
      case 'decimal':
        return val.toFixed(1);
      default:
        return val.toString();
    }
  };

  const isPositive = change > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.5 }}
      className="bg-zinc-900 rounded-lg p-4 border border-zinc-800 relative overflow-hidden"
    >
      <motion.div
        className={`absolute inset-0 ${isPositive ? 'bg-green-500/5' : 'bg-red-500/5'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 0.8, delay: 1.2 }}
      />
      
      <div className="relative z-10">
        <p className="text-sm text-snow/60 mb-2">{title}</p>
        <p className="text-2xl font-bold text-snow mb-2">
          {formatValue(animatedValue)}
        </p>
        
        <div className="flex items-center text-xs">
          {isPositive ? (
            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
          )}
          <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
            {isPositive ? '+' : ''}{change.toFixed(1)}%
          </span>
          <span className="text-snow/50 ml-1">{period}</span>
        </div>
      </div>
    </motion.div>
  );
};
