import { Request, Response } from 'express';
import { DonationService } from '../services/donationService';
import { VideoQueueService } from '../services/VideoQueueService';
import { ApiError } from '../utils/ApiError';

export class DonationController {
    // Direct P2P donation to single YouTuber
    static async createDonation(req: Request, res: Response) {
        try {
            const { amount, message, videoUrl, youtuberId, campaignId } = req.body;
            const companyId = req.user?.companyId;

            if (!companyId) {
                throw new ApiError(400, 'Company ID is required');
            }

            const donation = await DonationService.createDonation({
                amount,
                message,
                videoUrl,
                companyId,
                youtuberId,
                campaignId
            });

            // Add to YouTuber's queue
            await VideoQueueService.addToYoutuberQueue(youtuberId, {
                url: videoUrl,
                donationId: donation.id
            });

            res.json({ success: true, data: donation });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to create donation' });
        }
    }

    // Get next donation from queue (for YouTuber's OBS)
    static async getNextDonation(req: Request, res: Response) {
        try {
            const { youtuberId } = req.params;
            const donation = await DonationService.getNextDonation(youtuberId);
            res.json({ success: true, data: donation });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to fetch donation' });
        }
    }

    static async getDonationsByCampaign(req: Request, res: Response) {
        const { campaignId } = req.params;

        try {
            const donations = await DonationService.getDonationsByCampaign(campaignId);
            res.json(donations);
        } catch (error: any) {
            console.error('Error fetching campaign donations:', error);
            res.status(500).json({
                message: 'Failed to fetch campaign donations',
                error: error.message
            });
        }
    }

    static async updateDonationStatus(req: Request, res: Response) {
        const { id } = req.params;
        const { status } = req.body;

        try {
            if (!id || !status) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: id or status'
                });
            }

            const updatedDonation = await DonationService.updateDonationStatus(id, status);
            
            return res.status(200).json({
                success: true,
                data: updatedDonation
            });

        } catch (error: any) {
            console.error('Error updating donation status:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update donation status',
                error: error.message
            });
        }
    }

    static async getYoutuberDonations(req: Request, res: Response) {
        const { youtuberId } = req.params;

        try {
            if (!youtuberId) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing youtuberId parameter'
                });
            }

            const donations = await DonationService.getYoutuberDonations(youtuberId);
            
            return res.status(200).json({
                success: true,
                data: donations
            });

        } catch (error: any) {
            console.error('Error fetching youtuber donations:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch youtuber donations',
                error: error.message
            });
        }
    }
}
