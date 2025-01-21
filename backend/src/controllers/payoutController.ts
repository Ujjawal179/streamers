
import { Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import prisma from '../db/db';

export const processPayout = async (req: Request, res: Response) => {
  const { orderId } = req.body;

  try {
    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: {
        youtuber: true
      }
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const transferAmount = Math.floor(Number(payment.amount) * 0.7);

    const payoutResponse = await axios.post('https://api.razorpay.com/v1/payouts', {
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
        'X-Payout-Idempotency': crypto.randomUUID(), // Unique idempotency key
        'Content-Type': 'application/json'
      },
      auth: {
        username: process.env.RAZORPAY_KEY_ID || '',
        password: process.env.RAZORPAY_KEY_SECRET || ''
      }
    });

    if (payoutResponse.data?.status !== 'processed') {
      throw new Error('Failed to process payout');
    }

    await prisma.payment.update({
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
  } catch (error) {
    console.error('Payout processing error:', error);
    res.status(500).json({ success: false, message: 'Failed to process payout' });
  }
};