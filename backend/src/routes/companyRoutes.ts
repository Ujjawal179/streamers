import { Router } from 'express';
import { CompanyController } from '../controllers/companyController';
import { CampaignController } from '../controllers/campaignController';
import { authenticateCompany } from '../middleware/auth';
import campaignRoutes from './campaignRoutes';

const router = Router();

// Company profile routes
router.get('/profile', authenticateCompany, CompanyController.getYoutubers);
router.patch('/profile', authenticateCompany, CompanyController.updateCompany);
router.delete('/profile', authenticateCompany, CompanyController.deleteCompany);

// Direct P2P video upload
router.post(
  '/video/:youtuberId', 
  authenticateCompany, 
  CompanyController.uploadVideoToYoutuber
);

// YouTuber discovery
router.get('/youtubers', authenticateCompany, CompanyController.getYoutubers);

// Campaign routes should be in CampaignController
router.use('/campaigns', authenticateCompany, campaignRoutes);

export default router;
