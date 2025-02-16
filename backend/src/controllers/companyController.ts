import { Request, Response } from 'express';
import { CompanyService } from '../services/companyService';
import { VideoQueueService } from '../services/VideoQueueService';
import { PaymentService } from '../services/paymentService';
import { ApiError } from '../utils/ApiError';

export class CompanyController {
  // P2P direct video upload
  static async uploadVideoToYoutuber(req: Request, res: Response) {
    try {
      const { url } = req.body;
      const { youtuberId } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        throw new ApiError(401, 'Company authentication required');
      }

      // Verify YouTuber
      const youtuber = await CompanyService.getYoutuber(youtuberId);
      if (!youtuber?.isLive) {
        throw new ApiError(404, 'YouTuber is not available');
      }

      // Create payment
      const payment = await PaymentService.createPayment({
        companyId,
        youtuberId,
        amount: youtuber.charge || 0,
        playsNeeded: 1
      });

      // Add to queue
      await VideoQueueService.addToYoutuberQueue(youtuberId, { 
        url,
        paymentId: payment.id 
      });

      res.json({
        success: true,
        data: { payment }
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Failed to upload video' });
      }
    }
  }

  // Get list of available YouTubers
  static async getYoutubers(req: Request, res: Response) {
    try {
      const { requiredViews } = req.query;
      const youtubers = await CompanyService.getYoutubers(
        requiredViews ? Number(requiredViews) : undefined
      );
      res.json({ success: true, data: youtubers });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch YouTubers' });
    }
  }

  // Company profile management
  static async updateCompany(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        throw new ApiError(401, 'Company authentication required');
      }
      
      const company = await CompanyService.updateCompany(companyId, req.body);
      res.json({ success: true, data: company });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Failed to update company' });
      }
    }
  }

  static async deleteCompany(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        throw new ApiError(401, 'Company authentication required');
      }

      await CompanyService.deleteCompany(companyId);
      res.json({ success: true, message: 'Company deleted successfully' });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Failed to delete company' });
      }
    }
  }
}
