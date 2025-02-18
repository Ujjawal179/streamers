import { Router } from 'express';
import { authenticateCompany } from '../middleware/auth';
import { VideoController } from '../controllers/videoController';
import { getCloudinarySignature } from '../utils/cloudinary';

const router = Router();

router.post('/campaign/:companyId', authenticateCompany, VideoController.uploadCampaignVideo);
router.post('/direct/:youtuberId', authenticateCompany, VideoController.uploadDirectVideo);
router.get('/queue/:youtuberId/next', authenticateCompany, VideoController.getNextVideo);
router.get('/video/:youtuberId/:pin', VideoController.getVideoByPin);
router.get('/get-signature', authenticateCompany, getCloudinarySignature);
router.get('/length/:youtuberId',  VideoController.getQueueLength);
router.delete('/video/:youtuberId', authenticateCompany, VideoController.removeCurrentVideo);

export default router;
