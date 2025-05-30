
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, DollarSign, TrendingUp, ExternalLink } from 'lucide-react';

interface HistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  influencerId: string;
}

const mockCollaborations = [
  {
    id: '1',
    campaign_name: 'Summer Fashion Collection 2024',
    brand: 'StyleCo',
    status: 'completed',
    fee: 2500,
    engagement_rate: 6.8,
    reach: 125000,
    start_date: '2024-06-01',
    end_date: '2024-06-15',
    deliverables: ['2 Instagram Posts', '1 Story Series', '1 Reel'],
    performance: {
      impressions: 145000,
      clicks: 3400,
      conversions: 89
    }
  },
  {
    id: '2',
    campaign_name: 'Tech Product Launch',
    brand: 'TechFlow',
    status: 'completed',
    fee: 3200,
    engagement_rate: 5.2,
    reach: 98000,
    start_date: '2024-05-15',
    end_date: '2024-05-20',
    deliverables: ['1 YouTube Video', '3 Instagram Posts'],
    performance: {
      impressions: 112000,
      clicks: 2890,
      conversions: 67
    }
  },
  {
    id: '3',
    campaign_name: 'Fitness Challenge',
    brand: 'FitLife',
    status: 'active',
    fee: 1800,
    engagement_rate: 7.1,
    reach: 156000,
    start_date: '2024-07-01',
    end_date: '2024-07-31',
    deliverables: ['4 Instagram Posts', '2 Reels', 'Story Updates'],
    performance: {
      impressions: 178000,
      clicks: 4100,
      conversions: 134
    }
  },
  {
    id: '4',
    campaign_name: 'Beauty Brand Partnership',
    brand: 'GlowUp Cosmetics',
    status: 'completed',
    fee: 4500,
    engagement_rate: 8.9,
    reach: 203000,
    start_date: '2024-04-10',
    end_date: '2024-04-25',
    deliverables: ['3 Instagram Posts', '2 YouTube Videos', '1 Live Session'],
    performance: {
      impressions: 234000,
      clicks: 5670,
      conversions: 189
    }
  }
];

export const HistoryDrawer = ({ open, onOpenChange, influencerId }: HistoryDrawerProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[600px] bg-zinc-900 border-zinc-800 overflow-y-auto"
      >
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="h-full"
            >
              <SheetHeader className="pb-6">
                <SheetTitle className="text-2xl text-snow">Collaboration History</SheetTitle>
                <p className="text-snow/70">Past and ongoing partnerships</p>
              </SheetHeader>

              <div className="space-y-6">
                {mockCollaborations.map((collab, index) => (
                  <motion.div
                    key={collab.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-zinc-800 border-zinc-700">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-snow mb-1">
                              {collab.campaign_name}
                            </h3>
                            <p className="text-snow/70 mb-2">{collab.brand}</p>
                            <Badge className={getStatusColor(collab.status)}>
                              {collab.status}
                            </Badge>
                          </div>
                          <Button variant="ghost" size="sm" className="text-snow/70">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center text-sm">
                            <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                            <span className="text-snow/70">Fee:</span>
                            <span className="text-snow ml-1 font-medium">
                              ${collab.fee.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center text-sm">
                            <TrendingUp className="h-4 w-4 mr-2 text-purple-500" />
                            <span className="text-snow/70">Engagement:</span>
                            <span className="text-snow ml-1 font-medium">
                              {collab.engagement_rate}%
                            </span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                            <span className="text-snow/70">Duration:</span>
                            <span className="text-snow ml-1 font-medium">
                              {new Date(collab.start_date).toLocaleDateString()} - {new Date(collab.end_date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center text-sm">
                            <span className="text-snow/70">Reach:</span>
                            <span className="text-snow ml-1 font-medium">
                              {collab.reach.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-snow/70 mb-2">Deliverables:</p>
                            <div className="flex flex-wrap gap-2">
                              {collab.deliverables.map((deliverable, idx) => (
                                <Badge key={idx} variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
                                  {deliverable}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-snow/70 mb-2">Performance:</p>
                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div className="text-center">
                                <p className="text-snow font-medium">{collab.performance.impressions.toLocaleString()}</p>
                                <p className="text-snow/60">Impressions</p>
                              </div>
                              <div className="text-center">
                                <p className="text-snow font-medium">{collab.performance.clicks.toLocaleString()}</p>
                                <p className="text-snow/60">Clicks</p>
                              </div>
                              <div className="text-center">
                                <p className="text-snow font-medium">{collab.performance.conversions}</p>
                                <p className="text-snow/60">Conversions</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
};
