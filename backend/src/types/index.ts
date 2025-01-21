export interface CPMRate {
  minCCV: number;
  cpmRate: number;
  maxIncomePerStream16: number;
  maxIncomePerStream8: number;
  maxIncomePerMonth: number;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  budget: number;
  targetViews: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Donation {
  id: string;
  amount: number;
  message?: string;
  videoUrl?: string;
  status: 'PENDING' | 'PLAYED' | 'FAILED';
  companyId: string;
  youtuberId: string;
  campaignId: string;
}

export interface StreamAnalytics {
  youtuberId: string;
  streamId: string;
  averageCCV: number;
  peakCCV: number;
  totalViews: number;
  adsPlayed: number;
  revenue: number;
  timestamp: Date;
}

export interface VideoData {
  url: string;
  public_id?: string;
  resource_type: string;
  uploaded_at: string;
  time?: number;
  requiredViews: number;
}
