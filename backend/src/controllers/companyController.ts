import { Request, Response } from 'express';
import { CompanyService } from '../services/companyService';
import prisma from '../config/database';
import { YoutuberService } from '../services/youtuberService';

export class CompanyController {
  static async uploadVideoCampaign(req: Request, res: Response) {
    const { url, requiredViews, budget } = req.body;
    const { companyId } = req.params;

    try {
      // Get YouTubers with play count calculation
      const { youtubers, totalViewsAchieved, remainingViews } = 
        await CompanyService.getYoutubersForViews(requiredViews);
      
      if (youtubers.length === 0) {
        return res.status(400).json({ 
          error: 'No suitable YouTubers found for the required views' 
        });
      }

      // Calculate total cost
      const totalCost = youtubers.reduce((sum, y) => sum + y.paymentAmount, 0);
      
      if (totalCost > budget) {
        return res.status(400).json({ 
          error: 'Budget is insufficient for required views',
          required: totalCost,
          provided: budget
        });
      }

      // Create payments and upload videos for each YouTuber
      const results = await Promise.all(
        youtubers.map(async youtuber => {
          // Create payment with plays count
          const payment = await CompanyService.createPaymentWithPlays(
            companyId,
            youtuber.id,
            youtuber.paymentAmount,
            youtuber.playsNeeded
          );

          // Upload video multiple times based on plays needed
          const videoUploads = await CompanyService.uploadVideoToYoutuberWithPlays(
            youtuber.id,
            { url },
            youtuber.playsNeeded
          );

          return {
            youtuber: youtuber.id,
            payment,
            plays: youtuber.playsNeeded,
            expectedViews: youtuber.totalViews
          };
        })
      );

      res.json({ 
        message: 'Campaign created successfully', 
        totalViewsAchieved,
        remainingViews,
        totalCost,
        results
      });
    } catch (error) {
      console.error('Campaign creation error:', error);
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  }

  static async uploadVideoDirectToYoutuber(req: Request, res: Response) {
    const { url } = req.body;
    const { youtuberId } = req.params;

    try {
      const youtuber = await prisma.youtuber.findUnique({
        where: { id: youtuberId }
      });

      if (!youtuber || !youtuber.isLive) {
        return res.status(400).json({ 
          error: 'YouTuber is not available' 
        });
      }

      // Create payment
      const payment = await CompanyService.createPayment(
        req.body.companyId,
        youtuberId,
        youtuber.charge || 0
      );

      // Upload video to YouTuber's queue
      await CompanyService.uploadVideoToYoutuber(youtuberId, { url });

      res.json({ 
        message: 'Video uploaded successfully',
        payment 
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to upload video' });
    }
  }

  static async uploadVideo(req: Request, res: Response) {
    const { url, public_id, resource_type, time, requiredViews } = req.body;
    const { companyId } = req.params;

    try {
      // Fetch YouTubers based on required views
      const youtubers = await CompanyService.getYoutubers(requiredViews);
      const youtuberIds = youtubers.map(youtuber => youtuber.id);

      // Create a campaign
      const campaign = await prisma.campaign.create({
        data: {
          companyId,
          name: req.body.name,
          description: req.body.description,
          budget: req.body.budget,
          targetViews: requiredViews,
        },
      });

      // Upload video to YouTubers' Redis queues
      const videoData = {
        url,
        public_id: public_id || null,
        resource_type: resource_type || 'video',
        uploaded_at: new Date().toISOString(),
        time: time || null,
      };

      await CompanyService.uploadVideoToYoutubers(youtuberIds, videoData);

      res.json({ message: 'Video uploaded successfully', data: videoData, campaign });
    } catch (error) {
      res.status(500).json({ error: 'Failed to upload video' });
    }
  }

  static async uploadVideoToYoutuber(req: Request, res: Response) {
    const { url, public_id, resource_type, time } = req.body;
    const { youtuberId } = req.params;

    try {
      const videoData = {
        url,
        public_id: public_id || null,
        resource_type: resource_type || 'video',
        uploaded_at: new Date().toISOString(),
        time: time || null,
      };

      const result = await CompanyService.uploadVideoToYoutuber(youtuberId, videoData);
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

  static async createCampaign(req: Request, res: Response) {
    const { videoUrl, requiredViews, budget, name } = req.body;
    const { companyId } = req.params;

    try {
      const result = await CompanyService.createCampaignAndUploadVideos(
        companyId,
        videoUrl,
        Number(requiredViews),
        Number(budget),
        name
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create campaign'
      });
    }
  }

  static async getCompanyCampaigns(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const campaigns = await prisma.campaign.findMany({
        where: { companyId: id },
      });
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch campaigns' });
    }
  }

  static async updateCampaign(req: Request, res: Response) {
    const { id } = req.params;
    const { name, description, goal } = req.body;

    try {
      const campaign = await prisma.campaign.update({
        where: { id },
        data: {
          name,
          description,
        },
      });
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update campaign' });
    }
  }

  static async getVideo(req: Request, res: Response) {
    const { youtuberId,pin } = req.params;

    try {
      const video = await CompanyService.getVideo(youtuberId,pin);
      if (video) {
        res.json(video);
      } else {
        res.status(404).json({ message: 'No video found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve video' });
    }
  }

  static async getNextVideoInQueue(req: Request, res: Response) {
    const { youtuberId } = req.params;

    try {
      const video = await CompanyService.getNextVideo(youtuberId);
      if (video) {
        res.json({
          success: true,
          data: video
        });
      } else {
        res.json({
          success: true,
          data: null,
          message: 'No videos in queue'
        });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch next video from queue' 
      });
    }
  }
  static async updateCompany(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'No id provided'
        });
      }
      const company = await prisma.company.update({
        where: { id },
        data: req.body
      });
      return res.status(200).json({
        success: true,
        data: company
      });
    } catch (error) {
      console.error('Update company error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update company'
      });
    }
  }

  static async deleteCompany(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const company = await prisma.company.findUnique({
        where: { id },
        select: { userId: true }
      });

      if (!company) {
        return res.status(404).json({
          success: false,
          error: 'Company not found'
        });
      }

      // Only delete company profile data, keep transactions
      await prisma.company.update({
        where: { id },
        data: {
          name: "",
          address: null,
          country: null,
          city: null,
          zip: null
        }
      });

      // Deactivate user account
      await prisma.user.update({
        where: { id: company.userId },
        data: {
          email: `deleted_${Date.now()}_${company.userId}@deleted.com`,
          password: 'DELETED_ACCOUNT'
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Company data deleted successfully'
      });
    } catch (error) {
      console.error('Delete company error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete company data'
      });
    }
  }

  static async calculateCampaign(req: Request, res: Response) {
    const { requiredViews, budget } = req.body;

    try {
      const campaign = await CompanyService.calculateCampaignYoutubers(
        Number(requiredViews),
        Number(budget)
      );

      res.json({
        success: true,
        data: campaign
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to calculate campaign'
      });
    }
  }
}
