import prisma from '../config/database';
import { Campaign } from '../types';
import { CPM_RATES } from '../config/constants';
import { CPMRate } from '../types';

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

  static async deleteCampaign(id: string) {
    return prisma.campaign.delete({
      where: { id }
    });
  }

  static async getAllCampaigns() {
    return prisma.campaign.findMany({
      include: {
        youtubers: true,
        donations: true,
        company: true
      }
    });
  }

  static calculateCPMRate(ccv: number): CPMRate {
    return CPM_RATES.find(rate => ccv <= rate.minCCV) || CPM_RATES[CPM_RATES.length - 1];
  }

  static async updateCampaignMetrics(campaignId: string, views: number, revenue: number) {
    return prisma.campaign.update({
      where: { id: campaignId },
      data: {
        currentViews: { increment: views },
        totalRevenue: { increment: revenue },
        updatedAt: new Date()
      }
    });
  }

  static async getCampaignAnalytics(id: string) {
    const campaign = await this.getCampaignById(id);
    if (!campaign) return null;

    // Fixed query to properly get analytics
    const analytics = await prisma.streamAnalytics.findMany({
      where: {
        youtuber: {
          campaigns: {
            some: { id }
          }
        },
        timestamp: {
          gte: campaign.createdAt
        }
      }
    });

    return {
      ...campaign,
      totalViews: analytics.reduce((sum, a) => sum + a.totalViews, 0),
      totalRevenue: analytics.reduce((sum, a) => sum + a.revenue, 0),
      averageCCV: analytics.reduce((sum, a) => sum + a.averageCCV, 0) / (analytics.length || 1),
      totalAdsPlayed: analytics.reduce((sum, a) => sum + a.adsPlayed, 0)
    };
  }
}
