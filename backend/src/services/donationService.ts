import prisma from '../config/database';
import { addToQueue, getNextFromQueue, removeFromQueue } from '../config/redis';
import { Donation } from '../types';

export class DonationService {
  static async createDonation(data: Omit<Donation, 'id' | 'status'>) {
    const donation = await prisma.donation.create({
      data: {
        ...data,
        status: 'PENDING'
      }
    });

    // Add to Redis queue
    await addToQueue(`youtuber:${data.youtuberId}:donations`, donation);
    
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
}
