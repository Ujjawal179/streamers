import { Request, Response } from 'express';
import prisma from '../db/db';
import { BankingDetails } from '../types/banking';

export class YoutuberController {
  static async updateYoutuber(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const youtuber = await prisma.youtuber.update({
        where: { id },
        data: req.body
      });
      res.json(youtuber);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update youtuber' });
    }
  }

  static async getUsername(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const youtuber = await prisma.youtuber.findUnique({
        where: { id },
        select: { 
          name: true,
          channelName: true, // Fallback if name isn't set
          charge: true,
          isLive: true,
          timeout: true
        }
      });
      
      if (!youtuber) return res.status(404).json({ error: 'Youtuber not found' });
      
      res.json({ 
        username: youtuber.name || youtuber.channelName,
        charge: youtuber.charge,
        isLive: youtuber.isLive,
        timeout: youtuber.timeout || 30 // Default timeout
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch username' });
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
          email: true,
          channelLink: true,
          phoneNumber: true,
          timeout: true,
          charge: true,
          isLive: true,
          alertBoxUrl: true
        }
      });
      if (!youtuber) return res.status(404).json({ error: 'Youtuber not found' });
      res.json(youtuber);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch youtuber details' });
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
      
      res.json(youtuber);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update settings' });
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
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  }

  static async updatePayoutDetails(req: Request, res: Response) {
    const { youtuberId } = req.params;
    const bankingDetails: BankingDetails = req.body;

    try {
      const youtuber = await YoutuberService.updatePayoutDetails(youtuberId, bankingDetails);
      res.json(youtuber);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
