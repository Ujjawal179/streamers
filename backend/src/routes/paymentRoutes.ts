import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/create-payment', authenticateToken, PaymentController.createPayment);
router.post('/verify-payment', authenticateToken, PaymentController.verifyPayment);

export default router;
