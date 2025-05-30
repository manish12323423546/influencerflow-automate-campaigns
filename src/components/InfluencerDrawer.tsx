
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';
import { ExternalLink, Shield, AlertTriangle, CheckCircle, TrendingUp, Users, Heart, MessageCircle } from 'lucide-react';

interface Influencer {
  id: string;
  handle: string;
  name: string;
  avatar_url: string | null;
  platform: string;
  industry: string;
  language: string;
  followers_count: number;
  engagement_rate: number;
  audience_fit_score: number;
  avg_cpe: number;
  roi_index: number;
  fake_follower_score: number;
  safety_scan_score: number;
  risk_flags: string[];
}

interface InfluencerDrawerProps {
  influencer: Influencer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock data for charts
const mockEngagementData = [
  { date: '30d ago', engagement: 4.2, followers: 480000 },
  { date: '25d ago', engagement: 4.8, followers: 485000 },
  { date: '20d ago', engagement: 5.2, followers: 492000 },
  { date: '15d ago', engagement: 4.9, followers: 498000 },
  { date: '10d ago', engagement: 5.5, followers: 504000 },
  { date: '5d ago', engagement: 6.1, followers: 510000 },
  { date: 'today', engagement: 5.9, followers: 515000 },
];

const mockCampaignHistory = [
  { id: '1', name: 'Summer Fashion Drop', brand: 'StyleCo', fee: 2500, engagement: 6.8, reach: 125000, status: 'completed' },
  { id: '2', name: 'Tech Product Launch', brand: 'TechFlow', fee: 3200, engagement: 5.2, reach: 98000, status: 'completed' },
  { id: '3', name: 'Fitness Challenge', brand: 'FitLife', fee: 1800, engagement: 7.1, reach: 156000, status: 'active' },
];

export const InfluencerDrawer = ({ influencer, open, onOpenChange }: InfluencerDrawerProps) => {
  const [activeTab, setActiveTab] = useState('stats');

  if (!influencer) return null;

  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    return count.toString();
  };

  const getRiskColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRiskIcon = (score: number) => {
    if (score >= 8) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (score >= 6) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <AlertTriangle className="h-5 w-5 text-red-500" />;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[800px] bg-zinc-900 border-zinc-800 overflow-y-auto"
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="h-full"
        >
          <SheetHeader className="pb-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={influencer.avatar_url || ''} alt={influencer.name} />
                <AvatarFallback className="bg-purple-500 text-white text-lg">
                  {influencer.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <SheetTitle className="text-2xl text-snow">{influencer.name}</SheetTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-snow/70">{influencer.handle}</span>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-500">
                    {influencer.platform}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 mt-2 text-sm text-snow/60">
                  <span>{formatFollowers(influencer.followers_count)} followers</span>
                  <span>{influencer.industry}</span>
                  <span>{influencer.language}</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-zinc-700">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Profile
              </Button>
            </div>
          </SheetHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Quick Stats */}
            <div className="space-y-4">
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-snow">Key Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-snow/60">Audience Fit Score</p>
                      <p className="text-2xl font-bold text-snow">{influencer.audience_fit_score.toFixed(1)}/10</p>
                    </div>
                    <div>
                      <p className="text-sm text-snow/60">ROI Index</p>
                      <p className="text-2xl font-bold text-snow">{influencer.roi_index.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-snow/60">Avg CPE</p>
                      <p className="text-2xl font-bold text-snow">${influencer.avg_cpe.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-snow/60">Engagement Rate</p>
                      <p className="text-2xl font-bold text-snow">{influencer.engagement_rate.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Assessment */}
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-snow flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getRiskIcon(influencer.fake_follower_score)}
                        <span className="text-sm text-snow">Fake Follower Score</span>
                      </div>
                      <span className={`font-medium ${getRiskColor(influencer.fake_follower_score)}`}>
                        {influencer.fake_follower_score.toFixed(1)}/10
                      </span>
                    </div>
                    <Progress 
                      value={influencer.fake_follower_score * 10} 
                      className="h-2" 
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getRiskIcon(influencer.safety_scan_score)}
                        <span className="text-sm text-snow">Safety Scan Score</span>
                      </div>
                      <span className={`font-medium ${getRiskColor(influencer.safety_scan_score)}`}>
                        {influencer.safety_scan_score.toFixed(1)}/10
                      </span>
                    </div>
                    <Progress 
                      value={influencer.safety_scan_score * 10} 
                      className="h-2" 
                    />
                  </div>

                  {influencer.risk_flags.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-snow/60 mb-2">Risk Flags:</p>
                      <div className="flex flex-wrap gap-2">
                        {influencer.risk_flags.map((flag, index) => (
                          <Badge key={index} variant="destructive" className="text-xs">
                            {flag.replace('-', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Tabs */}
            <div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
                  <TabsTrigger value="stats" className="data-[state=active]:bg-purple-500">Stats</TabsTrigger>
                  <TabsTrigger value="history" className="data-[state=active]:bg-purple-500">History</TabsTrigger>
                  <TabsTrigger value="risk" className="data-[state=active]:bg-purple-500">Risk</TabsTrigger>
                </TabsList>

                <TabsContent value="stats" className="mt-4">
                  <Card className="bg-zinc-800 border-zinc-700">
                    <CardHeader>
                      <CardTitle className="text-snow">90-Day Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={mockEngagementData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="date" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1F2937', 
                                border: '1px solid #374151',
                                borderRadius: '8px'
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="engagement" 
                              stroke="#8B5CF6" 
                              strokeWidth={2}
                              dot={{ fill: '#8B5CF6', strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-snow">+12.5%</p>
                          <p className="text-sm text-snow/60">Engagement Growth</p>
                        </div>
                        <div>
                          <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-snow">+35K</p>
                          <p className="text-sm text-snow/60">New Followers</p>
                        </div>
                        <div>
                          <Heart className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-snow">94.2%</p>
                          <p className="text-sm text-snow/60">Avg Sentiment</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  <Card className="bg-zinc-800 border-zinc-700">
                    <CardHeader>
                      <CardTitle className="text-snow">Campaign History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {mockCampaignHistory.map((campaign) => (
                          <div 
                            key={campaign.id}
                            className="p-4 bg-zinc-700/50 rounded-lg border border-zinc-600"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-snow">{campaign.name}</h4>
                              <Badge 
                                variant={campaign.status === 'completed' ? 'secondary' : 'default'}
                                className={campaign.status === 'active' ? 'bg-green-500/10 text-green-500' : ''}
                              >
                                {campaign.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-snow/60 mb-3">{campaign.brand}</p>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-snow/60">Fee: </span>
                                <span className="text-snow font-medium">${campaign.fee.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-snow/60">Engagement: </span>
                                <span className="text-snow font-medium">{campaign.engagement}%</span>
                              </div>
                              <div>
                                <span className="text-snow/60">Reach: </span>
                                <span className="text-snow font-medium">{campaign.reach.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="risk" className="mt-4">
                  <Card className="bg-zinc-800 border-zinc-700">
                    <CardHeader>
                      <CardTitle className="text-snow">Detailed Risk Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 bg-zinc-700/50 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-snow">Fake Follower Analysis</h4>
                            {getRiskIcon(influencer.fake_follower_score)}
                          </div>
                          <Progress value={influencer.fake_follower_score * 10} className="mb-2" />
                          <p className="text-sm text-snow/60">
                            Score: {influencer.fake_follower_score.toFixed(1)}/10 
                            ({influencer.fake_follower_score >= 8 ? 'Low Risk' : 
                              influencer.fake_follower_score >= 6 ? 'Medium Risk' : 'High Risk'})
                          </p>
                        </div>

                        <div className="p-4 bg-zinc-700/50 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-snow">Content Safety Scan</h4>
                            {getRiskIcon(influencer.safety_scan_score)}
                          </div>
                          <Progress value={influencer.safety_scan_score * 10} className="mb-2" />
                          <p className="text-sm text-snow/60">
                            Score: {influencer.safety_scan_score.toFixed(1)}/10 
                            ({influencer.safety_scan_score >= 8 ? 'Brand Safe' : 
                              influencer.safety_scan_score >= 6 ? 'Moderate Risk' : 'High Risk'})
                          </p>
                        </div>

                        {influencer.risk_flags.length > 0 && (
                          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <h4 className="font-medium text-red-400 mb-2">Active Risk Flags</h4>
                            <div className="space-y-2">
                              {influencer.risk_flags.map((flag, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <AlertTriangle className="h-4 w-4 text-red-400" />
                                  <span className="text-sm text-red-300">{flag.replace('-', ' ')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
};
