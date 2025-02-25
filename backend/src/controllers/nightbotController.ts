// src/controllers/nightbotController.ts
import { Request, Response } from 'express';
import { NightbotService } from '../services/nightbotService';
import prisma from '../db/db';

export class NightbotController {
  private nightbotService: NightbotService;

  constructor() {
    this.nightbotService = new NightbotService();
  }

  async updateViewerCount(req: Request, res: Response) {
    try {
      const channelId = req.params.id;
      const { message } = req.body;

      if (!channelId) {
        return res.status(400).json({ error: 'Channel ID is required' });
      }

      // Fetch youtuberId based on channelId (assumes channelLink contains channelId)
      const youtuber = await prisma.youtuber.findFirst({
        where: {
          channelLink: { has: channelId }, // Adjust if channelLink format differs
        },
        select: { id: true },
      });

      if (!youtuber) {
        return res.status(404).json({ error: 'No youtuber found for this channel ID' });
      }

      const youtuberId = youtuber.id;

      const liveData = await this.nightbotService.updateRealTimeViews(channelId);

      if (!liveData) {
        return res.status(404).json({ error: 'No active live stream found' });
      }

      let messageId = null;
      if (message && liveData.liveChatId) {
        // Pass all required parameters to sendStreamMessage
        messageId = await this.nightbotService.sendStreamMessage(
          liveData.liveChatId,
          message,
          channelId,
          youtuberId
        );
      }

      return res.status(200).json({
        viewers: liveData.viewers,
        messageId,
        liveChatId: liveData.liveChatId,
      });
    } catch (error) {
      console.error('Controller error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}