import { Router } from 'express';
import { CampaignController } from '../controllers/campaignController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/create', authenticateToken, CampaignController.createCampaign);
router.get('/', authenticateToken, CampaignController.getCampaigns);

export default router;
