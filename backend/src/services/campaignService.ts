import prisma from '../config/database';
import { Campaign } from '../types';

export class CampaignService {
  static async createCampaign(data: Omit<Campaign, 'id'> & { youtuberIds?: string[] }) {
    return prisma.campaign.create({
      data: {
        ...data,
        youtubers: {
          connect: data.youtuberIds?.map(id => ({ id }))
        }
      }
    });
  }

  static async getCampaignById(id: string) {
    return prisma.campaign.findUnique({
      where: { id },
      include: {
        youtubers: true,
        donations: true,
        company: true
      }
    });
  }

  static async getCampaignsByCompany(companyId: string) {
    return prisma.campaign.findMany({
      where: { companyId },
      include: {
        youtubers: true,
        donations: true
      }
    });
  }

  static async updateCampaignStatus(id: string, status: Campaign['status']) {
    return prisma.campaign.update({
      where: { id },
      data: { status }
    });
  }

  static async addYoutubersToCampaign(id: string, youtuberIds: string[]) {
    return prisma.campaign.update({
      where: { id },
      data: {
        youtubers: {
          connect: youtuberIds.map(id => ({ id }))
        }
      }
    });
  }

  static async getCampaignStats(id: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        donations: true,
        youtubers: true
      }
    });

    if (!campaign) return null;

    return {
      totalDonations: campaign.donations.length,
      totalSpent: campaign.donations.reduce((sum, d) => sum + d.amount, 0),
      youtuberCount: campaign.youtubers.length,
      remainingBudget: campaign.budget - campaign.donations.reduce((sum, d) => sum + d.amount, 0)
    };
  }
}
