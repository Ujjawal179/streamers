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
}
