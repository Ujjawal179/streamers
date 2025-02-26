// src/routes/clickCounterRoutes.ts
// src/routes/clickCounterRoutes.ts
import express from 'express';
import { ClickCounterController } from '../controllers/clickCounterController';

const router = express.Router();

router.post('/updateClicks', ClickCounterController.updateClickCount);
router.get('/clicks/:messageId', ClickCounterController.getClickCount);
router.get('/r/:redirectId', ClickCounterController.handleRedirect); // Change to redirectId

export default router;