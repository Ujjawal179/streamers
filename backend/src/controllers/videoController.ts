import { Request, Response } from 'express';
import { CompanyService } from '../services/companyService';
import { VideoQueueService } from '../services/VideoQueueService';
import { ApiError } from '../utils/ApiError';
import { SelectedYoutuber } from '../interfaces/IYoutuber';

export class VideoController {
  static async uploadCampaignVideo(req: Request, res: Response) {
    try {
      const { selectedYoutubers, videoData } = req.body;
      const results = await Promise.all(
        selectedYoutubers.map((selected: SelectedYoutuber) =>
          VideoQueueService.addToYoutuberQueue(
            selected.youtuber.id,
            {
              ...videoData,
              playsNeeded: selected.playsNeeded,
              playNumber: 1,
              totalPlays: selected.playsNeeded
            }
          )
        )
      );
      
      res.json({ success: true, data: results });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to upload campaign video' 
      });
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
}
