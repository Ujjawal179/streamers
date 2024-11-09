import { Router } from 'express';
import { auth } from '../middleware/auth';
const router = Router();

import { CompanyController } from '../controllers/companyController';

router.post('/campaigns', auth, CompanyController.createCampaign);
router.get('/:id/campaigns', auth, CompanyController.getCompanyCampaigns);
router.put('/campaigns/:id', auth, CompanyController.updateCampaign);
router.post('/videos', auth, CompanyController.uploadVideo);
router.get('/youtubers', auth, CompanyController.getYoutubers);

export default router;
