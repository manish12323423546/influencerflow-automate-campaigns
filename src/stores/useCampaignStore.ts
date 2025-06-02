import { create } from 'zustand';
import { CampaignState, CampaignStatus } from '@/lib/agents/types';

interface CampaignStore {
  campaignId: string | null;
  mode: 'AUTOMATIC' | 'MANUAL';
  campaignState: CampaignState;
  setMode: (mode: 'AUTOMATIC' | 'MANUAL') => void;
  setCampaignId: (id: string) => void;
  updateCampaignState: (state: Partial<CampaignState>) => void;
  resetCampaign: () => void;
}

export const useCampaignStore = create<CampaignStore>((set) => ({
  campaignId: null,
  mode: 'AUTOMATIC',
  campaignState: {
    status: CampaignStatus.INITIATED,
    selectedCreators: [],
    sentContracts: [],
    communications: [],
  },
  setMode: (mode) => set({ mode }),
  setCampaignId: (id) => set({ campaignId: id }),
  updateCampaignState: (state) =>
    set((prev) => ({
      campaignState: { ...prev.campaignState, ...state },
    })),
  resetCampaign: () =>
    set({
      campaignId: null,
      mode: 'AUTOMATIC',
      campaignState: {
        status: CampaignStatus.INITIATED,
        selectedCreators: [],
        sentContracts: [],
        communications: [],
      },
    }),
})); 