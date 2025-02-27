import { Request, Response } from 'express';
import { CompanyService } from '../services/companyService';
import { CampaignService } from '../services/campaignService';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';

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
      res.json({
        success: true,
        data: campaigns
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch campaigns' 
      });
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

  // Add these methods to the controller class
  static async getOptimalYoutubers(req: Request, res: Response) {
    try {
      const { targetViews } = req.body;
      
      if (!targetViews || targetViews <= 0) {
        return res.status(400).json({ success: false, error: 'Valid target views required' });
      }

      const estimate = await CampaignService.findOptimalYoutuberCombination(targetViews);
      res.json({ success: true, data: estimate });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Failed to estimate campaign' });
      }
    }
  }

  static async createOptimalCampaign(req: Request, res: Response) {
    try {
      const { name, description, targetViews, companyId, videoUrl } = req.body;
      
      // Validate required fields
      if (!name || !targetViews || !companyId || !videoUrl) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }
      
      if (targetViews <= 0) {
        return res.status(400).json({ success: false, error: 'Target views must be greater than 0' });
      }

      // Changed to call the correct method
      const result = await CampaignService.createCampaignByViews({
        name,
        description,
        targetViews,
        companyId,
        videoUrl,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ 
          success: false, 
          error: 'Failed to create campaign',
          details: (error as Error).message
        });
      }
    }
  }
}

// Create campaign by views
export const createCampaignByViews = async (req: Request, res: Response) => {
  try {
    const { name, description, targetViews, companyId, videoUrl, brandLink } = req.body;
    
    // Validate required fields
    if (!name || !targetViews || !companyId || !videoUrl) {
      throw new ApiError(400, 'Missing required fields');
    }
    
    if (targetViews <= 0) {
      throw new ApiError(400, 'Target views must be greater than 0');
    }

    const result = await CampaignService.createCampaignByViews({
      name,
      description,
      targetViews,
      companyId,
      videoUrl,
      brandLink
    });

    return res.json(
      new ApiResponse(
        201,
        result,
        'Campaign created successfully with optimal youtuber selection'
      )
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: (error as Error).message
    });
  }
};

// Optional: Function to get an estimate before creating the campaign
export const getYoutuberEstimate = async (req: Request, res: Response) => {
  try {
    const { targetViews } = req.body;
    
    if (!targetViews || targetViews <= 0) {
      throw new ApiError(400, 'Valid target views required');
    }

    const estimate = await CampaignService.findOptimalYoutuberCombination(targetViews);

    return res.json(
      new ApiResponse(
        200,
        estimate,
        'Estimated campaign cost and youtuber selection'
      )
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: (error as Error).message
    });
  }
};
