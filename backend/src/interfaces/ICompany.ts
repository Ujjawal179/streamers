import { Youtuber } from '@prisma/client';

export interface IYoutuberCalculation {
  youtuber: Youtuber;
  playsNeeded: number;
  expectedViews: number;
  paymentAmount: number;
  charge: number;
  id?: string; // Add this field
}

export interface ICompanyServiceResult {
  youtubers: IYoutuberCalculation[];
  totalViewsAchieved: number;
  remainingViews: number;
}
