"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const paymentController_1 = require("../controllers/paymentController");
const router = (0, express_1.Router)();
// Basic payment routes
router.post('/create', auth_1.auth, paymentController_1.PaymentController.createPayment);
router.put('/:id/status', auth_1.auth, paymentController_1.PaymentController.updatePaymentStatus);
// Payment order routes
router.post('/order', auth_1.auth, paymentController_1.createPaymentOrder);
router.post('/order/campaign', auth_1.auth, paymentController_1.createPaymentOrderForCampaign);
// Payment verification and status
router.post('/verify', paymentController_1.verifyPayment);
router.post('/verify-campaign', paymentController_1.verifyBulkPayment);
router.get('/status/:orderId', auth_1.auth, paymentController_1.getPaymentStatus);
// Payment history routes
router.get('/youtuber/:youtuberId', auth_1.auth, paymentController_1.getYoutuberPayments);
router.get('/company/:companyId', auth_1.auth, paymentController_1.getCompanyPayments);
exports.default = router;
