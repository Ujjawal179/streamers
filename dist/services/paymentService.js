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
exports.PaymentService = void 0;
const razorpay_1 = require("../config/razorpay");
const database_1 = __importDefault(require("../config/database"));
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
class PaymentService {
    static createPaymentOrder(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const timestamp = Date.now().toString().slice(-6);
            const shortReceipt = `rcpt_${timestamp}`;
            const paymentOrder = yield razorpay_1.razorpay.orders.create({
                amount: input.amount * 100,
                currency: input.currency,
                receipt: shortReceipt,
                payment_capture: true
            });
            yield database_1.default.payment.create({
                data: {
                    companyId: input.companyId,
                    youtuberId: input.youtuberId,
                    amount: input.amount,
                    orderId: paymentOrder.id,
                    paymentId: shortReceipt,
                    status: 'PENDING',
                    earnings: input.amount * 0.7,
                    platformFee: input.amount * 0.3,
                },
            });
            return paymentOrder;
        });
    }
    static processPayoutToYoutuber(input) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const payment = yield database_1.default.payment.findUnique({
                where: { orderId: input.orderId },
                include: { youtuber: true }
            });
            if (!payment)
                throw new Error('Payment not found');
            const expectedSignature = crypto_1.default
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
                .update(input.orderId + '|' + input.paymentId)
                .digest('hex');
            if (input.signature !== expectedSignature) {
                throw new Error('Invalid payment signature');
            }
            yield database_1.default.payment.update({
                where: { orderId: input.orderId },
                data: { status: 'PAID', paymentId: input.paymentId },
            });
            const youtuberShare = payment.amount * 0.7;
            const payoutOptions = {
                account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
                fund_account: {
                    account_type: 'bank_account',
                    bank_account: {
                        name: payment.youtuber.name,
                        ifsc: payment.youtuber.ifscCode,
                        account_number: payment.youtuber.accountNumber,
                    },
                    contact: {
                        name: payment.youtuber.name,
                        email: payment.youtuber.email,
                    },
                },
                amount: Math.round(youtuberShare * 100),
                currency: 'INR',
                purpose: 'payout',
                queue_if_low_balance: true,
                reference_id: `payout_${input.orderId}`,
                narration: `Payout for order ${input.orderId}`,
            };
            const payoutResponse = yield axios_1.default.post('https://api.razorpay.com/v1/payouts', payoutOptions, {
                auth: {
                    username: process.env.RAZORPAY_KEY_ID || '',
                    password: process.env.RAZORPAY_KEY_SECRET || ''
                }
            });
            if (((_a = payoutResponse.data) === null || _a === void 0 ? void 0 : _a.status) !== 'processed') {
                throw new Error('Failed to process payout');
            }
            return { message: 'Payment and payout successful' };
        });
    }
    static getPaymentsByYoutuber(youtuberId) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.default.payment.findMany({
                where: { youtuberId },
                select: {
                    amount: true,
                    status: true,
                    orderId: true,
                    createdAt: true,
                },
            });
        });
    }
    static createPayment(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate company exists to satisfy foreign key constraint
            const companyExists = yield database_1.default.company.findUnique({
                where: { id: data.companyId }
            });
            if (!companyExists) {
                throw new Error('Invalid company id. Company does not exist.');
            }
            const platformFee = data.amount * 0.3; // 30% platform fee
            const earnings = data.amount * 0.7; // 70% YouTuber earnings
            const randomString = () => Math.random().toString(36).slice(2, 11);
            return database_1.default.payment.create({
                data: {
                    amount: data.amount,
                    earnings,
                    platformFee,
                    companyId: data.companyId,
                    youtuberId: data.youtuberId,
                    playsNeeded: data.playsNeeded,
                    orderId: `order_${Date.now()}_${randomString()}`,
                    paymentId: `pay_${Date.now()}_${randomString()}`
                }
            });
        });
    }
    static updatePaymentStatus(id, status, transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.default.payment.update({
                where: { id },
                data: {
                    status,
                    transactionId,
                    updatedAt: new Date()
                }
            });
        });
    }
    static processPayment(paymentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const payment = yield database_1.default.payment.findUnique({
                where: { id: paymentId },
                include: { youtuber: true }
            });
            if (!payment)
                throw new Error('Payment not found');
            // Update YouTuber earnings
            yield database_1.default.youtuber.update({
                where: { id: payment.youtuberId },
                data: {
                    earnings: { increment: payment.earnings }
                }
            });
            return this.updatePaymentStatus(paymentId, 'PAID');
        });
    }
}
exports.PaymentService = PaymentService;
