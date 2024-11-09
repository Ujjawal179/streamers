import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../db/db';
import { CompanyService } from '../services/companyService';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

export const createPaymentOrder = async (req: Request, res: Response) => {
  const { companyId, youtuberId, amount, currency = 'INR', playsNeeded = 1 } = req.body;

  try {
    // Validate YouTuber exists and is live
    const youtuber = await prisma.youtuber.findUnique({
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

    const order = await razorpay.orders.create(options);

    // Create pending payment record
    const payment = await prisma.payment.create({
      data: {
        companyId,
        youtuberId,
        amount,
        currency,
        status: 'pending',
        orderId: order.id,
        playsNeeded
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
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment' });
  }
};

export const createPaymentOrderForCampaign = async (req: Request, res: Response) => {
  const { companyId, requiredViews, budget, currency = 'INR' } = req.body;

  try {
    const youtubers = await CompanyService.getYoutubersForViews(requiredViews);
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

    const order = await razorpay.orders.create(options);

    // Create individual payments for each YouTuber
    const payments = await Promise.all(
      youtubers.youtubers.map(youtuber => 
        prisma.payment.create({
          data: {
            companyId,
            youtuberId: youtuber.id,
            amount: youtuber.charge || 0,
            currency,
            status: 'created',
            orderId: order.id
          }
        })
      )
    );

    res.json({ order, payments });
  } catch (error) {
    console.error('Campaign payment creation error:', error);
    res.status(500).json({ message: 'Failed to create campaign payment order' });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  const { orderId, paymentId, signature, videoData } = req.body;

  try {
    // Fetch payment details from database
    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: {
        youtuber: true,
        company: true
      }
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Verify signature
    const text = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(text)
      .digest('hex');

    if (signature !== expectedSignature) {
      await prisma.payment.update({
        where: { orderId },
        data: { status: 'failed' }
      });
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Verify payment status with Razorpay
    const razorpayPayment = await razorpay.payments.fetch(paymentId);
    if (razorpayPayment.status !== 'captured') {
      await prisma.payment.update({
        where: { orderId },
        data: { status: 'failed' }
      });
      return res.status(400).json({ success: false, message: 'Payment not captured' });
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { orderId },
      data: {
        status: 'completed',
        paymentId
      }
    });

    // If payment is successful and video data is provided, upload to YouTuber's queue
    if (videoData && payment.playsNeeded > 1) {
      await CompanyService.uploadVideoToYoutuberWithPlays(
        payment.youtuberId, 
        videoData, 
        payment.playsNeeded
      );
    } else if (videoData) {
      await CompanyService.uploadVideoToYoutuber(payment.youtuberId, videoData);
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment: updatedPayment
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
};

export const getPaymentStatus = async (req: Request, res: Response) => {
  const { orderId } = req.params;

  try {
    const payment = await prisma.payment.findUnique({
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
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get payment status' });
  }
};

export const getYoutuberPayments = async (req: Request, res: Response) => {
  const { youtuberId } = req.params;

  try {
    const payments = await prisma.payment.findMany({
      where: { 
        youtuberId,
        status: 'completed'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ success: true, data: payments });
  } catch (error) {
    console.error('Youtuber payments error:', error);
    res.status(500).json({ success: false, message: 'Failed to get youtuber payments' });
  }
};

export const getCompanyPayments = async (req: Request, res: Response) => {
  const { companyId } = req.params;

  try {
    const payments = await prisma.payment.findMany({
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
  } catch (error) {
    console.error('Company payments error:', error);
    res.status(500).json({ success: false, message: 'Failed to get company payments' });
  }
};
