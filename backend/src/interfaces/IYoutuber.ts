import { Youtuber } from '@prisma/client';

export interface SelectedYoutuber {
  youtuber: Youtuber;
  playsNeeded: number;
  expectedViews: number;
  cost: number;
}
