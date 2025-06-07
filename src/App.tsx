import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import CreatorDashboard from "./pages/CreatorDashboard";
import CreatorProfile from "./pages/CreatorProfile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Import components from new locations
import { CampaignDetail, CreateCampaign, Campaigns } from "@/components/dashboard/campaigns";
import { InfluencerProfile, Influencers } from "@/components/dashboard/influencers";
import { Outreach } from "@/components/dashboard/outreach";
import { BrandProfile } from "@/components/dashboard/profile";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                <Route path="/creator-dashboard" element={<ErrorBoundary><CreatorDashboard /></ErrorBoundary>} />
                <Route path="/creator-profile" element={<ErrorBoundary><CreatorProfile /></ErrorBoundary>} />
                <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />

                {/* Campaign Routes */}
                <Route path="/campaigns/:id" element={<ErrorBoundary><CampaignDetail /></ErrorBoundary>} />
                <Route path="/campaigns/create" element={<ErrorBoundary><CreateCampaign /></ErrorBoundary>} />
                <Route path="/campaigns" element={<ErrorBoundary><Campaigns /></ErrorBoundary>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
