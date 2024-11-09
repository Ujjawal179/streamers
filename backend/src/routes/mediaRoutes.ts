import { Router } from 'express';
import { auth } from '../middleware/auth';
import { CompanyController } from '../controllers/companyController';

const router = Router();

// Campaign-based video uploads
router.post('/campaign/:companyId', auth, CompanyController.uploadVideoCampaign);
// Direct video uploads to specific YouTuber
router.post('/direct/:youtuberId', auth, CompanyController.uploadVideoDirectToYoutuber);
// Get next video from YouTuber's queue
router.get('/queue/:youtuberId/next', auth, CompanyController.getNextVideoInQueue);
// Get video by ID
router.get('/video/:youtuberId', auth, CompanyController.getVideo);

export default router;
