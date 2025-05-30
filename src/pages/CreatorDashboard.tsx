
const CreatorDashboard = () => {
  return (
    <div className="min-h-screen bg-carbon p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-space font-bold text-snow mb-2">
            Creator Dashboard
          </h1>
          <p className="text-snow/70">
            Welcome! Track your campaigns, earnings, and performance metrics.
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h3 className="text-snow/70 text-sm font-medium mb-2">Active Campaigns</h3>
            <p className="text-3xl font-bold text-snow">3</p>
            <p className="text-purple-500 text-sm mt-1">2 pending approval</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h3 className="text-snow/70 text-sm font-medium mb-2">Total Earnings</h3>
            <p className="text-3xl font-bold text-snow">$6,500</p>
            <p className="text-green-500 text-sm mt-1">+$2,200 this month</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h3 className="text-snow/70 text-sm font-medium mb-2">Followers</h3>
            <p className="text-3xl font-bold text-snow">125K</p>
            <p className="text-blue-500 text-sm mt-1">+2.3K this month</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h3 className="text-snow/70 text-sm font-medium mb-2">Engagement Rate</h3>
            <p className="text-3xl font-bold text-snow">4.8%</p>
            <p className="text-green-500 text-sm mt-1">+0.2% improvement</p>
          </div>
        </div>

        {/* Campaign Invitations */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-snow mb-4">Campaign Invitations</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
              <div>
                <h3 className="text-snow font-medium">Tech Product Launch</h3>
                <p className="text-snow/60 text-sm">TechCorp • Instagram • 3 posts + 1 reel</p>
              </div>
              <div className="text-right">
                <p className="text-snow font-medium">$2,500</p>
                <p className="text-green-500 text-sm">Active</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
              <div>
                <h3 className="text-snow font-medium">Fashion Summer Collection</h3>
                <p className="text-snow/60 text-sm">StyleBrand • Instagram • 2 posts + stories</p>
              </div>
              <div className="text-right">
                <p className="text-snow font-medium">$1,800</p>
                <p className="text-yellow-500 text-sm">Pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-snow mb-4">Recent Performance</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
              <div>
                <h3 className="text-snow font-medium">Fitness App Promotion Post</h3>
                <p className="text-snow/60 text-sm">Posted 18 days ago • FitLife Campaign</p>
              </div>
              <div className="text-right">
                <p className="text-snow font-medium">15.6K views</p>
                <p className="text-green-500 text-sm">5.2% engagement</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-snow">1,250</p>
                <p className="text-snow/60 text-sm">Likes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-snow">89</p>
                <p className="text-snow/60 text-sm">Comments</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-snow">34</p>
                <p className="text-snow/60 text-sm">Shares</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-snow">$2,200</p>
                <p className="text-snow/60 text-sm">Earned</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;
