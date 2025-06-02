import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Home, ArrowRight, Briefcase, Trophy, FileText, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import CampaignOpportunities from '@/components/CampaignOpportunities';
import MyCampaigns from '@/components/MyCampaigns';
import ContractsPage from '@/components/contracts/ContractsPage';

const CreatorDashboard = () => {
  const [activeSection, setActiveSection] = useState<'overview' | 'opportunities' | 'campaigns' | 'contracts'>('overview');

  return (
    <div className="min-h-screen bg-carbon">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Navigation Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 lg:mb-8 space-y-4 lg:space-y-0">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-space font-bold text-snow mb-2">
              Creator Dashboard
            </h1>
            <p className="text-sm sm:text-base text-snow/70">
              Welcome! Track your campaigns, earnings, and performance metrics.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4">
            <Link to="/creator-profile" className="flex-1 sm:flex-none">
              <Button variant="outline" className="w-full sm:w-auto border-coral text-coral hover:bg-coral hover:text-white text-xs sm:text-sm">
                <User className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Profile
              </Button>
            </Link>
            <Link to="/" className="flex-1 sm:flex-none">
              <Button variant="outline" className="w-full sm:w-auto border-coral text-coral hover:bg-coral hover:text-white text-xs sm:text-sm">
                <Home className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Home
              </Button>
            </Link>
            <Link to="/dashboard" className="flex-1 sm:flex-none">
              <Button className="w-full sm:w-auto bg-coral hover:bg-coral/90 text-white text-xs sm:text-sm">
                <Building className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Switch to Brand</span>
                <span className="sm:hidden">Brand</span>
                <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-4 mb-6 lg:mb-8 overflow-x-auto">
          <Button
            onClick={() => setActiveSection('overview')}
            variant={activeSection === 'overview' ? 'default' : 'outline'}
            className={`w-full sm:w-auto text-xs sm:text-sm whitespace-nowrap ${
              activeSection === 'overview' ? 'bg-coral hover:bg-coral/90' : 'border-zinc-700 text-snow hover:bg-zinc-800'
            }`}
          >
            Dashboard Overview
          </Button>
          <Button
            onClick={() => setActiveSection('opportunities')}
            variant={activeSection === 'opportunities' ? 'default' : 'outline'}
            className={`w-full sm:w-auto text-xs sm:text-sm whitespace-nowrap ${
              activeSection === 'opportunities' ? 'bg-coral hover:bg-coral/90' : 'border-zinc-700 text-snow hover:bg-zinc-800'
            }`}
          >
            <Briefcase className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Campaign </span>Opportunities
          </Button>
          <Button
            onClick={() => setActiveSection('campaigns')}
            variant={activeSection === 'campaigns' ? 'default' : 'outline'}
            className={`w-full sm:w-auto text-xs sm:text-sm whitespace-nowrap ${
              activeSection === 'campaigns' ? 'bg-coral hover:bg-coral/90' : 'border-zinc-700 text-snow hover:bg-zinc-800'
            }`}
          >
            <Trophy className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            My Campaigns
          </Button>
          <Button
            onClick={() => setActiveSection('contracts')}
            variant={activeSection === 'contracts' ? 'default' : 'outline'}
            className={`w-full sm:w-auto text-xs sm:text-sm whitespace-nowrap ${
              activeSection === 'contracts' ? 'bg-coral hover:bg-coral/90' : 'border-zinc-700 text-snow hover:bg-zinc-800'
            }`}
          >
            <FileText className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Contracts
          </Button>
        </div>

        {activeSection === 'overview' ? (
          <div className="space-y-6 lg:space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 lg:p-6">
                <h3 className="text-snow/70 text-xs sm:text-sm font-medium mb-2">Active Campaigns</h3>
                <p className="text-2xl sm:text-3xl font-bold text-snow">3</p>
                <p className="text-coral text-xs sm:text-sm mt-1">2 pending approval</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 lg:p-6">
                <h3 className="text-snow/70 text-xs sm:text-sm font-medium mb-2">Total Earnings</h3>
                <p className="text-2xl sm:text-3xl font-bold text-snow">$6,500</p>
                <p className="text-green-500 text-xs sm:text-sm mt-1">+$2,200 this month</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 lg:p-6">
                <h3 className="text-snow/70 text-xs sm:text-sm font-medium mb-2">Followers</h3>
                <p className="text-2xl sm:text-3xl font-bold text-snow">125K</p>
                <p className="text-blue-500 text-xs sm:text-sm mt-1">+2.3K this month</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 lg:p-6">
                <h3 className="text-snow/70 text-xs sm:text-sm font-medium mb-2">Engagement Rate</h3>
                <p className="text-2xl sm:text-3xl font-bold text-snow">4.8%</p>
                <p className="text-green-500 text-xs sm:text-sm mt-1">+0.2% improvement</p>
              </div>
            </div>

            {/* Campaign Invitations */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-snow mb-4">Campaign Invitations</h2>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-zinc-800 rounded-lg space-y-2 sm:space-y-0">
                  <div className="flex-1">
                    <h3 className="text-snow font-medium text-sm sm:text-base">Tech Product Launch</h3>
                    <p className="text-snow/60 text-xs sm:text-sm">TechCorp • Instagram • 3 posts + 1 reel</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-snow font-medium text-sm sm:text-base">$2,500</p>
                    <p className="text-green-500 text-xs sm:text-sm">Active</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-zinc-800 rounded-lg space-y-2 sm:space-y-0">
                  <div className="flex-1">
                    <h3 className="text-snow font-medium text-sm sm:text-base">Fashion Summer Collection</h3>
                    <p className="text-snow/60 text-xs sm:text-sm">StyleBrand • Instagram • 2 posts + stories</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-snow font-medium text-sm sm:text-base">$1,800</p>
                    <p className="text-yellow-500 text-xs sm:text-sm">Pending</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Overview */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-snow mb-4">Recent Performance</h2>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-zinc-800 rounded-lg space-y-2 sm:space-y-0">
                  <div className="flex-1">
                    <h3 className="text-snow font-medium text-sm sm:text-base">Fitness App Promotion Post</h3>
                    <p className="text-snow/60 text-xs sm:text-sm">Posted 18 days ago • FitLife Campaign</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-snow font-medium text-sm sm:text-base">15.6K views</p>
                    <p className="text-green-500 text-xs sm:text-sm">5.2% engagement</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-center">
                  <div className="p-3 sm:p-4 bg-zinc-800 rounded-lg">
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-snow">1,250</p>
                    <p className="text-snow/60 text-xs sm:text-sm">Likes</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-zinc-800 rounded-lg">
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-snow">89</p>
                    <p className="text-snow/60 text-xs sm:text-sm">Comments</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-zinc-800 rounded-lg">
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-snow">34</p>
                    <p className="text-snow/60 text-xs sm:text-sm">Shares</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-zinc-800 rounded-lg">
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-snow">$2,200</p>
                    <p className="text-snow/60 text-xs sm:text-sm">Earned</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeSection === 'opportunities' ? (
          <CampaignOpportunities />
        ) : activeSection === 'campaigns' ? (
          <MyCampaigns />
        ) : (
          <ContractsPage />
        )}
      </div>
    </div>
  );
};

export default CreatorDashboard;
