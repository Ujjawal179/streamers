import { Router } from 'express';
import { auth } from '../middleware/auth';
import { CompanyController } from '../controllers/companyController';
import { getCloudinarySignature } from '../controllers/userController';

const router = Router();

// Campaign-based video uploads
router.post('/campaign/:companyId', auth, CompanyController.uploadVideoCampaign);
// Direct video uploads to specific YouTuber
router.post('/direct/:youtuberId', auth, CompanyController.uploadVideoDirectToYoutuber);
// Get next video from YouTuber's queue
router.get('/queue/:youtuberId/next', auth, CompanyController.getNextVideoInQueue);
// Get video by ID
router.get('/video/:youtuberId', auth, CompanyController.getVideo);

// Generate signature for Cloudinary upload
router.get('/get-signature',auth, getCloudinarySignature);

export default router;
