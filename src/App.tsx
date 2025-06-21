import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ErrorBoundary from "./components/ErrorBoundary";
import { Suspense, lazy } from 'react';
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";

// Lazy load components
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CreatorDashboard = lazy(() => import("./pages/CreatorDashboard"));
const CreatorProfile = lazy(() => import("./pages/CreatorProfile"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TestCopilot = lazy(() => import("./test-copilot"));

// Lazy load dashboard components
const CampaignDetail = lazy(() => import("@/components/dashboard/campaigns").then(m => ({ default: m.CampaignDetail })));
const CreateCampaign = lazy(() => import("@/components/dashboard/campaigns").then(m => ({ default: m.CreateCampaign })));
const Campaigns = lazy(() => import("@/components/dashboard/campaigns").then(m => ({ default: m.Campaigns })));
const InfluencerProfile = lazy(() => import("@/components/dashboard/influencers").then(m => ({ default: m.InfluencerProfile })));
const Influencers = lazy(() => import("@/components/dashboard/influencers").then(m => ({ default: m.Influencers })));

const queryClient = new QueryClient();

// Loading component
const Loading = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <CopilotKit
            runtimeUrl="http://localhost:3001/api/copilotkit"
            agent="campaign_agent"
          >
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ErrorBoundary>
                <Suspense fallback={<Loading />}>
                  <Routes future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <Route path="/" element={<Index />} />
                    <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                    <Route path="/creator-dashboard" element={<ErrorBoundary><CreatorDashboard /></ErrorBoundary>} />
                    <Route path="/creator-profile" element={<ErrorBoundary><CreatorProfile /></ErrorBoundary>} />
                    <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />

                    {/* Campaign Routes */}
                    <Route path="/campaigns/:id" element={<ErrorBoundary><CampaignDetail /></ErrorBoundary>} />
                    <Route path="/campaigns/create" element={<ErrorBoundary><CreateCampaign /></ErrorBoundary>} />
                    <Route path="/campaigns" element={<ErrorBoundary><Campaigns /></ErrorBoundary>} />

                    <Route path="/test-copilot" element={<TestCopilot />} />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </BrowserRouter>
          </CopilotKit>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
