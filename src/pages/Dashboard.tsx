
import { Button } from '@/components/ui/button';
import { Users, Home, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-carbon p-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-space font-bold text-snow mb-2">
              Brand Dashboard
            </h1>
            <p className="text-snow/70">
              Welcome! Manage your influencer campaigns and discover creators.
            </p>
          </div>
          <div className="flex gap-4">
            <Link to="/">
              <Button variant="outline" className="btn-outline">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>
            <Link to="/creator-dashboard">
              <Button className="btn-purple">
                <Users className="mr-2 h-4 w-4" />
                Switch to Creator
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h3 className="text-snow/70 text-sm font-medium mb-2">Active Campaigns</h3>
            <p className="text-3xl font-bold text-snow">12</p>
            <p className="text-purple-500 text-sm mt-1">+2 this month</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h3 className="text-snow/70 text-sm font-medium mb-2">Total Spend</h3>
            <p className="text-3xl font-bold text-snow">$45,200</p>
            <p className="text-green-500 text-sm mt-1">+18% vs last month</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h3 className="text-snow/70 text-sm font-medium mb-2">Influencers</h3>
            <p className="text-3xl font-bold text-snow">28</p>
            <p className="text-blue-500 text-sm mt-1">8 new this month</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h3 className="text-snow/70 text-sm font-medium mb-2">Avg. Engagement</h3>
            <p className="text-3xl font-bold text-snow">4.8%</p>
            <p className="text-green-500 text-sm mt-1">+0.3% improvement</p>
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-snow mb-4">Recent Campaigns</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
              <div>
                <h3 className="text-snow font-medium">Tech Product Launch</h3>
                <p className="text-snow/60 text-sm">TechCorp • Active • 5 influencers</p>
              </div>
              <div className="text-right">
                <p className="text-snow font-medium">$15,000</p>
                <p className="text-green-500 text-sm">4.2% engagement</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
              <div>
                <h3 className="text-snow font-medium">Fashion Summer Collection</h3>
                <p className="text-snow/60 text-sm">StyleBrand • Pending • 3 influencers</p>
              </div>
              <div className="text-right">
                <p className="text-snow font-medium">$8,000</p>
                <p className="text-purple-500 text-sm">Pending approval</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
              <div>
                <h3 className="text-snow font-medium">Fitness App Promotion</h3>
                <p className="text-snow/60 text-sm">FitLife • Completed • 2 influencers</p>
              </div>
              <div className="text-right">
                <p className="text-snow font-medium">$12,000</p>
                <p className="text-green-500 text-sm">5.1% engagement</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
