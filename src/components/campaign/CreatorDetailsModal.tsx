import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Creator } from '@/lib/agents/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, Phone, BarChart } from 'lucide-react';

interface CreatorDetailsModalProps {
  creators: Creator[];
  open: boolean;
  onClose: () => void;
}

export const CreatorDetailsModal: React.FC<CreatorDetailsModalProps> = ({
  creators,
  open,
  onClose,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Selected Creators</DialogTitle>
          <DialogDescription>
            {creators.length} creators have been selected for your campaign
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {creators.map((creator) => (
              <Card key={creator.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{creator.name}</h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        {creator.email}
                      </div>
                      {creator.phone && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          {creator.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {creator.metrics.followers.toLocaleString()} followers
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Engagement</span>
                      <BarChart className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-2xl font-bold">
                      {(creator.metrics.engagement * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Relevance</span>
                      <BarChart className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-2xl font-bold">
                      {(creator.metrics.relevanceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Match Score</span>
                      <BarChart className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-2xl font-bold">
                      {(
                        (creator.metrics.engagement * 0.4 +
                          creator.metrics.relevanceScore * 0.6) *
                        100
                      ).toFixed(0)}
                      %
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}; 