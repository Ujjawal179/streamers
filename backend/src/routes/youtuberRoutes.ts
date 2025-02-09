import { Router } from 'express';
import { auth } from '../middleware/auth';
const router = Router();

import { YoutuberController } from '../controllers/youtuberController';

router.put('/:id', auth, YoutuberController.updateYoutuber);
router.get('/:id/username', YoutuberController.getUsername);
router.get('/:id', YoutuberController.getYoutuberDetails);
router.put('/:id/settings', auth, YoutuberController.updateSettings);
router.get('/:id/campaigns', auth, YoutuberController.getYoutuberCampaigns);
router.delete('/:id', auth, YoutuberController.deleteYoutuber);

export default router;
