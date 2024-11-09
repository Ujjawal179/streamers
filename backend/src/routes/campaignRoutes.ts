import { Router } from 'express';
import { auth } from '../middleware/auth';
const router = Router();

import { CampaignController } from '../controllers/campaignController';

router.get('/', auth, CampaignController.getAllCampaigns);
router.get('/:id', auth, CampaignController.getCampaign);
router.put('/:id', auth, CampaignController.updateCampaign);
router.delete('/:id', auth, CampaignController.deleteCampaign);
router.post('/', auth, CampaignController.createCampaign);
router.get('/company/:companyId', auth, CampaignController.getCampaigns);

export default router;
