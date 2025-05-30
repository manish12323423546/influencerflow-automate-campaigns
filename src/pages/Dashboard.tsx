import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar, 
  Activity,
  CreditCard,
  Receipt,
  Clock
} from 'lucide-react';
import PaymentOverview from '@/components/payments/PaymentOverview';
import TransactionHistory from '@/components/payments/TransactionHistory';
import MilestoneManager from '@/components/payments/MilestoneManager';

const Dashboard = () => {
  const { user, userRole } = useAuth();

  // Sample data for the existing dashboard metrics
  const metrics = [
    {
      title: "Active Campaigns",
      value: "12",
      change: "+20.1%",
      icon: Activity,
      description: "from last month"
    },
    {
      title: "Total Reach",
      value: "2.4M",
      change: "+18.7%", 
      icon: TrendingUp,
      description: "audience reached"
    },
    {
      title: "Influencers",
      value: "145",
      change: "+12.5%",
      icon: Users,
      description: "active partnerships"
    },
    {
      title: "Engagement Rate",
      value: "4.2%",
      change: "+2.1%",
      icon: BarChart3,
      description: "average engagement"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-snow">
      <div className="container-custom py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-space font-bold mb-2">
            Brand Dashboard
          </h1>
          <p className="text-xl text-snow/80">
            Manage your campaigns, track performance, and handle payments
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="milestones" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Milestones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Existing Overview Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric, index) => (
                <Card key={index} className="bg-zinc-800/50 border-zinc-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-snow/80">
                      {metric.title}
                    </CardTitle>
                    <metric.icon className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-snow">{metric.value}</div>
                    <p className="text-xs text-snow/60">
                      <span className="text-green-500">{metric.change}</span> {metric.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-snow">Quick Actions</CardTitle>
                  <CardDescription className="text-snow/60">
                    Common tasks and shortcuts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 p-2 hover:bg-zinc-700/50 rounded cursor-pointer">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="text-snow">Find Influencers</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 hover:bg-zinc-700/50 rounded cursor-pointer">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-snow">Create Campaign</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 hover:bg-zinc-700/50 rounded cursor-pointer">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-snow">Process Payment</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-snow">Recent Activity</CardTitle>
                  <CardDescription className="text-snow/60">
                    Latest updates and notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-snow/80">
                    • New influencer application received
                  </div>
                  <div className="text-sm text-snow/80">
                    • Campaign "Summer Collection" launched
                  </div>
                  <div className="text-sm text-snow/80">
                    • Payment milestone approved
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-snow">Performance Summary</CardTitle>
                  <CardDescription className="text-snow/60">
                    This month's highlights
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-snow/80">Campaign ROI</span>
                    <span className="text-green-500">+24%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-snow/80">Content Created</span>
                    <span className="text-snow">89 posts</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-snow/80">Total Spent</span>
                    <span className="text-snow">₹2,45,000</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <div className="space-y-6">
              <PaymentOverview />
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-snow">Payment Management</CardTitle>
                  <CardDescription className="text-snow/60">
                    Overview of your payment activities and pending transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-snow/80">
                    Use the Transactions and Milestones tabs to manage your payments in detail.
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionHistory />
          </TabsContent>

          <TabsContent value="milestones">
            <MilestoneManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
