import prisma from '../config/database';
import { YoutuberService } from './youtuberService';
import { ScheduleService } from './scheduleService';
import { addToQueue, getNextFromQueue, removeFromQueue, getQueueLength } from '../config/redis';
import { Prisma } from '@prisma/client';

export class CompanyService {

  static async uploadVideoToYoutubers(youtuberIds: string[], videoData: { url: string, public_id?: string, resource_type?: string, time?: string }, scheduledTime?: Date) {
    const videoPromises = youtuberIds.map(async (youtuberId) => {
      const key = `youtuber:${youtuberId}:videos`;
      
      if (scheduledTime) {
        const validSlot = await ScheduleService.validateScheduleSlot(youtuberId, scheduledTime);
        if (!validSlot.valid) {
          throw new Error(`Invalid slot for youtuber ${youtuberId}: ${validSlot.reason}`);
        }
      }

      await addToQueue(key, videoData, scheduledTime?.getTime());
    });

    await Promise.all(videoPromises);
    return videoData;
  }

  static async uploadVideoToYoutuber(youtuberId: string, videoData: { url: string, public_id?: string, resource_type?: string, time?: string }) {
    const key = `youtuber:${youtuberId}:videos`;
    await addToQueue(key, {
      ...videoData,
      uploadedAt: new Date().toISOString()
    });
    return videoData;
  }

  static async getVideo(youtuberId: string, pin: string) {
    const key = `youtuber:${youtuberId}:videos`;
    const youtuber = await YoutuberService.getYoutuberById(youtuberId);
    if (!youtuber) {
      throw new Error('Youtuber not found');
    }
    if (youtuber.MagicNumber !== Number(pin)) {
      throw new Error('Url is not correct');
    }
    const video = await removeFromQueue(key);
    return video ? JSON.parse(video) : null;
  }

  static async getYoutubers(requiredViews: number) {
    return prisma.youtuber.findMany({
      where: {
        AND: [
          { isLive: true },
          { charge: { gt: 0 } }
        ]
      },
      orderBy: {
        charge: 'asc',
      },
    });
  }

  static async getYoutubersForViews(requiredViews: number) {
    const youtubers = await prisma.youtuber.findMany({
      where: {
        isLive: true,
        charge: { gt: 0 }  // Only get active YouTubers with set charges
      },
      orderBy: { charge: 'asc' },
    });

    let remainingViews = requiredViews;
    const selectedYoutubers = [];

    // Calculate plays needed for each YouTuber
    for (const youtuber of youtubers) {
      if (remainingViews <= 0) break;

      const liveViews = youtuber.charge || 0;
      if (liveViews <= 0) continue;

      // Calculate how many times video needs to be played
      const playsNeeded = Math.ceil(Math.min(remainingViews, liveViews * 3) / liveViews);
      const totalViews = liveViews * playsNeeded;
      
      selectedYoutubers.push({
        ...youtuber,
        playsNeeded,
        totalViews,
        paymentAmount: totalViews * (youtuber.charge || 0)
      });

      remainingViews -= totalViews;
    }

    return {
      youtubers: selectedYoutubers,
      totalViewsAchieved: requiredViews - remainingViews,
      remainingViews
    };
  }

  static async uploadVideoToYoutuberWithPlays(youtuberId: string, videoData: any, playsNeeded: number) {
    const key = `youtuber:${youtuberId}:videos`;
    
    // Push the video multiple times based on playsNeeded
    for (let i = 0; i < playsNeeded; i++) {
      await addToQueue(key, {
        ...videoData,
        playNumber: i + 1,
        totalPlays: playsNeeded,
        uploadedAt: new Date().toISOString()
      });
    }
    return { ...videoData, playsNeeded };
  }

  static async createPaymentWithPlays(companyId: string, youtuberId: string, amount: number, playsNeeded: number) {
    return prisma.payment.create({
      data: {
        paymentId: `payment_${Date.now()}`,
        companyId,
        youtuberId,
        amount,
        status: 'PENDING',
        orderId: `order_${Date.now()}`,
        playsNeeded: playsNeeded,  // Use the new field directly
        earnings: 0,
        platformFee: 0
      }
    });
  }

  static async createPayment(companyId: string, youtuberId: string, amount: number) {
    return prisma.payment.create({
      data: {
        paymentId: `payment_${Date.now()}`,
        companyId,
        youtuberId,
        amount,
        status: 'PENDING',
        orderId: `order_${Date.now()}`,
        playsNeeded: 1,  // Default to 1 play
        earnings: 0,
        platformFee: 0
      }
    });
  }

  static async getNextVideo(youtuberId: string) {
    try {
      const key = `youtuber:${youtuberId}:videos`;
      
      // First, peek at the next video without removing it
      const nextVideo = await getNextFromQueue(key);
      
      if (!nextVideo) {
        return null;
      }

      // If there is a video, now pop it from the queue
      await removeFromQueue(key);
      
      return nextVideo;
    } catch (error) {
      console.error('Error getting next video:', error);
      throw error;
    }
  }

  static async getQueueLength(youtuberId: string) {
    const key = `youtuber:${youtuberId}:videos`;
    return await getQueueLength(key);
  }

  // Fix analytics creation
  static async createStreamAnalytics(data: {
    youtuberId: string;
    streamId: string;
    averageCCV: number;
    peakCCV: number;
    adsPlayed: number;
    revenue: number;
  }) {
    return prisma.streamAnalytics.create({
      data: {
        ...data,
        totalViews: data.averageCCV, // Set initial total views
        timestamp: new Date()
      }
    });
  }

  // Fix campaign analytics query
  static async getCampaignAnalytics(campaignId: string) {
    const analytics = await prisma.streamAnalytics.findMany({
      where: {
        youtuber: {
          donations: {
            some: { campaignId }
          }
        }
      }
    });

    // ...rest of the code
  }
}
