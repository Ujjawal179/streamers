import { Router } from 'express';
import { CompanyController } from '../controllers/companyController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/upload', authenticateToken, CompanyController.uploadVideo);
router.get('/youtubers', authenticateToken, CompanyController.getYoutubers);

export default router;
