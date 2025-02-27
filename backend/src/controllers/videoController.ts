import { Request, Response } from 'express';
import { CompanyService } from '../services/companyService';
import { VideoQueueService } from '../services/VideoQueueService';
import { ApiError } from '../utils/ApiError';
import { YoutuberController } from './youtuberController';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


export class VideoController {
  static async uploadCampaignVideo(req: Request, res: Response) {
    try {
      const {selectedYoutubers, videoData} = req.body;
      const result = await CompanyService.uploadVideoToYoutubers(selectedYoutubers, videoData);
      res.json({ success: true, data: result });
    } catch (error) {
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
      
      // Get the video from the queue
      const video = await CompanyService.getVideo(youtuberId, pin);
      
      // If there's a campaign ID in the video data, fetch the campaign message
      if (video && video.campaignId) {
        try {
          // Get campaign details
          const campaign = await prisma.campaign.findUnique({
            where: { id: video.campaignId },
            select: {  description: true}
          });
          
          if (campaign) {
            // Construct a promotional message using campaign data
            const message = 
              campaign.description || 'Thank you for watching!';
            
            // Call updateViewerCount with the promotional message
            const viewerCountReq = {
              params: { id: youtuberId },
              body: { message }
            } as unknown as Request;
            
            const viewerCountRes = {
              statusCode: 200,
              status: function(code: number) {
                this.statusCode = code;
                return this;
              },
              json: function(data: any) {
                return this;
              }
            } as Response;
            
            // Process updating viewer count asynchronously, don't wait for it
            YoutuberController.updateViewerCount(viewerCountReq, viewerCountRes)
              .catch(err => console.error('Failed to update viewer count:', err));
            
            // Add the message to the video response
            video.message = message;
          }
        } catch (error) {
          console.error('Error processing campaign message:', error);
          // Continue with the video delivery even if campaign processing fails
        }
      }
      
      res.json({ success: true, data: video });
    } catch (error) {
      console.error('Failed to get video by pin:', error);
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
