import { Request, Response } from 'express';
import prisma from '../db/db';
import { BankingDetails } from '../types/banking';
import { YoutuberService } from '../services/youtuberService';
import { NightbotService } from '../services/nightbotService';

export class YoutuberController {
  private static youtuberService = new YoutuberService();
  private static nightbotService = new NightbotService();

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

      if (updateData.timeout !== undefined) {
        updateData.timeout = Number(updateData.timeout);
      }
      if (updateData.charge !== undefined) {
        updateData.charge = Number(updateData.charge);
      }

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
          channelLink: true,
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
          username: youtuber.name || youtuber.channelLink[0],
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

  static async updateViewerCount(req: Request, res: Response) {
    try {
      const { id } = req.params; // youtuberId
      const { message } = req.body;
  
      if (!id) {
        return res.status(400).json({ success: false, error: 'Youtuber ID is required' });
      }
  
      const youtuber = await prisma.youtuber.findUnique({
        where: { id },
        select: { channelLink: true },
      });
  
      if (!youtuber || !youtuber.channelLink?.length) {
        return res.status(404).json({ success: false, error: 'Youtuber or channel Link not found' });
      }
  
      const channelLink = youtuber.channelLink[0];
      console.log('channellink:', channelLink);
      const channelId = await YoutuberController.nightbotService.getChannelIdByUsername(channelLink);
      console.log('channelId:', channelId);
      if (!channelId) {
        return res.status(400).json({ success: false, error: 'Could not derive channel ID from channel link' });
      }
  
      const liveData = await YoutuberController.nightbotService.updateRealTimeViews(channelId);
  
      let viewers: number;
      if (!liveData) {
        const averageViews = await YoutuberController.nightbotService.calculateAverageViews(channelId);
        if (averageViews === null) {
          return res.status(500).json({ success: false, error: 'Failed to calculate average views' });
        }
        viewers = Math.round(averageViews);
        await YoutuberService.updateLiveStatus(id, false);
      } else {
        viewers = Number(liveData.viewers) || 0;
        await YoutuberService.updateLiveStatus(id, true);
      }
  
      const updatedYoutuber = await YoutuberService.updateYoutuber(id, {
        isLive: liveData ? true : false,
        averageViews: viewers,
        charge: YoutuberService.calculateYouTubeAdCost(viewers),
      });
  
      let messageId = null;
      if (message && liveData && liveData.liveChatId) {
        messageId = await YoutuberController.nightbotService.sendStreamMessage(
          liveData.liveChatId,
          message,
          channelId,
          id
        );
      }
  
      return res.status(200).json({
        success: true,
        data: {
          viewers: viewers.toString(),
          messageId,
          liveChatId: liveData ? liveData.liveChatId : null,
          youtuber: updatedYoutuber,
        },
      });
    } catch (error) {
      console.error('Update viewer count error:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
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