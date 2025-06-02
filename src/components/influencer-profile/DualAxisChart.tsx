
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DualAxisChartProps {
  platform: 'instagram' | 'youtube';
}

const mockData = {
  instagram: [
    { month: 'Jan', followers: 420000, engagement: 4.2 },
    { month: 'Feb', followers: 435000, engagement: 4.5 },
    { month: 'Mar', followers: 448000, engagement: 4.1 },
    { month: 'Apr', followers: 462000, engagement: 4.8 },
    { month: 'May', followers: 481000, engagement: 4.6 },
    { month: 'Jun', followers: 498000, engagement: 5.2 },
    { month: 'Jul', followers: 521000, engagement: 5.1 },
  ],
  youtube: [
    { month: 'Jan', followers: 280000, engagement: 6.8 },
    { month: 'Feb', followers: 295000, engagement: 7.2 },
    { month: 'Mar', followers: 308000, engagement: 6.9 },
    { month: 'Apr', followers: 324000, engagement: 7.5 },
    { month: 'May', followers: 342000, engagement: 7.1 },
    { month: 'Jun', followers: 358000, engagement: 7.8 },
    { month: 'Jul', followers: 375000, engagement: 7.6 },
  ],
};

export const DualAxisChart = ({ platform }: DualAxisChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const data = mockData[platform];

  useEffect(() => {
    // GSAP-like animation simulation using CSS animations
    if (chartRef.current) {
      const lines = chartRef.current.querySelectorAll('.recharts-line path');
      const bars = chartRef.current.querySelectorAll('.recharts-bar rect');
      
      lines.forEach((line, index) => {
        (line as HTMLElement).style.strokeDasharray = '1000';
        (line as HTMLElement).style.strokeDashoffset = '1000';
        (line as HTMLElement).style.animation = `drawLine 2s ease-out ${index * 0.2}s forwards`;
      });
      
      bars.forEach((bar, index) => {
        (bar as HTMLElement).style.transform = 'scaleY(0)';
        (bar as HTMLElement).style.transformOrigin = 'bottom';
        (bar as HTMLElement).style.animation = `growBar 1.5s ease-out ${index * 0.1}s forwards`;
      });
    }
  }, [data]);

  return (
    <>
      <style>
        {`
          @keyframes drawLine {
            to {
              stroke-dashoffset: 0;
            }
          }
          
          @keyframes growBar {
            to {
              transform: scaleY(1);
            }
          }
        `}
      </style>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-snow">
              Followers vs Engagement - {platform}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={chartRef} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#9CA3AF" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="followers"
                    orientation="left"
                    stroke="#8B5CF6" 
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  />
                  <YAxis 
                    yAxisId="engagement"
                    orientation="right"
                    stroke="#10B981" 
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `${value}%`}
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
                      name === 'followers' ? 'Followers' : 'Engagement Rate'
                    ]}
                  />
                  <Legend />
                  <Bar 
                    yAxisId="followers"
                    dataKey="followers" 
                    fill="#8B5CF6" 
                    fillOpacity={0.6}
                    name="followers"
                  />
                  <Line 
                    yAxisId="engagement"
                    type="monotone" 
                    dataKey="engagement" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    name="engagement"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};
