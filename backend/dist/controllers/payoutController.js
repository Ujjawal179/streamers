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
exports.processPayout = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = __importDefault(require("../db/db"));
const processPayout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { orderId } = req.body;
    try {
        const payment = yield db_1.default.payment.findUnique({
            where: { orderId },
            include: {
                youtuber: true
            }
        });
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        const transferAmount = Math.floor(Number(payment.amount) * 0.7);
        const payoutResponse = yield axios_1.default.post('https://api.razorpay.com/v1/payouts', {
            account_number: process.env.RAZORPAY_ACCOUNT_NUMBER, // Your Razorpay account number
            fund_account_id: payment.youtuber.accountNumber, // YouTuber's fund account ID
            amount: transferAmount,
            currency: 'INR',
            mode: 'IMPS',
            purpose: 'refund',
            queue_if_low_balance: true,
            reference_id: `payout_${payment.orderId}`,
            narration: `Payout for order ${payment.orderId}`,
            notes: {
                notes_key_1: "Payment for video promotion",
                notes_key_2: "YouTuber payout"
            }
        }, {
            headers: {
                'X-Payout-Idempotency': crypto_1.default.randomUUID(), // Unique idempotency key
                'Content-Type': 'application/json'
            },
            auth: {
                username: process.env.RAZORPAY_KEY_ID || '',
                password: process.env.RAZORPAY_KEY_SECRET || ''
            }
        });
        if (((_a = payoutResponse.data) === null || _a === void 0 ? void 0 : _a.status) !== 'processed') {
            throw new Error('Failed to process payout');
        }
        yield db_1.default.payment.update({
            where: { orderId: payment.orderId },
            data: {
                payoutId: payoutResponse.data.id
            }
        });
        res.json({
            success: true,
            message: 'Payout processed successfully',
            payoutId: payoutResponse.data.id
        });
    }
    catch (error) {
        console.error('Payout processing error:', error);
        res.status(500).json({ success: false, message: 'Failed to process payout' });
    }
});
exports.processPayout = processPayout;
