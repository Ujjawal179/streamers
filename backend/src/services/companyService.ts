import { createClient } from 'redis';
import prisma from '../db/db';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.connect().catch(console.error);

export class CompanyService {
  static async uploadVideoToYoutubers(youtuberIds: string[], videoData: { url: string, public_id?: string, resource_type?: string, time?: string }) {
    const videoPromises = youtuberIds.map(async (youtuberId) => {
      const key = `youtuber:${youtuberId}:videos`;
      await redisClient.rPush(key, JSON.stringify(videoData));
      await redisClient.expire(key, 24 * 60 * 60);
    });
    await Promise.all(videoPromises);
    return videoData;
  }

  static async uploadVideoToYoutuber(youtuberId: string, videoData: { url: string, public_id?: string, resource_type?: string, time?: string }) {
    const key = `youtuber:${youtuberId}:videos`;
    await redisClient.rPush(key, JSON.stringify({
      ...videoData,
      uploadedAt: new Date().toISOString()
    }));
    await redisClient.expire(key, 24 * 60 * 60);
    return videoData;
  }

  static async getVideo(youtuberId: string) {
    const key = `youtuber:${youtuberId}:videos`;
    const video = await redisClient.lPop(key);
    return video ? JSON.parse(video) : null;
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
      await redisClient.rPush(key, JSON.stringify({
        ...videoData,
        playNumber: i + 1,
        totalPlays: playsNeeded,
        uploadedAt: new Date().toISOString()
      }));
    }
    
    await redisClient.expire(key, 24 * 60 * 60);
    return { ...videoData, playsNeeded };
  }

  static async createPaymentWithPlays(companyId: string, youtuberId: string, amount: number, playsNeeded: number) {
    return prisma.payment.create({
      data: {
        companyId,
        youtuberId,
        amount,
        status: 'pending',
        orderId: `order_${Date.now()}`,
        playsNeeded: playsNeeded  // Use the new field directly
      }
    });
  }

  static async createPayment(companyId: string, youtuberId: string, amount: number) {
    return prisma.payment.create({
      data: {
        companyId,
        youtuberId,
        amount,
        status: 'pending',
        orderId: `order_${Date.now()}`,
        playsNeeded: 1  // Default to 1 play
      }
    });
  }

  static async getNextVideo(youtuberId: string) {
    try {
      const key = `youtuber:${youtuberId}:videos`;
      
      // First, peek at the next video without removing it
      const nextVideo = await redisClient.lIndex(key, 0);
      
      if (!nextVideo) {
        return null;
      }

      // If there is a video, now pop it from the queue
      await redisClient.lPop(key);
      
      return JSON.parse(nextVideo);
    } catch (error) {
      console.error('Error getting next video:', error);
      throw error;
    }
  }

  static async getQueueLength(youtuberId: string) {
    const key = `youtuber:${youtuberId}:videos`;
    return await redisClient.lLen(key);
  }
}
