import prisma from '../config/database';
import { Campaign } from '../types';
import { CPM_RATES } from '../config/constants';
import { CPMRate } from '../types';
import { ApiError } from '../utils/ApiError';
import Razorpay from 'razorpay';
import { VideoQueueService } from './VideoQueueService';
import  {SingleYoutuberCampaignInput } from '../interfaces/ICampaign';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});



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
      const payment = await Promise.all(data.youtubers.map(youtuber => 
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

      return { campaign, payment };
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

  static async createCampaignWithVideo(input: {
    name: string;
    description?: string;
    budget: number;
    targetViews: number;
    companyId: string;
    videoUrl: string;
    youtubers: Array<{
      id: string;
      playsNeeded: number;
      expectedViews: number;
      cost: number;
    }>;
  }) {
    return prisma.$transaction(async (prisma) => {
      // 1. Create campaign record
      const campaign = await prisma.campaign.create({
        data: {
          name: input.name,
          description: input.description,
          budget: input.budget,
          targetViews: input.targetViews,
          companyId: input.companyId,
          status: 'ACTIVE',
          youtubers: {
            connect: input.youtubers.map(y => ({ id: y.id }))
          }
        }
      });

      // 2. Create payment records and queue videos for each YouTuber
      const results = await Promise.all(
        input.youtubers.map(async (youtuber) => {
          // Create payment
          const payment = await prisma.payment.create({
            data: {
              amount: youtuber.cost,
              companyId: input.companyId,
              youtuberId: youtuber.id,
              campaignId: campaign.id,
              playsNeeded: youtuber.playsNeeded,
              status: 'PENDING',
              earnings: youtuber.cost * 0.7,
              platformFee: youtuber.cost * 0.3,
              orderId: `order_${Date.now()}_${youtuber.id}`
            }
          });

          // Queue video for each required play
          await VideoQueueService.uploadVideoToYoutuberWithPlays(
            youtuber.id,
            {
              url: input.videoUrl,
              campaignId: campaign.id,
              paymentId: payment.id
            },
            youtuber.playsNeeded
          );

          return { youtuberId: youtuber.id, payment, playsNeeded: youtuber.playsNeeded };
        })
      );

      return { campaign, results };
    });
  }

  static async createSingleYoutuberCampaign(input: SingleYoutuberCampaignInput) {
    if (!input.youtuberId) {
      throw new ApiError(400, 'YouTuber ID is required');
    }

    const youtuber = await prisma.youtuber.findUnique({
      where: { id: input.youtuberId },
      select: {
        id: true,
        name: true,
        currentCCV: true,
        charge: true
      }
    });

    if (!youtuber) {
      throw new ApiError(404, 'YouTuber not found');
    }

    const totalCost = youtuber.charge * input.playsNeeded;

    return prisma.$transaction(async (prisma) => {
      const campaign = await prisma.campaign.create({
        data: {
          name: input.name,
          description: input.description,
          budget: totalCost,
          targetViews: (youtuber.currentCCV || 0) * input.playsNeeded,
          companyId: input.companyId,
          status: 'ACTIVE',
          brandLink: input.brandLink,
          youtubers: {
            connect: [{ id: youtuber.id }]
          }
        }
      });

      const payment = await prisma.payment.create({
        data: {
          amount: totalCost,
          status: 'PENDING',
          campaignId: campaign.id,
          companyId: input.companyId,
          youtuberId: youtuber.id,
          orderId: `order_${Date.now()}`,
          earnings: totalCost * 0.7,
          platformFee: totalCost * 0.3,
          playsNeeded: input.playsNeeded
        }
      });

      await VideoQueueService.uploadVideoToYoutuberWithPlays(
        youtuber.id,
        {
          url: input.videoUrl,
          campaignId: campaign.id,
          paymentId: payment.id
        },
        input.playsNeeded
      );

      return { campaign, payment };
    });
  }
}
