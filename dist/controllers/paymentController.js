"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompanyPayments = exports.getYoutuberPayments = exports.getPaymentStatus = exports.verifyBulkPayment = exports.verifyPayment = exports.createPaymentOrderForCampaign = exports.createPaymentOrder = exports.PaymentController = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const db_1 = __importDefault(require("../db/db"));
const companyService_1 = require("../services/companyService");
const paymentService_1 = require("../services/paymentService");
const client_1 = require("@prisma/client");
const ApiError_1 = require("../utils/ApiError");
const VideoQueueService_1 = require("../services/VideoQueueService");
const razorpay = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});
class PaymentController {
    static createPayment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.companyId)) {
                    throw new ApiError_1.ApiError(401, 'Company authentication required');
                }
                const { amount, youtuberId, playsNeeded } = req.body;
                if (!amount || !youtuberId) {
                    throw new ApiError_1.ApiError(400, 'Amount and YouTuber ID are required');
                }
                const payment = yield paymentService_1.PaymentService.createPayment({
                    amount: Number(amount),
                    companyId: req.user.companyId,
                    youtuberId,
                    playsNeeded: Number(playsNeeded) || 1
                });
                res.json({ success: true, data: payment });
            }
            catch (error) {
                if (error instanceof ApiError_1.ApiError) {
                    res.status(error.statusCode).json({ success: false, error: error.message });
                }
                else {
                    res.status(500).json({ success: false, error: 'Failed to create payment' });
                }
            }
        });
    }
    static updatePaymentStatus(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const { status, transactionId } = req.body;
                const payment = yield paymentService_1.PaymentService.updatePaymentStatus(id, status, transactionId);
                if (status === 'PAID') {
                    yield paymentService_1.PaymentService.processPayment(id);
                }
                res.json(payment);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
}
exports.PaymentController = PaymentController;
const createPaymentOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { companyId, youtuberId, amount, currency = 'INR', playsNeeded = 1 } = req.body;
    try {
        // Validate Company exists
        const company = yield db_1.default.company.findUnique({
            where: { id: companyId }
        });
        if (!company) {
            return res.status(400).json({ message: 'Company not found' });
        }
        // Validate YouTuber exists and is live
        const youtuber = yield db_1.default.youtuber.findUnique({
            where: { id: youtuberId }
        });
        if (!youtuber || !youtuber.isLive) {
            return res.status(400).json({ message: 'YouTuber is not available' });
        }
        const options = {
            amount: amount * 100, // amount in smallest currency unit
            currency,
            receipt: `rcpt_${Date.now()}`,
            notes: {
                companyId,
                youtuberId,
                playsNeeded
            }
        };
        const order = yield razorpay.orders.create(options);
        // Create pending payment record
        const payment = yield db_1.default.payment.create({
            data: {
                companyId,
                youtuberId,
                amount,
                status: 'PENDING',
                orderId: order.id,
                playsNeeded,
                earnings: 0,
                platformFee: 0
            }
        });
        res.json({
            success: true,
            data: {
                order: {
                    id: order.id,
                    currency: order.currency,
                    amount: order.amount
                },
                payment,
                key: process.env.RAZORPAY_KEY_ID
            }
        });
    }
    catch (error) {
        console.error('Payment creation error:', error);
        res.status(500).json({ success: false, message: 'Failed to create payment' });
    }
});
exports.createPaymentOrder = createPaymentOrder;
const createPaymentOrderForCampaign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { companyId, requiredViews, budget, currency = 'INR' } = req.body;
    try {
        const youtubers = yield companyService_1.CompanyService.getYoutubersForViews(requiredViews);
        const totalCost = youtubers.youtubers.reduce((sum, y) => sum + (y.charge || 0), 0);
        if (totalCost > budget) {
            return res.status(400).json({ message: 'Budget insufficient for required views' });
        }
        const options = {
            amount: totalCost * 100, // Convert to paise
            currency,
            receipt: `rcpt_${Date.now()}`,
            payment_capture: 1
        };
        const order = yield razorpay.orders.create(options);
        // Create individual payments for each YouTuber
        const payments = yield Promise.all(youtubers.youtubers.filter(youtuber => youtuber.id).map(youtuber => db_1.default.payment.create({
            data: {
                companyId,
                youtuberId: youtuber.id,
                amount: youtuber.charge || 0,
                orderId: order.id,
                earnings: 0,
                platformFee: 0,
                status: 'PENDING'
            }
        })));
        res.json({ order, payments });
    }
    catch (error) {
        console.error('Campaign payment creation error:', error);
        res.status(500).json({ message: 'Failed to create campaign payment order' });
    }
});
exports.createPaymentOrderForCampaign = createPaymentOrderForCampaign;
const verifyPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Starting payment verification process', { orderId: req.body.orderId });
    const { orderId, paymentId, signature, videoData } = req.body;
    try {
        if (!orderId) {
            console.log('Missing orderId in request body');
            return res.status(400).json({ success: false, message: 'Order ID is required' });
        }
        console.log('Finding payment with orderId:', orderId);
        const payment = yield db_1.default.payment.findUniqueOrThrow({
            where: { orderId: orderId },
            include: {
                youtuber: {
                    include: {
                        user: true
                    }
                },
                company: true
            }
        });
        if (!payment) {
            console.log('Payment not found for orderId:', orderId);
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        console.log('Found payment:', { id: payment.id, companyId: payment.companyId, youtuberId: payment.youtuberId });
        // Verify signature
        console.log('Verifying payment signature');
        const text = orderId + '|' + paymentId;
        const expectedSignature = crypto_1.default
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(text)
            .digest('hex');
        if (signature !== expectedSignature) {
            console.log('Invalid signature', { expected: expectedSignature, received: signature });
            yield db_1.default.payment.update({
                where: { orderId },
                data: {
                    status: client_1.PaymentStatus.FAILED,
                    transactionId: paymentId
                }
            });
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }
        // Verify payment status with Razorpay
        console.log('Fetching payment details from Razorpay', { paymentId });
        const razorpayPayment = yield razorpay.payments.fetch(paymentId);
        console.log('Razorpay payment details:', { status: razorpayPayment.status, amount: razorpayPayment.amount });
        if (razorpayPayment.status !== 'captured') {
            console.log('Payment not captured', { razorpayStatus: razorpayPayment.status });
            yield db_1.default.payment.update({
                where: { orderId },
                data: {
                    status: client_1.PaymentStatus.FAILED,
                    transactionId: paymentId
                }
            });
            return res.status(400).json({ success: false, message: 'Payment not captured' });
        }
        // Calculate platform fee and YouTuber earnings
        const platformFee = Math.floor(Number(razorpayPayment.amount) * 0.3); // 30% platform fee
        const earnings = Number(razorpayPayment.amount) - platformFee;
        console.log('Payment calculations', {
            total: razorpayPayment.amount,
            platformFee,
            earnings
        });
        let paymentStatus = client_1.PaymentStatus.PROCESSING;
        let paymentMessage = 'Payment received but processing';
        // Verify YouTuber's bank details before attempting payout
        console.log('Checking YouTuber bank details', {
            bankVerified: payment.youtuber.bankVerified,
            hasBankInfo: Boolean(payment.youtuber.bankName && payment.youtuber.accountNumber && payment.youtuber.ifscCode)
        });
        if (!payment.youtuber.bankVerified) {
            console.log('YouTuber bank not verified');
            paymentMessage = 'Payment received but payout pending - Bank details not verified';
        }
        else if (payment.youtuber.bankName && payment.youtuber.accountNumber && payment.youtuber.ifscCode) {
            try {
                console.log('Attempting payout to YouTuber');
                const payoutResponse = yield axios_1.default.post('https://api.razorpay.com/v1/payouts', {
                    account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
                    fund_account_id: payment.youtuber.accountNumber,
                    amount: earnings,
                    currency: razorpayPayment.currency,
                    mode: 'IMPS',
                    purpose: 'payout',
                    queue_if_low_balance: true,
                    reference_id: `payout_${orderId}`,
                    narration: `Payout for order ${orderId}`
                }, {
                    headers: {
                        'X-Payout-Idempotency': crypto_1.default.randomUUID(),
                        'Content-Type': 'application/json'
                    },
                    auth: {
                        username: process.env.RAZORPAY_KEY_ID || '',
                        password: process.env.RAZORPAY_KEY_SECRET || ''
                    }
                });
                console.log('Payout response:', payoutResponse.data);
                // Update YouTuber's earnings
                console.log('Updating YouTuber earnings');
                yield db_1.default.youtuber.update({
                    where: { id: payment.youtuberId },
                    data: {
                        earnings: {
                            increment: earnings / 100 // Convert back to base currency
                        }
                    }
                });
                paymentStatus = client_1.PaymentStatus.PAID;
                paymentMessage = 'Payment processed successfully';
            }
            catch (payoutError) {
                console.error('Payout failed:', payoutError);
                console.log('Error details:', payoutError || 'No response data');
                paymentMessage = 'Payment received but payout failed - Will retry automatically';
            }
        }
        // Update payment status regardless of video upload
        console.log('Updating payment status to', paymentStatus);
        yield db_1.default.payment.update({
            where: { orderId },
            data: {
                status: paymentStatus,
                transactionId: paymentId,
                earnings: earnings / 100, // Convert back to base currency
                platformFee: platformFee / 100 // Convert back to base currency
            }
        });
        let videoUploadStatus = null;
        console.log('Checking for video upload', {
            hasVideoUrl: Boolean(videoData === null || videoData === void 0 ? void 0 : videoData.url),
            playsNeeded: payment.playsNeeded
        });
        // Handle video upload separately if payment is at least in processing state
        if ((videoData === null || videoData === void 0 ? void 0 : videoData.url) && payment.playsNeeded > 0) {
            try {
                console.log('Uploading video to YouTuber queue', {
                    youtuberId: payment.youtuberId,
                    url: videoData.url,
                    playsNeeded: payment.playsNeeded
                });
                yield VideoQueueService_1.VideoQueueService.uploadVideoToYoutuberWithPlays(payment.youtuberId, Object.assign(Object.assign({ url: videoData.url }, (payment.campaignId && { campaignId: payment.campaignId })), { paymentId: payment.id }), payment.playsNeeded);
                videoUploadStatus = { success: true, message: 'Video uploaded successfully' };
                console.log('Video uploaded successfully');
            }
            catch (error) {
                console.error('Video upload error:', error);
                videoUploadStatus = { success: false, message: 'Failed to upload video after payment' };
            }
        }
        console.log('Payment verification completed successfully');
        res.json({
            success: true,
            message: paymentMessage,
            payment: {
                orderId,
                paymentId,
                status: paymentStatus,
                earnings: earnings / 100,
                platformFee: platformFee / 100
            },
            videoUpload: videoUploadStatus
        });
    }
    catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ success: false, message: 'Failed to verify payment' });
    }
});
exports.verifyPayment = verifyPayment;
const verifyBulkPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Starting bulk payment verification', { orderId: req.body.orderId });
    const { orderId, paymentId, signature, videoData } = req.body;
    try {
        if (!orderId) {
            console.log('Missing orderId in request');
            return res.status(400).json({ success: false, message: 'Order ID is required' });
        }
        // Find all payments with the given order ID
        console.log('Finding payments for orderId:', orderId);
        const payments = yield db_1.default.payment.findMany({
            where: { orderId: orderId },
            include: {
                youtuber: {
                    include: {
                        user: true
                    }
                },
                company: true,
                campaign: true
            }
        });
        console.log('Found payments:', payments.length);
        if (!payments || payments.length === 0) {
            console.log('No payments found for orderId:', orderId);
            return res.status(404).json({ success: false, message: 'No payments found for this order' });
        }
        // Verify signature
        console.log('Verifying payment signature');
        const text = orderId + '|' + paymentId;
        const expectedSignature = crypto_1.default
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(text)
            .digest('hex');
        if (signature !== expectedSignature) {
            console.log('Invalid signature', { expected: expectedSignature, received: signature });
            yield db_1.default.payment.updateMany({
                where: { orderId },
                data: {
                    status: client_1.PaymentStatus.FAILED,
                    transactionId: paymentId
                }
            });
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }
        // Verify payment status with Razorpay
        console.log('Fetching payment details from Razorpay', { paymentId });
        const razorpayPayment = yield razorpay.payments.fetch(paymentId);
        console.log('Razorpay payment details:', { status: razorpayPayment.status, amount: razorpayPayment.amount });
        if (razorpayPayment.status !== 'captured') {
            console.log('Payment not captured', { razorpayStatus: razorpayPayment.status });
            yield db_1.default.payment.updateMany({
                where: { orderId },
                data: {
                    status: client_1.PaymentStatus.FAILED,
                    transactionId: paymentId
                }
            });
            return res.status(400).json({ success: false, message: 'Payment not captured' });
        }
        // Calculate total amount in paisa (integer) for verification
        // IMPORTANT: Use Math.round to handle floating point issues
        const totalAmountInPaisa = Math.round(payments.reduce((sum, payment) => sum + payment.amount * 100, 0));
        const totalAmount = totalAmountInPaisa;
        // Ensure we're comparing integers
        const razorpayAmountInPaisa = Number(razorpayPayment.amount);
        console.log('Verifying payment amount', {
            totalAmountInPaisa,
            razorpayAmountInPaisa,
            difference: totalAmountInPaisa - razorpayAmountInPaisa
        });
        // Use a small tolerance for comparison to handle any potential rounding issues
        if (Math.abs(totalAmountInPaisa - razorpayAmountInPaisa) > 1) {
            console.error(`Amount mismatch: expected ${totalAmountInPaisa}, received ${razorpayAmountInPaisa}`);
            return res.status(400).json({ success: false, message: 'Payment amount does not match order total' });
        }
        // Get campaign details for video upload if available
        const campaignId = payments[0].campaignId;
        console.log('Checking for campaign details', { campaignId });
        let campaignDetails = null;
        if (campaignId) {
            campaignDetails = yield db_1.default.campaign.findUnique({
                where: { id: campaignId },
                select: { brandLink: true, description: true, name: true }
            });
            console.log('Found campaign details:', campaignDetails);
        }
        // Process each payment
        console.log(`Processing ${payments.length} payments`);
        const results = yield Promise.all(payments.map((payment) => __awaiter(void 0, void 0, void 0, function* () {
            console.log(`Processing payment ${payment.id} for YouTuber ${payment.youtuberId}`);
            // Calculate platform fee and earnings for this specific payment
            const paymentAmount = payment.amount * 100; // Convert to paise
            const paymentShare = paymentAmount / totalAmount;
            const paymentAmountReceived = Math.floor(Number(razorpayPayment.amount) * paymentShare);
            const platformFee = Math.floor(paymentAmountReceived * 0.3); // 30% platform fee
            const earnings = paymentAmountReceived - platformFee;
            console.log('Payment calculations', {
                paymentId: payment.id,
                paymentAmount,
                paymentShare,
                paymentAmountReceived,
                platformFee,
                earnings
            });
            try {
                // If YouTuber's bank is verified, attempt payout
                console.log('Checking YouTuber bank details', {
                    bankVerified: payment.youtuber.bankVerified,
                    hasBankInfo: Boolean(payment.youtuber.bankName && payment.youtuber.accountNumber && payment.youtuber.ifscCode)
                });
                // Default payment status
                let paymentStatus = client_1.PaymentStatus.PROCESSING;
                console.log('Processing payment', { paymentId: payment.id });
                // Update payment record with transaction details
                yield db_1.default.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: paymentStatus,
                        transactionId: paymentId,
                        earnings: earnings / 100, // Convert back to base currency
                        platformFee: platformFee / 100 // Convert back to base currency
                    }
                });
                // Attempt payout if bank details are complete and verified
                const bankDetailsComplete = payment.youtuber.bankVerified &&
                    payment.youtuber.bankName &&
                    payment.youtuber.accountNumber &&
                    payment.youtuber.ifscCode;
                try {
                    if (bankDetailsComplete) {
                        console.log('Attempting payout to YouTuber', {
                            paymentId: payment.id,
                            youtuberId: payment.youtuberId,
                            amount: earnings
                        });
                        const payoutResponse = yield axios_1.default.post('https://api.razorpay.com/v1/payouts', {
                            account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
                            fund_account_id: payment.youtuber.accountNumber,
                            amount: earnings,
                            currency: razorpayPayment.currency,
                            mode: 'IMPS',
                            purpose: 'payout',
                            queue_if_low_balance: true,
                            reference_id: `payout_${orderId}_${payment.id}`,
                            narration: `Payout for order ${orderId}`
                        }, {
                            headers: {
                                'X-Payout-Idempotency': crypto_1.default.randomUUID(),
                                'Content-Type': 'application/json'
                            },
                            auth: {
                                username: process.env.RAZORPAY_KEY_ID || '',
                                password: process.env.RAZORPAY_KEY_SECRET || ''
                            }
                        });
                        console.log('Payout response:', payoutResponse.data);
                        // Update YouTuber's earnings
                        console.log('Updating YouTuber earnings', {
                            youtuberId: payment.youtuberId,
                            earnings: earnings / 100
                        });
                        yield db_1.default.youtuber.update({
                            where: { id: payment.youtuberId },
                            data: {
                                earnings: {
                                    increment: earnings / 100 // Convert back to base currency
                                }
                            }
                        });
                        // Update payment status to PAID
                        paymentStatus = client_1.PaymentStatus.PAID;
                        console.log('Updating payment status to PAID', { paymentId: payment.id });
                        yield db_1.default.payment.update({
                            where: { id: payment.id },
                            data: { status: client_1.PaymentStatus.PAID }
                        });
                    }
                    else {
                        console.log('Bank details not verified or missing', { paymentId: payment.id });
                    }
                    // Upload videos if video data is provided
                    if (videoData && videoData.url && payment.playsNeeded > 0) {
                        console.log('Uploading video for payment', {
                            paymentId: payment.id,
                            videoUrl: videoData.url,
                            playsNeeded: payment.playsNeeded
                        });
                        // Prepare video message if campaign has description
                        let message = null;
                        if (campaignDetails && campaignDetails.description) {
                            message = `${campaignDetails.description || 'Thank you for watching!'}`;
                        }
                        // Upload video to YouTuber's queue with optional campaign message
                        yield VideoQueueService_1.VideoQueueService.uploadVideoToYoutuberWithPlays(payment.youtuberId, Object.assign({ url: videoData.url, paymentId: payment.id, campaignId: payment.campaignId, message }, videoData), payment.playsNeeded);
                        console.log('Video uploaded successfully');
                        return {
                            id: payment.id,
                            status: paymentStatus,
                            success: true,
                            videosUploaded: payment.playsNeeded
                        };
                    }
                    return { id: payment.id, status: paymentStatus, success: true };
                }
                catch (processingError) {
                    console.error(`Processing failed for payment ${payment.id}:`, processingError);
                    return { id: payment.id, status: paymentStatus, error: 'Processing failed' };
                }
            }
            catch (error) {
                console.error(`Error processing payment ${payment.id}:`, error);
                // Even if payment processing succeeds but video upload fails, 
                // try to upload the videos separately and report the issue
                try {
                    if (videoData && videoData.url && payment.playsNeeded > 0) {
                        console.log('Retrying video upload for payment:', payment.id);
                        yield VideoQueueService_1.VideoQueueService.uploadVideoToYoutuberWithPlays(payment.youtuberId, Object.assign({ url: videoData.url, paymentId: payment.id, campaignId: payment.campaignId }, videoData), payment.playsNeeded);
                        console.log('Video upload retry succeeded');
                    }
                    return {
                        id: payment.id,
                        status: payment.status || 'PROCESSING',
                        success: true,
                        videoUploadRetry: true
                    };
                }
                catch (videoError) {
                    console.error(`Video upload retry failed for payment ${payment.id}:`, videoError);
                    return {
                        id: payment.id,
                        status: 'PROCESSING',
                        error: 'Video upload failed',
                        paymentProcessed: payment.status === 'PAID'
                    };
                }
            }
        })));
        console.log('Bulk payment processing completed', {
            successCount: results.filter(r => r.success).length,
            totalCount: results.length
        });
        res.json({
            success: true,
            message: 'Bulk payment processed',
            orderId,
            paymentId,
            videosUploaded: results.reduce((sum, r) => sum + (r.videosUploaded || 0), 0),
            results
        });
    }
    catch (error) {
        console.error('Bulk payment verification error:', error);
        res.status(500).json({ success: false, message: 'Failed to verify bulk payment' });
    }
});
exports.verifyBulkPayment = verifyBulkPayment;
const getPaymentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId } = req.params;
    try {
        const payment = yield db_1.default.payment.findUnique({
            where: { orderId },
            include: {
                youtuber: {
                    select: {
                        name: true,
                        email: true,
                        charge: true
                    }
                },
                company: {
                    select: {
                        name: true
                    }
                }
            }
        });
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        res.json({ success: true, data: payment });
    }
    catch (error) {
        console.error('Payment status error:', error);
        res.status(500).json({ success: false, message: 'Failed to get payment status' });
    }
});
exports.getPaymentStatus = getPaymentStatus;
const getYoutuberPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { youtuberId } = req.params;
    try {
        const payments = yield db_1.default.payment.findMany({
            where: {
                youtuberId,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json({ success: true, data: payments });
    }
    catch (error) {
        console.error('Youtuber payments error:', error);
        res.status(500).json({ success: false, message: 'Failed to get youtuber payments' });
    }
});
exports.getYoutuberPayments = getYoutuberPayments;
const getCompanyPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { companyId } = req.params;
    try {
        const payments = yield db_1.default.payment.findMany({
            where: { companyId },
            include: {
                youtuber: {
                    select: {
                        name: true,
                        charge: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json({ success: true, data: payments });
    }
    catch (error) {
        console.error('Company payments error:', error);
        res.status(500).json({ success: false, message: 'Failed to get company payments' });
    }
});
exports.getCompanyPayments = getCompanyPayments;
