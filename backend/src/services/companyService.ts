import prisma from '../config/database';
import { Company } from '@prisma/client';
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.connect().catch(console.error);

export class CompanyService {
  static async getCompanyById(id: string) {
    return prisma.company.findUnique({
      where: { id },
      include: {
        campaigns: true,
        donations: true
      }
    });
  }

  static async updateCompany(id: string, data: Partial<Company>) {
    return prisma.company.update({
      where: { id },
      data
    });
  }

  static async getCompanyStats(id: string) {
    const campaigns = await prisma.campaign.findMany({
      where: { companyId: id }
    });

    const donations = await prisma.donation.findMany({
      where: { companyId: id }
    });

    return {
      totalCampaigns: campaigns.length,
      totalDonations: donations.length,
      totalSpent: donations.reduce((sum, d) => sum + d.amount, 0)
    };
  }

  static async uploadVideo(videoData: { url: string, public_id?: string, resource_type?: string, time?: string, requiredViews: number }) {
    const key = `brand:videos`;
    await redisClient.rPush(key, JSON.stringify(videoData));
    await redisClient.expire(key, 24 * 60 * 60);
    return videoData;
  }

  static async getYoutubers(requiredViews: number) {
    return prisma.youtuber.findMany({
      where: {
        charge: {
          lte: requiredViews,
        },
      },
      orderBy: {
        charge: 'asc',
      },
    });
  }
}
