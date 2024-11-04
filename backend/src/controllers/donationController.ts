import { Request, Response } from 'express';
import { DonationService } from '../services/donationService';

export class DonationController {
    static async createDonation(req: Request, res: Response) {
        const { amount, message, videoUrl, youtuberId, campaignId } = req.body;
        const companyId = (req as any).user?.id;

        try {
            if (!amount || !youtuberId || !campaignId) {
                return res.status(400).json({
                    message: 'Missing required fields: amount, youtuberId, or campaignId'
                });
            }

            const donation = await DonationService.createDonation({
                amount,
                message,
                videoUrl,
                companyId,
                youtuberId,
                campaignId
            });

            res.json(donation);
        } catch (error: any) {
            console.error('Error creating donation:', error);
            res.status(500).json({
                message: 'Failed to create donation',
                error: error.message
            });
        }
    }

    static async getNextDonation(req: Request, res: Response) {
        const { youtuberId } = req.params;

        try {
            if (!youtuberId) {
                return res.status(400).json({
                    message: 'Missing youtuberId parameter'
                });
            }

            const donation = await DonationService.getNextDonation(youtuberId);

            if (!donation) {
                return res.status(404).json({
                    message: 'No pending donations'
                });
            }

            res.json(donation);
        } catch (error: any) {
            console.error('Error fetching next donation:', error);
            res.status(500).json({
                message: 'Failed to get next donation',
                error: error.message
            });
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
}
