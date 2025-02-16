import prisma from '../config/database';
import { VideoQueueService } from './VideoQueueService';
import { ScheduleService } from './scheduleService';
import { IVideoUpload } from '../interfaces/IVideoUpload';

export class P2PService {
  static async createDirectUpload(
    companyId: string, 
    youtuberId: string, 
    videoData: IVideoUpload,
    scheduledTime?: Date
  ) {
    // 1. Validate YouTuber availability
    const youtuber = await prisma.youtuber.findUnique({
      where: { id: youtuberId, isLive: true }
    });

    if (!youtuber) throw new Error('YouTuber not available');

    // 2. Validate schedule if provided
    if (scheduledTime) {
      const slot = await ScheduleService.validateScheduleSlot(youtuberId, scheduledTime);
      if (!slot.valid) throw new Error(`Invalid slot: ${slot.reason}`);
    }

    // 3. Create payment record
    const payment = await prisma.payment.create({
      data: {
        companyId,
        youtuberId,
        amount: youtuber.charge || 0,
        status: 'PENDING',
        paymentId: `pay_${Date.now()}`,
        orderId: `order_${Date.now()}`,
        playsNeeded: 1
      }
    });

    // 4. Add to queue
    await VideoQueueService.addToYoutuberQueue(
      youtuberId, 
      { ...videoData, paymentId: payment.id },
      scheduledTime?.getTime()
    );

    return { payment, videoData };
  }
}
