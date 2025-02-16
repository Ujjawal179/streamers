import { addToQueue, removeFromQueue, getNextFromQueue, getQueueLength, getRedisClient } from '../config/redis';
import { IVideoUpload } from '../interfaces/IVideoUpload';

export class VideoQueueService {
  static async addToYoutuberQueue(youtuberId: string, video: IVideoUpload, scheduledTime?: number) {
    const key = `youtuber:${youtuberId}:videos`;
    return addToQueue(key, {
      ...video,
      uploadedAt: new Date().toISOString(),
      playsNeeded: video.playsNeeded || 1 // Set default to 1 if not provided
    }, scheduledTime);
  }

  static async getNextVideo(youtuberId: string) {
    const key = `youtuber:${youtuberId}:videos`;
    return getNextFromQueue(key);
  }

  static async removeVideo(youtuberId: string) {
    const key = `youtuber:${youtuberId}:videos`;
    return removeFromQueue(key);
  }

  static async getQueueStatus(youtuberId: string) {
    const key = `youtuber:${youtuberId}:videos`;
    const queueLength = await this.getQueueLength(key);
    const nextVideo = await this.getNextVideo(youtuberId);
    
    return {
      queueLength,
      nextVideo,
      estimatedWaitTime: queueLength * 15 // 15 seconds per video
    };
  }

  static async clearQueue(youtuberId: string) {
    const key = `youtuber:${youtuberId}:videos`;
    const client = await getRedisClient();
    await client.del(key);
  }

  static async getQueueLength(youtuberId: string): Promise<number> {
    const key = `youtuber:${youtuberId}:videos`;
    return getQueueLength(key);
  }
}
