import { Request, Response } from 'express';
import { CompanyService } from '../services/companyService';
import { CampaignService } from '../services/campaignService';
import { ApiError } from '../utils/ApiError';

export class CampaignController {
  // Calculate campaign costs and YouTuber distribution
  static async calculateCampaign(req: Request, res: Response) {
    try {
      const { requiredViews, budget } = req.body;
      const result = await CompanyService.calculateCampaignYoutubers(
        Number(requiredViews),
        Number(budget)
      );
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Campaign calculation failed' });
    }
  }

  // Create new campaign with multiple YouTubers
  static async createCampaign(req: Request, res: Response) {
    try {
      const { videoUrl, requiredViews, budget, name } = req.body;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        throw new ApiError(400, 'Company ID is required');
      }

      const campaign = await CompanyService.createCampaignAndUploadVideos({
        companyId,
        videoUrl,
        requiredViews: Number(requiredViews),
        budget: Number(budget),
        name
      });

      res.json({ success: true, data: campaign });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to create campaign' });
    }
  }

  static async getCampaigns(req: Request, res: Response) {
    const companyId = (req as any).user?.id;

    try {
      const campaigns = await CampaignService.getCampaignsByCompany(companyId);
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  }

  static async updateCampaign(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;

    try {
      const updatedCampaign = await CampaignService.updateCampaignStatus(id, status);
      res.json(updatedCampaign);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update campaign' });
    }
  }

  static async deleteCampaign(req: Request, res: Response) {
    const { id } = req.params;

    try {
      await CampaignService.deleteCampaign(id);
      res.json({ message: 'Campaign deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete campaign' });
    }
  }

  static async getAllCampaigns(req: Request, res: Response) {
    try {
      const campaigns = await CampaignService.getAllCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  }

  static async getCampaign(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const campaign = await CampaignService.getCampaignById(id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch campaign' });
    }
  }

  // Get campaign analytics
  static async getCampaignAnalytics(req: Request, res: Response) {
    try {
      const { campaignId } = req.params;
      const analytics = await CampaignService.getCampaignAnalytics(campaignId);
      res.json({ success: true, data: analytics });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
    }
  }
}
