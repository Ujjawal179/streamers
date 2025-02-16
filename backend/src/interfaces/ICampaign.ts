export interface ICampaignInput {
  companyId: string;
  videoUrl: string;
  requiredViews: number;
  budget: number;
  name: string;
  description?: string;
}

export interface ICampaignResult {
  youtubers: Array<{
    youtuber: any; // Replace 'any' with proper Youtuber type
    playsNeeded: number;
    expectedViews: number;
    cost: number;
  }>;
  totalCost: number;
  remainingViews: number;
  achievableViews: number;
}

export interface IVideoUpload {
  url: string;
  playNumber?: number;
  totalPlays?: number;
  campaignId?: string;
  paymentId?: string;
}
