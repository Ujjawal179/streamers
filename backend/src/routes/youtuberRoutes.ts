import { Router } from 'express';
import { auth } from '../middleware/auth';
const router = Router();

import { 
  updateYoutuber,
  getUsername,
  getYoutuberDetails,
  updateSettings,
  getYoutuberCampaigns
} from '../controllers/youtuberController';

router.put('/:id', auth, updateYoutuber);
router.get('/:id/username', getUsername);
router.get('/:id', getYoutuberDetails);
router.put('/:id/settings', auth, updateSettings);
router.get('/:id/campaigns', auth, getYoutuberCampaigns);

export default router;
