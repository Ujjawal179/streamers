import { Request, Response } from 'express';
import prisma from '../db/db';
import { BankingDetails } from '../types/banking';
import { YoutuberService } from '../services/youtuberService';

export class YoutuberController {
  static async updateYoutuber(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'No id provided'
        });
      }

      // Convert numeric fields to numbers
      if (updateData.averageViews !== undefined) {
        updateData.averageViews = Number(updateData.averageViews);
        // Calculate and set charge based on average views
        updateData.charge = YoutuberService.calculateYouTubeAdCost(updateData.averageViews);
      }
      if (updateData.timeout !== undefined) {
        updateData.timeout = Number(updateData.timeout);
      }
      if (updateData.charge !== undefined) {
        updateData.charge = Number(updateData.charge);
      }

      // Perform the update with all provided data
      const youtuber = await prisma.youtuber.update({
        where: { id },
        data: updateData
      });

      return res.status(200).json({
        success: true,
        data: youtuber
      });
    } catch (error) {
      console.error('Update youtuber error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update youtuber'
      });
    }
  }
  
  static async getUsername(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const youtuber = await prisma.youtuber.findUnique({
        where: { id },
        select: { 
          name: true,
          channelLink: true, // Changed from channelName to channelLink
          charge: true,
          isLive: true,
          timeout: true
        }
      });
      
      if (!youtuber) {
        return res.status(404).json({
          success: false,
          error: 'Youtuber not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: {
          username: youtuber.name || youtuber.channelLink[0], // Use first channel link if name not set
          charge: youtuber.charge,
          isLive: youtuber.isLive,
          timeout: youtuber.timeout || 30
        }
      });
    } catch (error) {
      console.error('Get username error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch username'
      });
    }
  }

  static async getYoutuberDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const youtuber = await prisma.youtuber.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          channelLink: true,
          timeout: true,
          charge: true,
          isLive: true,
          alertBoxUrl: true,
          averageViews: true,
          avatar: true,
          description: true,
        }
      });

      if (!youtuber) {
        return res.status(404).json({
          success: false,
          error: 'Youtuber not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: youtuber
      });
    } catch (error) {
      console.error('Get youtuber details error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch youtuber details'
      });
    }
  }

  static async updateSettings(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { timeout, charge, name, channelLink, phoneNumber, alertBoxUrl } = req.body;
      
      const youtuber = await YoutuberService.updateSettings(id, {
        timeout: timeout ? Number(timeout) : undefined,
        charge: charge ? Number(charge) : undefined,
        name,
        channelLink,
        phoneNumber,
        alertBoxUrl
      });
      
      return res.status(200).json({
        success: true,
        data: youtuber
      });
    } catch (error) {
      console.error('Update settings error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update settings'
      });
    }
  }

  static async getYoutuberCampaigns(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const campaigns = await prisma.campaign.findMany({
        where: {
          youtubers: {
            some: { id }
          }
        }
      });

      return res.status(200).json({
        success: true,
        data: campaigns
      });
    } catch (error) {
      console.error('Get campaigns error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch campaigns'
      });
    }
  }

  static async updatePayoutDetails(req: Request, res: Response) {
    try {
      const { youtuberId } = req.params;
      const bankingDetails: BankingDetails = req.body;

      const youtuber = await YoutuberService.updatePayoutDetails(youtuberId, bankingDetails);
      
      return res.status(200).json({
        success: true,
        data: youtuber
      });
    } catch (error: any) {
      console.error('Update payout details error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to update payout details'
      });
    }
  }

  static async deleteYoutuber(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const youtuber = await prisma.youtuber.findUnique({
        where: { id },
        select: { userId: true }
      });

      if (!youtuber) {
        return res.status(404).json({
          success: false,
          error: 'Youtuber not found'
        });
      }

      // Only delete youtuber profile data, keep transactions
      await prisma.youtuber.update({
        where: { id },
        data: {
          name: null,
          email: null,
          channelLink: [],
          phoneNumber: null,
          bankName: null,
          accountNumber: null,
          ifscCode: null,
          panCard: null,
          upiId: null,
          avatar: null,
          description: null,
          address: null,
          vat: null,
          country: null,
          city: null,
          zip: null
        }
      });

      // Deactivate user account
      await prisma.user.update({
        where: { id: youtuber.userId },
        data: {
          email: `deleted_${Date.now()}_${youtuber.userId}@deleted.com`,
          password: 'DELETED_ACCOUNT'
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Youtuber data deleted successfully'
      });
    } catch (error) {
      console.error('Delete youtuber error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete youtuber data'
      });
    }
  }
}
