import prisma from '../config/database';
import { addToQueue, getNextFromQueue, removeFromQueue, getRedisClient } from '../config/redis';
import { Donation } from '../types';
import { CampaignService } from './campaignService';
import { ScheduleService } from './scheduleService';

export class DonationService {
  static async createDonation(data: Omit<Donation, 'id' | 'status'> & { scheduledFor?: Date }) {
    // 1. First validates schedule if provided
    if (data.scheduledFor) {
      const slotValidation = await ScheduleService.validateScheduleSlot(
        data.youtuberId,
        data.scheduledFor
      );
      
      if (!slotValidation.valid) {
        throw new Error(`Invalid schedule slot: ${slotValidation.reason}`);
      }
    }

    // 2. Creates donation record
    const donation = await prisma.donation.create({
      data: {
        ...data,
        status: data.scheduledFor ? 'SCHEDULED' : 'PENDING'
      }
    });

    // 3. Calculates revenue and updates analytics
    const youtuber = await prisma.youtuber.findUnique({
      where: { id: data.youtuberId }
    });

    if (youtuber?.currentCCV) {
      // Calculate CPM based revenue
      const cpmRate = CampaignService.calculateCPMRate(youtuber.currentCCV);
      const revenue = (cpmRate.cpmRate * youtuber.currentCCV) / 1000;

      // Create analytics record
      await prisma.streamAnalytics.create({
        data: {
          youtuberId: data.youtuberId,
          streamId: youtuber.currentStreamId || 'unknown',
          averageCCV: youtuber.currentCCV,
          peakCCV: youtuber.currentCCV,
          adsPlayed: 1,
          revenue,
          timestamp: new Date()
        }
      });

      // Update campaign metrics
      await CampaignService.updateCampaignMetrics(data.campaignId, youtuber.currentCCV, revenue);
    }

    // 4. Adds to YouTuber's queue
    if (data.scheduledFor) {
      await addToQueue(
        `youtuber:${data.youtuberId}:donations`,
        donation,
        data.scheduledFor.getTime()
      );
    } else {
      await addToQueue(`youtuber:${data.youtuberId}:donations`, donation);
    }
    
    return donation;
  }

  static async getNextDonation(youtuberId: string) {
    const key = `youtuber:${youtuberId}:donations`;
    const donation = await getNextFromQueue(key);
    
    if (!donation) return null;

    setTimeout(async () => {
      await removeFromQueue(key);
      await this.updateDonationStatus(donation.id, 'PLAYED');
    }, 15000);

    return donation;
  }

  static async updateDonationStatus(id: string, status: Donation['status']) {
    return prisma.donation.update({
      where: { id },
      data: { status }
    });
  }

  static async getDonationsByCampaign(campaignId: string) {
    return prisma.donation.findMany({
      where: { campaignId },
      include: {
        company: true,
        youtuber: true
      }
    });
  }

  static async getYoutuberDonations(youtuberId: string) {
    return prisma.donation.findMany({
      where: { youtuberId },
      include: {
        company: true,
        campaign: true
      }
    });
  }
}
