import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  createPaymentOrder,
  verifyPayment,
  getPaymentStatus,
  getYoutuberPayments,
  getCompanyPayments
} from '../controllers/paymentController';

const router = Router();

router.post('/create', auth, createPaymentOrder);
router.post('/verify', auth, verifyPayment);
router.get('/status/:orderId', auth, getPaymentStatus);
router.get('/youtuber/:youtuberId', auth, getYoutuberPayments);
router.get('/company/:companyId', auth, getCompanyPayments);

export default router;
