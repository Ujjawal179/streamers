import prisma from '../config/database';
import { Campaign } from '../types';
import { CPM_RATES } from '../config/constants';
import { CPMRate } from '../types';

export class CampaignService {
  static async createCampaign(data: {
    name: string;
    description?: string;
    budget: number;
    targetViews: number;
    companyId: string;
    youtubers: Array<{
      id: string;
      playsNeeded: number;
      expectedViews: number;
      cost: number;
    }>;
  }) {
    return prisma.$transaction(async (prisma) => {
      // Create the campaign first
      const campaign = await prisma.campaign.create({
        data: {
          name: data.name,
          description: data.description,
          budget: data.budget,
          targetViews: data.targetViews,
          companyId: data.companyId,
          youtubers: {
            connect: data.youtubers.map(y => ({ id: y.id }))
          }
        },
      });

      // Create payment records for each youtuber with their specific playsNeeded
      await Promise.all(data.youtubers.map(youtuber => 
        prisma.payment.create({
          data: {
            amount: youtuber.cost,
            companyId: data.companyId,
            youtuberId: youtuber.id,
            playsNeeded: youtuber.playsNeeded,
            status: 'PENDING',
            earnings: youtuber.cost * 0.7, // 70% for youtuber
            platformFee: youtuber.cost * 0.3, // 30% platform fee
            orderId: `order_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          }
        })
      ));

      return campaign;
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
