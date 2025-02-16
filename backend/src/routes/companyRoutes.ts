import { Router } from 'express';
import { authenticateCompany } from '../middleware/auth';
import { CompanyController } from '../controllers/companyController';
import campaignRoutes from './campaignRoutes';

const router = Router();

// Company profile routes
router.use(authenticateCompany); // Apply to all routes

router.get('/profile', CompanyController.getYoutubers);
router.patch('/profile', CompanyController.updateCompany);
router.delete('/profile', CompanyController.deleteCompany);
router.post('/video/:youtuberId', CompanyController.uploadVideoToYoutuber);
router.get('/youtubers', CompanyController.getYoutubers);

// Campaign routes
router.use('/campaigns', campaignRoutes);

export default router;
