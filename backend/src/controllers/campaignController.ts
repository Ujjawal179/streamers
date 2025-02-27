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
      const { 
        name, 
        description, 
        budget, 
        targetViews,
        selectedYoutubers,
        companyId,
        videoUrl
      } = req.body;
      
      if (!videoUrl) {
        throw new ApiError(400, 'Video URL is required');
      }
      
      if (!companyId) {
        throw new ApiError(400, 'Company ID is required');
      }

      // Validate selected youtubers
      if (!selectedYoutubers || !Array.isArray(selectedYoutubers)) {
        throw new ApiError(400, 'Selected youtubers are required');
      }

      const result = await CampaignService.createCampaignWithVideo({
        name,
        description,
        budget: Number(budget),
        targetViews: Number(targetViews),
        companyId,
        videoUrl,
        youtubers: selectedYoutubers
      });

      res.json({ success: true, data: result });
    } catch (error) {
      console.log(error)
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ 
          success: false, 
          error: error.message 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          error: 'Failed to create campaign' 
        });
      }
    }
  }

  static async createSingleYoutuberCampaign(req: Request, res: Response) {
    try {
      const { 
        name, description, youtuberId, videoUrl,
        playsNeeded, companyId, brandLink 
      } = req.body;

      if (!videoUrl || !youtuberId) {
        throw new ApiError(400, 'Video URL and YouTuber ID are required');
      }

      const result = await CampaignService.createSingleYoutuberCampaign({
        name,
        youtuberId,
        description,
        companyId,
        playsNeeded: Number(playsNeeded),
        brandLink,
        videoUrl // Now this matches the interface
      });

      res.json({ success: true, data: result });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Failed to create campaign' });
      }
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
