export interface Campaign {
  id: string;
  name: string;
  description?: string;
  budget: number;
  targetViews: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  companyId: string;
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

export interface VideoData {
  url: string;
  public_id?: string;
  resource_type: string;
  uploaded_at: string;
  time?: number;
  requiredViews: number;
}
