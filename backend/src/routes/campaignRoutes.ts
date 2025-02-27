import { Router } from 'express';
import { CampaignController, createCampaignByViews, getYoutuberEstimate } from '../controllers/campaignController';

const router = Router();

router.post('/calculate', CampaignController.calculateCampaign);
router.post('/create', CampaignController.createCampaign);
router.get('/', CampaignController.getCampaigns);
router.get('/:id', CampaignController.getCampaign);
router.get('/:id/analytics', CampaignController.getCampaignAnalytics);
router.patch('/:id', CampaignController.updateCampaign);
router.delete('/:id', CampaignController.deleteCampaign);
router.post('/single-youtuber', CampaignController.createSingleYoutuberCampaign);  // Updated route name


router.post('/optimal-estimate', CampaignController.getOptimalYoutubers);
router.post('/create-optimal', CampaignController.createOptimalCampaign);

export default router;
