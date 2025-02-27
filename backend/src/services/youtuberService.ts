import prisma from '../config/database';
import { Youtuber } from '@prisma/client';
import { YoutubeAdCostCalculator } from './youtubeAdCostCalculator'; // Import the new calculator
export class YoutuberService {
  static async getYoutuberById(id: string) {
    return prisma.youtuber.findUnique({
      where: { id }
    });
  }

  static async updateYoutuber(id: string, data: Partial<Youtuber>) {
    return prisma.youtuber.update({
      where: { id },
      data
    });
  }

  static async updatePayoutDetails(id: string, data: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    panCard?: string;
    upiId?: string;
  }) {
    return prisma.youtuber.update({
      where: { id },
      data: {
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        panCard: data.panCard,
        upiId: data.upiId,
        bankVerified: false // Reset verification when details are updated
      }
    });
  }

  static async updateLiveStatus(id: string, isLive: boolean) {
    return prisma.youtuber.update({
      where: { id },
      data: { isLive }
    });
  }

  static async getYoutubersByCharge(maxCharge: number) {
    return prisma.youtuber.findMany({
      where: {
        charge: {
          lte: maxCharge
        }
      },
      orderBy: {
        charge: 'asc'
      }
    });
  }

  static async getLiveYoutubers() {
    return prisma.youtuber.findMany({
      where: {
        isLive: true
      }
    });
  }

  static async searchYoutubers(query: string) {
    return prisma.youtuber.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { channelName: { contains: query, mode: 'insensitive' } }
          // { channelLink: { contains: query, mode: 'insensitive' } }

        ]
      }
    });
  }

  static async verifyBankingDetails(youtuberId: string): Promise<boolean> {
    const youtuber = await prisma.youtuber.findUnique({
      where: { id: youtuberId },
      select: {
        bankName: true,
        accountNumber: true,
        ifscCode: true,
        panCard: true
      }
    });

    return !!(youtuber?.bankName && youtuber?.accountNumber && 
              youtuber?.ifscCode && youtuber?.panCard);
  }

  static async updateSettings(id: string, data: {
    timeout?: number;
    charge?: number;
    name?: string;
    channelLink?: string[];
    phoneNumber?: string;
    alertBoxUrl?: string;
  }) {
    return prisma.youtuber.update({
      where: { id },
      data
    });
  }

  static calculateYouTubeAdCost(averageViews: number): number {
    return YoutubeAdCostCalculator.calculateSingleAdCost(averageViews);
  }
}
