// src/routes/clickCounterRoutes.ts
import express from 'express';
import { ClickCounterController } from '../controllers/clickCounterController';

const router = express.Router();

// Update click count manually
router.post('/updateClicks', ClickCounterController.updateClickCount);

// Get click count for a message
router.get('/clicks/:messageId', ClickCounterController.getClickCount);

export default router;