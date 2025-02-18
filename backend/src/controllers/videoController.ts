import { Request, Response } from 'express';
import { CompanyService } from '../services/companyService';
import { VideoQueueService } from '../services/VideoQueueService';
import { ApiError } from '../utils/ApiError';

export class VideoController {
  static async uploadCampaignVideo(req: Request, res: Response) {
    try {
      const { youtuberIds, videoData, playsNeeded} = req.body;
      const result = await CompanyService.uploadVideoToYoutubers(youtuberIds, videoData, playsNeeded);
      res.json({ success: true, data: result });
    } catch (error) {
      console.log(error)
      res.status(500).json({ success: false, error: 'Failed to upload campaign video' });
    }
  }

  static async uploadDirectVideo(req: Request, res: Response) {
    try {
      const { youtuberId } = req.params;
      const result = await CompanyService.uploadVideoToYoutuber(youtuberId, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to upload video' });
    }
  }

  static async getNextVideo(req: Request, res: Response) {
    try {
      const { youtuberId } = req.params;
      const video = await VideoQueueService.getNextVideo(youtuberId);
      res.json({ success: true, data: video });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to get next video' });
    }
  }

  static async getVideoByPin(req: Request, res: Response) {
    try {
      const { youtuberId, pin } = req.params;
      const video = await CompanyService.getVideo(youtuberId, pin);
      res.json({ success: true, data: video });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to get video' });
    }
  }

  static async getQueueLength(req: Request, res: Response) {
    try {
      const { youtuberId } = req.params;
      const length = await VideoQueueService.getQueueLength(youtuberId);
      console.log(youtuberId, length)
      res.json({ success: true, data: length });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to get queue length' });
    }
  }

  static async removeCurrentVideo(req: Request, res: Response) {
    try {
      const { youtuberId } = req.params;
      const removedVideo = await VideoQueueService.removeCurrentVideo(youtuberId);
      
      if (!removedVideo) {
        return res.status(404).json({ 
          success: false, 
          message: 'No video found in queue' 
        });
      }

      res.json({ 
        success: true, 
        message: 'Video removed successfully',
        data: removedVideo
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to remove video from queue' 
      });
    }
  }
}
