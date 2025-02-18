import { addToQueue, removeFromQueue, getNextFromQueue, getQueueLength, getRedisClient } from '../config/redis';
import { IVideoUpload } from '../interfaces/IVideoUpload';

export class VideoQueueService {
  static async addToYoutuberQueue(youtuberId: string, video: IVideoUpload & {
    playNumber: number;
    totalPlays: number;
  }, scheduledTime?: number) {
    const key = `youtuber:${youtuberId}:videos`;
    return addToQueue(key, {
      ...video,
      uploadedAt: new Date().toISOString(),
      sequence: {
        current: video.playNumber,
        total: video.totalPlays
      }
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

  static async removeCurrentVideo(youtuberId: string) {
    const key = `youtuber:${youtuberId}:videos`;
    // Get the video first
    const video = await this.getNextVideo(youtuberId);
    if (!video) return null;

    // Remove it from queue
    await removeFromQueue(key);
    return video;
  }

  static async uploadVideoToYoutuberWithPlays(
    youtuberId: string, 
    videoData: IVideoUpload, 
    playsNeeded: number
  ) {
    const uploads = [];
    for (let i = 0; i < playsNeeded; i++) {
      uploads.push(
        this.addToYoutuberQueue(youtuberId, {
          ...videoData,
          playNumber: i + 1,
          totalPlays: playsNeeded,
          sequence: { current: i + 1, total: playsNeeded },
          uploadedAt: new Date().toISOString()
        })
      );
    }
    return Promise.all(uploads);
  }
}
