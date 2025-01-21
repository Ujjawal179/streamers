import prisma from '../config/database';
import { addToQueue, getQueueItems, getQueueLength } from '../config/redis';
import { emitQueueUpdate } from '../config/socket';
import { io } from '../index';

export class ScheduleService {
  static async createSchedule(youtuberId: string, data: {
    startTime: Date;
    endTime: Date;
    maxAdsPerHour: number;
  }) {
    return prisma.adSchedule.create({
      data: {
        youtuberId,
        ...data
      }
    });
  }

  static async notifyQueueUpdate(youtuberId: string) {
    const queueStatus = await this.getYoutuberQueue(youtuberId);
    if (io) {
      emitQueueUpdate(io, youtuberId, queueStatus);
    }
  }

  static async scheduleDonation(donationId: string, scheduledTime: Date) {
    const donation = await prisma.donation.update({
      where: { id: donationId },
      data: {
        scheduledFor: scheduledTime,
        status: 'SCHEDULED'
      }
    });

    await addToQueue(
      `youtuber:${donation.youtuberId}:donations`, 
      donation,
      scheduledTime.getTime()
    );

    await this.notifyQueueUpdate(donation.youtuberId);
    return donation;
  }

  static async getYoutuberQueue(youtuberId: string) {
    const key = `youtuber:${youtuberId}:donations`;
    const queueLength = await getQueueLength(key);
    const items = await getQueueItems(key, 0, 9); // Get first 10 items

    return {
      totalItems: queueLength,
      nextItems: items,
      estimatedDuration: queueLength * 15 // 15 seconds per ad
    };
  }

  static async getYoutuberSchedule(youtuberId: string) {
    return prisma.adSchedule.findMany({
      where: { youtuberId }
    });
  }

  static async validateScheduleSlot(youtuberId: string, proposedTime: Date) {
    const schedule = await prisma.adSchedule.findFirst({
      where: {
        youtuberId,
        startTime: { lte: proposedTime },
        endTime: { gte: proposedTime }
      }
    });

    if (!schedule) {
      return { valid: false, reason: 'No schedule found for this time' };
    }

    const hourStart = new Date(proposedTime);
    hourStart.setMinutes(0, 0, 0);
    
    const adsInHour = await prisma.donation.count({
      where: {
        youtuberId,
        scheduledFor: {
          gte: hourStart,
          lt: new Date(hourStart.getTime() + 3600000)
        }
      }
    });

    return {
      valid: adsInHour < schedule.maxAdsPerHour,
      reason: adsInHour >= schedule.maxAdsPerHour ? 'Hour slot full' : null,
      availableSlots: schedule.maxAdsPerHour - adsInHour
    };
  }

  static async getAvailableSlots(youtuberId: string, date: Date) {
    const schedule = await prisma.adSchedule.findFirst({
      where: {
        youtuberId,
        startTime: { lte: date },
        endTime: { gte: date }
      }
    });

    if (!schedule) {
      return {
        available: false,
        message: 'No schedule found for this date'
      };
    }

    // Get all scheduled donations for the given day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const scheduledDonations = await prisma.donation.findMany({
      where: {
        youtuberId,
        scheduledFor: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: {
        scheduledFor: 'asc'
      }
    });

    // Generate available slots
    const slots = [];
    const slotDuration = 15 * 60 * 1000; // 15 minutes in milliseconds
    let currentTime = Math.max(schedule.startTime.getTime(), startOfDay.getTime());
    const scheduleEnd = Math.min(schedule.endTime.getTime(), endOfDay.getTime());

    while (currentTime < scheduleEnd) {
      const slotTime = new Date(currentTime);
      const hourStart = new Date(slotTime);
      hourStart.setMinutes(0, 0, 0);

      // Count ads in this hour
      const adsInHour = scheduledDonations.filter(d => 
        d.scheduledFor! >= hourStart && 
        d.scheduledFor! < new Date(hourStart.getTime() + 3600000)
      ).length;

      if (adsInHour < schedule.maxAdsPerHour) {
        slots.push({
          time: slotTime,
          available: true
        });
      }

      currentTime += slotDuration;
    }

    return {
      available: slots.length > 0,
      schedule,
      slots
    };
  }

  static async updateSchedule(scheduleId: string, data: {
    startTime?: Date;
    endTime?: Date;
    maxAdsPerHour?: number;
  }) {
    return prisma.adSchedule.update({
      where: { id: scheduleId },
      data
    });
  }

  static async deleteSchedule(scheduleId: string) {
    return prisma.adSchedule.delete({
      where: { id: scheduleId }
    });
  }

  static async checkScheduleConflicts(youtuberId: string, startTime: Date, endTime: Date) {
    const existingSchedules = await prisma.adSchedule.findMany({
      where: {
        youtuberId,
        OR: [
          {
            startTime: { lte: startTime },
            endTime: { gte: startTime }
          },
          {
            startTime: { lte: endTime },
            endTime: { gte: endTime }
          }
        ]
      }
    });

    return existingSchedules.length > 0;
  }
}