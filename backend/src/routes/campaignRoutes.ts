import { Router } from 'express';
import { CampaignController } from '../controllers/campaignController';

const router = Router();

router.post('/calculate', CampaignController.calculateCampaign);
router.post('/create', CampaignController.createCampaign);
router.get('/', CampaignController.getCampaigns);
router.get('/:id', CampaignController.getCampaign);
router.get('/:id/analytics', CampaignController.getCampaignAnalytics);
router.patch('/:id', CampaignController.updateCampaign);
router.delete('/:id', CampaignController.deleteCampaign);
router.post('/youtuber', CampaignController.createYoutuberCampaign);

export default router;
