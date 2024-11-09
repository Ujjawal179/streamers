import { Request, Response } from 'express';
import { CampaignService } from '../services/campaignService';

export class CampaignController {
    static async createCampaign(req: Request, res: Response) {
        const { name, description, budget, targetViews, youtuberIds } = req.body;
        const companyId = (req as any).user?.id;

        try {
            const campaign = await CampaignService.createCampaign({
                name,
                description,
                budget,
                targetViews,
                companyId,
                youtuberIds,
                status: 'ACTIVE'
            });

            res.json(campaign);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create campaign' });
        }
    }

    static async getCampaigns(req: Request, res: Response) {
        const companyId = (req as any).user?.id;

        try {
            const campaigns = await CampaignService.getCampaignsByCompany(companyId);
            res.json(campaigns);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch campaigns' });
        }
    }

    static async updateCampaign(req: Request, res: Response) {
        const { id } = req.params;
        const { status } = req.body;

        try {
            const updatedCampaign = await CampaignService.updateCampaignStatus(id, status);
            res.json(updatedCampaign);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update campaign' });
        }
    }

    static async deleteCampaign(req: Request, res: Response) {
        const { id } = req.params;

        try {
            await CampaignService.deleteCampaign(id);
            res.json({ message: 'Campaign deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete campaign' });
        }
    }

    static async getAllCampaigns(req: Request, res: Response) {
        try {
            const campaigns = await CampaignService.getAllCampaigns();
            res.json(campaigns);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch campaigns' });
        }
    }

    static async getCampaign(req: Request, res: Response) {
        const { id } = req.params;

        try {
            const campaign = await CampaignService.getCampaignById(id);
            if (!campaign) {
                return res.status(404).json({ error: 'Campaign not found' });
            }
            res.json(campaign);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch campaign' });
        }
    }
}
