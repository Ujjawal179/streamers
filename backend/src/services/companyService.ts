import prisma from '../config/database';
import { VideoQueueService } from './VideoQueueService';
import { PaymentService } from './paymentService';
import { ICompanyServiceResult, IYoutuberCalculation } from '../interfaces/ICompany';
import { ICampaignInput, ICampaignResult } from '../interfaces/ICampaign';
import { ApiError } from '../utils/ApiError';
import { Youtuber, Company } from '@prisma/client';
import { IVideoUpload } from '../interfaces/IVideoUpload';

export class CompanyService {
  static async getYoutubers(requiredViews?: number): Promise<Youtuber[]> {
    const where = {
      isLive: true,
      charge: { gt: 0 }
    };

    // If requiredViews is provided, add additional filtering
    if (requiredViews) {
      Object.assign(where, {
        currentCCV: {
          gte: Math.ceil(requiredViews / 3) // Ensure YouTuber can deliver required views in max 3 plays
        }
      });
    }

    return prisma.youtuber.findMany({
      where,
      orderBy: {
        charge: 'asc'
      }
    });
  }

  static async getYoutubersForViews(requiredViews: number): Promise<ICompanyServiceResult> {
    const youtubers = await prisma.youtuber.findMany({
      where: {
        isLive: true,
        charge: { gt: 0 }
      },
      orderBy: { charge: 'asc' }
    });

    let remainingViews = requiredViews;
    const selectedYoutubers: IYoutuberCalculation[] = [];

    for (const youtuber of youtubers) {
      if (remainingViews <= 0) break;

      const viewsPerPlay = youtuber.currentCCV || 0;
      if (viewsPerPlay <= 0) continue;

      const playsNeeded = Math.ceil(Math.min(remainingViews, viewsPerPlay * 3) / viewsPerPlay);
      const expectedViews = viewsPerPlay * playsNeeded;
      const paymentAmount = playsNeeded * (youtuber.charge || 0);

      selectedYoutubers.push({
        youtuber,
        playsNeeded,
        expectedViews,
        paymentAmount,
        charge: youtuber.charge || 0
      });

      remainingViews -= expectedViews;
    }

    return {
      youtubers: selectedYoutubers,
      totalViewsAchieved: requiredViews - remainingViews,
      remainingViews
    };
  }

  static async uploadVideoToYoutubers(
    youtuberIds: string[], 
    videoData: { url: string }, 
    playsNeeded = 1
  ) {
    return Promise.all(
      youtuberIds.map(youtuberId => 
        VideoQueueService.addToYoutuberQueue(youtuberId, {
          ...videoData,
          playNumber: 1,
          totalPlays: 1
        })
      )
    );
  }

  static async getVideo(youtuberId: string, pin: string) {
    const youtuber = await prisma.youtuber.findUnique({
      where: { id: youtuberId }
    });

    if (!youtuber || youtuber.MagicNumber !== Number(pin)) {
      throw new ApiError(401, 'Invalid YouTuber or PIN');
    }

    return VideoQueueService.getNextVideo(youtuberId);
  }

  static async calculateCampaignYoutubers(requiredViews: number, budget: number): Promise<ICampaignResult> {
    const youtubers = await prisma.youtuber.findMany({
      where: {
        isLive: true,
        charge: { gt: 0 }
      },
      orderBy: { charge: 'asc' }
    });

    let remainingViews = requiredViews;
    let totalCost = 0;
    const selectedYoutubers = [];

    for (const youtuber of youtubers) {
      if (remainingViews <= 0 || totalCost >= budget) break;

      const viewsPerPlay = youtuber.currentCCV || 0;
      if (viewsPerPlay <= 0) continue;

      const maxPlaysForBudget = Math.floor((budget - totalCost) / youtuber.charge);
      const playsNeededForViews = Math.ceil(Math.min(remainingViews, viewsPerPlay * 3) / viewsPerPlay);
      const playsNeeded = Math.min(maxPlaysForBudget, playsNeededForViews);

      const cost = playsNeeded * youtuber.charge;
      const expectedViews = playsNeeded * viewsPerPlay;

      selectedYoutubers.push({
        youtuber,
        playsNeeded,
        expectedViews,
        cost
      });

      remainingViews -= expectedViews;
      totalCost += cost;
    }

    return {
      youtubers: selectedYoutubers,
      totalCost,
      remainingViews,
      achievableViews: requiredViews - remainingViews
    };
  }

  static async createCampaignAndUploadVideos(input: ICampaignInput) {
    const campaign = await this.calculateCampaignYoutubers(
      input.requiredViews,
      input.budget
    );

    if (campaign.youtubers.length === 0) {
      throw new ApiError(404, 'No suitable YouTubers found for the campaign');
    }

    // Create campaign record
    const campaignRecord = await prisma.campaign.create({
      data: {
        companyId: input.companyId,
        name: input.name,
        description: input.description,
        budget: input.budget,
        targetViews: input.requiredViews,
        status: 'ACTIVE',
        youtubers: {
          connect: campaign.youtubers.map(y => ({ id: y.youtuber.id }))
        }
      }
    });

    // Process each YouTuber
    const results = await Promise.all(
      campaign.youtubers.map(async ({ youtuber, playsNeeded, cost }) => {
        // Create payment record
        const payment = await PaymentService.createPayment({
          companyId: input.companyId,
          youtuberId: youtuber.id,
          amount: cost,
          playsNeeded,
        });

        // Add videos to YouTuber's queue
        for (let i = 0; i < playsNeeded; i++) {
          await VideoQueueService.addToYoutuberQueue(youtuber.id, {
            url: input.videoUrl,
            playNumber: i + 1,
            totalPlays: playsNeeded,
            campaignId: campaignRecord.id,
            paymentId: payment.id
          });
        }

        return { youtuberId: youtuber.id, payment, playsNeeded };
      })
    );

    return {
      campaign: campaignRecord,
      results,
      totalCost: campaign.totalCost,
      expectedViews: campaign.achievableViews
    };
  }

  static async getYoutuber(id: string) {
    return prisma.youtuber.findUnique({
      where: { id }
    });
  }

  static async updateCompany(id: string, data: Partial<Company>) {
    return prisma.company.update({
      where: { id },
      data
    });
  }

  static async deleteCompany(id: string) {
    const company = await prisma.company.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!company) throw new ApiError(404, 'Company not found');

    await prisma.$transaction([
      prisma.company.update({
        where: { id },
        data: { name: "", address: null, country: null, city: null, zip: null }
      }),
      prisma.user.update({
        where: { id: company.userId },
        data: {
          email: `deleted_${Date.now()}_${company.userId}@deleted.com`,
          password: 'DELETED_ACCOUNT'
        }
      })
    ]);
  }

  static async uploadVideoToYoutuberWithPlays(
    youtuberId: string, 
    videoData: IVideoUpload, 
    playsNeeded: number
  ) {
    const promises = Array(playsNeeded).fill(null).map((_, index) =>
      VideoQueueService.addToYoutuberQueue(youtuberId, {
        ...videoData,
        playNumber: index + 1,
        totalPlays: playsNeeded
      })
    );

    return Promise.all(promises);
  }

  static async uploadVideoToYoutuber(
    youtuberId: string, 
    videoData: IVideoUpload
  ) {
    return VideoQueueService.addToYoutuberQueue(youtuberId, {
      ...videoData,
      playNumber: 1,
      totalPlays: 1
    });
  }
}
