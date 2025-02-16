export interface ICampaignInput {
  name: string;
  companyId: string;
  videoUrl: string;
  requiredViews: number;
  budget: number;
  description?: string;
}

export interface ICampaignResult {
  youtubers: Array<{
    youtuber: any;
    playsNeeded: number;
    expectedViews: number;
    cost: number;
  }>;
  totalCost: number;
  remainingViews: number;
  achievableViews: number;
}
