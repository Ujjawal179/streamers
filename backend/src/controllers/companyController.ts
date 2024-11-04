import { Request, Response } from 'express';
import { CompanyService } from '../services/companyService';

export class CompanyController {
  static async uploadVideo(req: Request, res: Response) {
    const { url, public_id, resource_type, time, requiredViews } = req.body;

    try {
      const videoData = {
        url,
        public_id: public_id || null,
        resource_type: resource_type || 'video',
        uploaded_at: new Date().toISOString(),
        time: time || null,
        requiredViews,
      };

      const result = await CompanyService.uploadVideo(videoData);
      res.json({ message: 'Video uploaded successfully', data: result });
    } catch (error) {
      res.status(500).json({ error: 'Failed to upload video' });
    }
  }

  static async getYoutubers(req: Request, res: Response) {
    const { requiredViews } = req.query;

    try {
      const youtubers = await CompanyService.getYoutubers(parseInt(requiredViews as string));
      res.json(youtubers);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch YouTubers' });
    }
  }
}
