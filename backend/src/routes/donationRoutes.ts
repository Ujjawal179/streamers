import { Router } from 'express';
import { DonationController } from '../controllers/donationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/create', authenticateToken, DonationController.createDonation);
router.get('/:youtuberId/next-donation', DonationController.getNextDonation);

export default router;
