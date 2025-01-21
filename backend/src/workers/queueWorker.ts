import { CronJob } from 'cron';
import { ScheduleService } from '../services/scheduleService';
import { DonationService } from '../services/donationService';
import { getRedisClient } from '../config/redis';

// Checks every minute for pending donations
export const startQueueWorker = () => {
  new CronJob('* * * * *', async () => {
    try {
      const redis = getRedisClient(); // This will throw if Redis isn't initialized
      const keys = await redis.keys('youtuber:*:donations');
      
      for (const key of keys) {
        const [, youtuberId] = key.split(':');
        const nextDonation = await DonationService.getNextDonation(youtuberId);
        
        if (nextDonation) {
          await ScheduleService.notifyQueueUpdate(youtuberId);
        }
      }
    } catch (error) {
      console.error('Queue worker error:', error);
    }
    // Processes queued donations
    // Notifies YouTubers of updates
  }).start();
  console.log('Queue worker started');
};
