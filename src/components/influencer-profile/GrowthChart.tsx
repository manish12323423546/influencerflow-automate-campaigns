
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GrowthChartProps {
  platform: 'instagram' | 'youtube';
}

const mockData = {
  '7d': [
    { date: '7d ago', followers: 512000, engagement: 4.2 },
    { date: '6d ago', followers: 513200, engagement: 4.5 },
    { date: '5d ago', followers: 514100, engagement: 4.1 },
    { date: '4d ago', followers: 515800, engagement: 4.8 },
    { date: '3d ago', followers: 516900, engagement: 4.3 },
    { date: '2d ago', followers: 518200, engagement: 4.9 },
    { date: 'yesterday', followers: 519500, engagement: 5.2 },
    { date: 'today', followers: 521000, engagement: 5.1 },
  ],
  '30d': [
    { date: '30d ago', followers: 480000, engagement: 4.0 },
    { date: '25d ago', followers: 485000, engagement: 4.2 },
    { date: '20d ago', followers: 492000, engagement: 4.1 },
    { date: '15d ago', followers: 498000, engagement: 4.5 },
    { date: '10d ago', followers: 504000, engagement: 4.8 },
    { date: '5d ago', followers: 515000, engagement: 5.0 },
    { date: 'today', followers: 521000, engagement: 5.1 },
  ],
  '1y': [
    { date: '12m ago', followers: 320000, engagement: 3.2 },
    { date: '10m ago', followers: 350000, engagement: 3.5 },
    { date: '8m ago', followers: 380000, engagement: 3.8 },
    { date: '6m ago', followers: 420000, engagement: 4.0 },
    { date: '4m ago', followers: 460000, engagement: 4.2 },
    { date: '2m ago', followers: 495000, engagement: 4.5 },
    { date: 'today', followers: 521000, engagement: 5.1 },
  ],
};

export const GrowthChart = ({ platform }: GrowthChartProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '1y'>('30d');
  const [showYesterday, setShowYesterday] = useState(false);

  const data = mockData[selectedPeriod];
  const displayData = showYesterday && selectedPeriod === '7d' 
    ? data.slice(0, -1) 
    : data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-snow">Growth Trends - {platform}</CardTitle>
          <div className="flex space-x-2">
            {(['7d', '30d', '1y'] as const).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
                className={selectedPeriod === period 
                  ? 'bg-purple-500 hover:bg-purple-600' 
                  : 'border-zinc-700 text-snow/70 hover:bg-zinc-800'
                }
              >
                {period}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {selectedPeriod === '7d' && (
            <div className="mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowYesterday(!showYesterday)}
                className="border-zinc-700 text-snow/70 hover:bg-zinc-800"
              >
                {showYesterday ? 'Show Today' : 'Show Yesterday'}
              </Button>
            </div>
          )}
          
          <motion.div
            className="h-64"
            initial={{ clipPath: 'inset(0 100% 0 0)' }}
            animate={{ clipPath: 'inset(0 0% 0 0)' }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'followers' ? `${(value / 1000).toFixed(0)}K` : `${value}%`,
                    name === 'followers' ? 'Followers' : 'Engagement'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="followers" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#8B5CF6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
