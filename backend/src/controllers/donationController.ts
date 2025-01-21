import { Request, Response } from 'express';
import { DonationService } from '../services/donationService';

export class DonationController {
    static async createDonation(req: Request, res: Response) {
        const { amount, message, videoUrl, youtuberId, campaignId, scheduledFor } = req.body;
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
                campaignId,
                scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined
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

    static async updateDonationStatus(req: Request, res: Response) {
        const { id } = req.params;
        const { status } = req.body;

        try {
            if (!id || !status) {
                return res.status(400).json({
                    message: 'Missing required fields: id or status'
                });
            }

            const updatedDonation = await DonationService.updateDonationStatus(id, status);
            res.json(updatedDonation);
        } catch (error: any) {
            console.error('Error updating donation status:', error);
            res.status(500).json({
                message: 'Failed to update donation status',
                error: error.message
            });
        }
    }

    static async getYoutuberDonations(req: Request, res: Response) {
        const { youtuberId } = req.params;

        try {
            const donations = await DonationService.getYoutuberDonations(youtuberId);
            res.json(donations);
        } catch (error: any) {
            console.error('Error fetching youtuber donations:', error);
            res.status(500).json({
                message: 'Failed to fetch youtuber donations',
                error: error.message
            });
        }
    }
}
