import { razorpay } from '../config/razorpay';
import prisma from '../config/database';
import crypto from 'crypto';
import axios from 'axios';

interface PaymentOrderInput {
  companyId: string;
  youtuberId: string;
  amount: number;
  currency: string;
}

interface PayoutVerificationInput {
  orderId: string;
  paymentId: string;
  signature: string;
}

export class PaymentService {
  static async createPaymentOrder(input: PaymentOrderInput) {
    const timestamp = Date.now().toString().slice(-6);
    const shortReceipt = `rcpt_${timestamp}`;

    const paymentOrder = await razorpay.orders.create({
      amount: input.amount * 100,
      currency: input.currency,
      receipt: shortReceipt,
      payment_capture: true
    });

    await prisma.payment.create({
      data: {
        companyId: input.companyId,
        youtuberId: input.youtuberId,
        amount: input.amount,
        orderId: paymentOrder.id,
        paymentId: shortReceipt,
        status: 'created',
      },
    });

    return paymentOrder;
  }

  static async processPayoutToYoutuber(input: PayoutVerificationInput) {
    const payment = await prisma.payment.findUnique({
      where: { orderId: input.orderId },
      include: { youtuber: true }
    });

    if (!payment) throw new Error('Payment not found');

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(input.orderId + '|' + input.paymentId)
      .digest('hex');

    if (input.signature !== expectedSignature) {
      throw new Error('Invalid payment signature');
    }

    await prisma.payment.update({
      where: { orderId: input.orderId },
      data: { status: 'paid', paymentId: input.paymentId },
    });

    const youtuberShare = payment.amount * 0.7;
    
    const payoutOptions = {
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
      fund_account: {
        account_type: 'bank_account',
        bank_account: {
          name: payment.youtuber.name,
          ifsc: payment.youtuber.ifsc,
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

    const payoutResponse = await axios.post(
      'https://api.razorpay.com/v1/payouts',
      payoutOptions,
      {
        auth: {
          username: process.env.RAZORPAY_KEY_ID || '',
          password: process.env.RAZORPAY_KEY_SECRET || ''
        }
      }
    );

    if (payoutResponse.data?.status !== 'processed') {
      throw new Error('Failed to process payout');
    }

    return { message: 'Payment and payout successful' };
  }

  static async getPaymentsByYoutuber(youtuberId: string) {
    return prisma.payment.findMany({
      where: { youtuberId },
      select: {
        amount: true,
        status: true,
        orderId: true,
        createdAt: true,
      },
    });
  }
}
