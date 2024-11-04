import { Router } from 'express';
import { YoutuberController } from '../controllers/youtuberController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/:youtuberId', authenticateToken, YoutuberController.getYoutuber);
router.put('/:youtuberId/update', authenticateToken, YoutuberController.updateYoutuber);
router.get('/:youtuberId/payments', authenticateToken, YoutuberController.getPayments);
router.post('/:youtuberId/payout-details', authenticateToken, YoutuberController.updatePayoutDetails);

export default router;
