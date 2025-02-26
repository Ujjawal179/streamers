import { Router } from 'express';
import { auth } from '../middleware/auth';
import { 
  PaymentController,
  createPaymentOrder,
  createPaymentOrderForCampaign,
  verifyPayment,
  getPaymentStatus,
  getYoutuberPayments,
  getCompanyPayments,
  verifyBulkPayment,
} from '../controllers/paymentController';

const router = Router();

// Basic payment routes
router.post('/create', auth, PaymentController.createPayment);
router.put('/:id/status', auth, PaymentController.updatePaymentStatus);

// Payment order routes
router.post('/order', auth, createPaymentOrder);
router.post('/order/campaign', auth, createPaymentOrderForCampaign);

// Payment verification and status
router.post('/verify', verifyPayment);
router.post('/verify-campaign', verifyBulkPayment);
router.get('/status/:orderId', auth, getPaymentStatus);

// Payment history routes
router.get('/youtuber/:youtuberId', auth, getYoutuberPayments);
router.get('/company/:companyId', auth, getCompanyPayments);

export default router;