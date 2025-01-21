import { Router } from 'express';
import { auth } from '../middleware/auth';
import { PaymentController } from '../controllers/paymentController';

const router = Router();

router.post('/', auth, PaymentController.createPayment);
router.put('/:id/status', auth, PaymentController.updatePaymentStatus);

export default router;
