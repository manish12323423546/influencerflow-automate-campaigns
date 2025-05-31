
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  brand: string;
  status: 'active' | 'completed' | 'draft' | 'paused';
  budget: number;
  spent: number;
  influencer_count: number;
  reach: number;
  engagement_rate: number;
}

interface CampaignsManagerProps {
  campaigns: Campaign[];
}

const CampaignsManager = ({ campaigns }: CampaignsManagerProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');

  // Enhanced filtering logic
  const filteredCampaigns = campaigns.filter(campaign => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!campaign.name.toLowerCase().includes(searchLower) && 
          !campaign.brand.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    
    // Status filter
    if (statusFilter !== 'all' && campaign.status !== statusFilter) {
      return false;
    }
    
    // Brand filter
    if (brandFilter !== 'all' && campaign.brand !== brandFilter) {
      return false;
    }
    
    return true;
  });

  // Get unique brands for filter
  const uniqueBrands = [...new Set(campaigns.map(campaign => campaign.brand))];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500 bg-green-500/10';
      case 'completed':
        return 'text-blue-500 bg-blue-500/10';
      case 'draft':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'paused':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-snow/50" />
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-snow placeholder:text-snow/50 focus:border-coral pl-10 w-64"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700 text-snow">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>

          {/* Brand Filter */}
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700 text-snow">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all">All Brands</SelectItem>
              {uniqueBrands.map(brand => (
                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Campaigns Table */}
      <Card className="bg-zinc-800/50 border-zinc-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-700">
                <TableHead className="text-snow/80">Campaign</TableHead>
                <TableHead className="text-snow/80">Brand</TableHead>
                <TableHead className="text-snow/80">Status</TableHead>
                <TableHead className="text-snow/80">Budget</TableHead>
                <TableHead className="text-snow/80">Spent</TableHead>
                <TableHead className="text-snow/80">Influencers</TableHead>
                <TableHead className="text-snow/80">Reach</TableHead>
                <TableHead className="text-snow/80">Engagement</TableHead>
                <TableHead className="text-snow/80">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-snow/60">
                    {campaigns.length === 0 
                      ? "No campaigns found. Create your first campaign to get started."
                      : "No campaigns match your current filters. Try adjusting your search criteria."
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <TableRow 
                    key={campaign.id} 
                    className="border-zinc-700 hover:bg-zinc-700/50"
                  >
                    <TableCell className="font-medium text-snow">{campaign.name}</TableCell>
                    <TableCell className="text-snow/80">{campaign.brand}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-snow/80">${campaign.budget.toLocaleString()}</TableCell>
                    <TableCell className="text-snow/80">${campaign.spent.toLocaleString()}</TableCell>
                    <TableCell className="text-snow/80">{campaign.influencer_count}</TableCell>
                    <TableCell className="text-snow/80">{campaign.reach.toLocaleString()}</TableCell>
                    <TableCell className="text-snow/80">{campaign.engagement_rate.toFixed(1)}%</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => navigate(`/campaigns/${campaign.id}`)}
                          variant="ghost"
                          size="sm"
                          className="text-snow/70 hover:text-coral"
                        >
                          View
                        </Button>
                        <Button
                          onClick={() => navigate(`/campaigns/${campaign.id}/edit`)}
                          variant="ghost"
                          size="sm"
                          className="text-snow/70 hover:text-coral"
                        >
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignsManager;
