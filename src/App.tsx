
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import CreatorDashboard from "./pages/CreatorDashboard";
import CreatorProfile from "./pages/CreatorProfile";
import Influencers from "./pages/Influencers";
import InfluencerProfile from "./pages/InfluencerProfile";
import Campaigns from "./pages/Campaigns";
import CreateCampaign from "./pages/CreateCampaign";
import CampaignDetail from "./pages/CampaignDetail";
import EditCampaign from "./pages/EditCampaign";
import CreatorCampaignDetail from "./pages/CreatorCampaignDetail";
import BrandProfile from "./pages/BrandProfile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/creator-dashboard" element={<CreatorDashboard />} />
          <Route path="/creator-profile" element={<CreatorProfile />} />
          <Route path="/influencers" element={<Influencers />} />
          <Route path="/influencers/:id" element={<InfluencerProfile />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaigns/create" element={<CreateCampaign />} />
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
          <Route path="/campaigns/:id/edit" element={<EditCampaign />} />
          <Route path="/creator-campaigns/:id" element={<CreatorCampaignDetail />} />
          <Route path="/brand-profile" element={<BrandProfile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
