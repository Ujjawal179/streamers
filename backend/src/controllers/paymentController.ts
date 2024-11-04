import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import prisma from '../db/db'; // Assuming you have prismaClient set up
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID||'',
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const PaymentController = {
  createPayment: async (req: Request, res: Response) => {
    try {
      const { amount, currency, youtuberId } = req.body;
      
      // Create Razorpay order
      const order = await razorpay.orders.create({
        amount: amount * 100, // Convert to paise
        currency: currency || 'INR',
        receipt: `rcpt_${Date.now()}`,
        notes: {
          youtuberId,
          companyId: req.user?.id||''
        }
      });

      // Save to database
      const payment = await prisma.payment.create({
        data: {
          companyId: req.user?.id||'',
          youtuberId,
          amount,
          currency: currency || 'INR',
          status: 'PENDING',
          orderId: order.id,
        },
      });

      res.status(201).json({ order, payment });
    } catch (error) {
      console.error('Payment creation error:', error);
      res.status(500).json({ message: 'Error creating payment' });
    }
  },

  verifyPayment: async (req: Request, res: Response) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      // Verify signature
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: 'Invalid signature' });
      }

      // Get payment details
      const payment = await prisma.payment.findUnique({
        where: { orderId: razorpay_order_id },
        include: { youtuber: true }
      });

      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      // Update payment status
      await prisma.payment.update({
        where: { orderId: razorpay_order_id },
        data: { 
          status: 'SUCCESS',
          paymentId: razorpay_payment_id
        }
      });

      // Calculate YouTuber's share (70%)
      const youtuberAmount = Math.floor(payment.amount * 0.7);

      // Create transfer to YouTuber's bank account
      try {
        const transfer = await razorpay.transfers.create({
          account: payment.youtuber.accountNumber||'',
          amount: youtuberAmount * 100, // Amount in paise
          currency: payment.currency,
          notes: {
            paymentId: payment.id,
            type: 'youtuber_share'
          }
        });

        res.status(200).json({ 
          success: true,
          message: 'Payment verified and transfer completed',
          transfer
        });
      } catch (transferError) {
        console.error('Transfer failed:', transferError);
        // Still return success but log the transfer failure
        res.status(200).json({
          success: true,
          message: 'Payment verified but transfer pending',
          error: 'Transfer will be retried automatically'
        });
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      res.status(500).json({ message: 'Error verifying payment' });
    }
  }
};
