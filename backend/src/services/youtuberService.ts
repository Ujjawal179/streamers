import prisma from '../config/database';
import { Youtuber } from '@prisma/client';

export class YoutuberService {
  static async getYoutuberById(id: string) {
    return prisma.youtuber.findUnique({
      where: { id }
    });
  }

  static async updateYoutuber(id: string, data: Partial<Youtuber>) {
    return prisma.youtuber.update({
      where: { id },
      data
    });
  }

  static async updatePayoutDetails(id: string, ifsc: string, accountNumber: string) {
    return prisma.youtuber.update({
      where: { id },
      data: { ifsc, accountNumber }
    });
  }

  static async updateLiveStatus(id: string, isLive: boolean) {
    return prisma.youtuber.update({
      where: { id },
      data: { isLive }
    });
  }

  static async getYoutubersByCharge(maxCharge: number) {
    return prisma.youtuber.findMany({
      where: {
        charge: {
          lte: maxCharge
        }
      },
      orderBy: {
        charge: 'asc'
      }
    });
  }

  static async getLiveYoutubers() {
    return prisma.youtuber.findMany({
      where: {
        isLive: true
      }
    });
  }

  static async searchYoutubers(query: string) {
    return prisma.youtuber.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { channelLink: { contains: query, mode: 'insensitive' } }
        ]
      }
    });
  }
}
