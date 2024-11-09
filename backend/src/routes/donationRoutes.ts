import { Router } from 'express';
import { auth } from '../middleware/auth';
const router = Router();

import {
  DonationController
} from '../controllers/donationController';

router.post('/', auth, DonationController.createDonation);
router.get('/youtuber/:youtuberId', auth, DonationController.getYoutuberDonations);
router.get('/youtuber/:youtuberId/next', auth, DonationController.getNextDonation);
router.put('/:id/status', auth, DonationController.updateDonationStatus);
router.get('/campaign/:campaignId', auth, DonationController.getDonationsByCampaign);

export default router;
