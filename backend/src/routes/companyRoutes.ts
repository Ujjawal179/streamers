import { Router } from 'express';
import { CompanyController } from '../controllers/companyController';
import { authenticateCompany } from '../middleware/auth';

const router = Router();

// Campaign routes
router.post('/campaign/calculate', authenticateCompany, CompanyController.calculateCampaign);
router.post('/campaign/create', authenticateCompany, CompanyController.createCampaign);
router.post('/campaign/:id/upload', authenticateCompany, CompanyController.uploadVideoCampaign);

// P2P routes
router.post('/direct/:youtuberId/upload', authenticateCompany, CompanyController.uploadVideoDirectToYoutuber);

// Youtuber discovery
router.get('/youtubers', authenticateCompany, CompanyController.getYoutubers);

export default router;
