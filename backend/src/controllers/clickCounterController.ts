// src/controllers/clickCounterController.ts
import { Request, Response } from 'express';
import { ClickCounterService } from '../services/clickCounterService';

export class ClickCounterController {
  static async updateClickCount(req: Request, res: Response) {
    const { messageId, clicks } = req.body;

    if (!messageId || clicks === undefined) {
      return res.status(400).json({
        success: false,
        error: 'messageId and clicks are required',
      });
    }

    try {
      await ClickCounterService.updateClickCount(messageId, clicks);
      return res.status(200).json({
        success: true,
        message: 'Click count updated successfully',
      });
    } catch (error) {
      console.error('Update click count error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update click count',
      });
    }
  }

  static async getClickCount(req: Request, res: Response) {
    const { messageId } = req.params;

    try {
      const clicks = await ClickCounterService.getClickCount(messageId);
      return res.status(200).json({
        success: true,
        data: { clicks },
      });
    } catch (error) {
      console.error('Get click count error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch click count',
      });
    }
  }

  static async handleRedirect(req: Request, res: Response) {
    const { redirectId } = req.params; // Change from messageId to redirectId

    try {
      const originalUrl = await ClickCounterService.incrementClickAndGetUrl(redirectId);
      if (!originalUrl) {
        return res.status(404).json({
          success: false,
          error: 'No URL found for this redirect ID',
        });
      }

      return res.redirect(originalUrl);
    } catch (error) {
      console.error('Redirect error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to process redirect',
      });
    }
  }
}