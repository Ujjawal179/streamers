import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import axios from 'axios';
import prisma from '../db/db';
import { CompanyService } from '../services/companyService';
import { PaymentService } from '../services/paymentService';
import { PaymentStatus } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { VideoQueueService } from '../services/VideoQueueService';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

export class PaymentController {
  static async createPayment(req: Request, res: Response) {
    try {
      if (!req.user?.companyId) {
        throw new ApiError(401, 'Company authentication required');
      }

      const { amount, youtuberId, playsNeeded } = req.body;
      if (!amount || !youtuberId) {
        throw new ApiError(400, 'Amount and YouTuber ID are required');
      }

      const payment = await PaymentService.createPayment({
        amount: Number(amount),
        companyId: req.user.companyId,
        youtuberId,
        playsNeeded: Number(playsNeeded) || 1
      });

      res.json({ success: true, data: payment });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Failed to create payment' });
      }
    }
  }

  static async updatePaymentStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, transactionId } = req.body;

      const payment = await PaymentService.updatePaymentStatus(
        id,
        status as PaymentStatus,
        transactionId
      );

      if (status === 'PAID') {
        await PaymentService.processPayment(id);
      }

      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const createPaymentOrder = async (req: Request, res: Response) => {
  const { companyId, youtuberId, amount, currency = 'INR', playsNeeded = 1 } = req.body;

  try {
    // Validate Company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return res.status(400).json({ message: 'Company not found' });
    }

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
      youtubers.youtubers.filter(youtuber => youtuber.id).map(youtuber => 
        prisma.payment.create({
          data: {
            companyId,
            youtuberId: youtuber.id!,
            amount: youtuber.charge || 0,
            orderId: order.id,
            earnings: 0,
            platformFee: 0,
            status: 'PENDING'
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
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const payment = await prisma.payment.findUniqueOrThrow({
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
        data: { 
          status: PaymentStatus.FAILED,
          transactionId: paymentId
        }
      });
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Verify payment status with Razorpay
    const razorpayPayment = await razorpay.payments.fetch(paymentId);
    if (razorpayPayment.status !== 'captured') {
      await prisma.payment.update({
        where: { orderId },
        data: { 
          status: PaymentStatus.FAILED,
          transactionId: paymentId
        }
      });
      return res.status(400).json({ success: false, message: 'Payment not captured' });
    }

    // Calculate platform fee and YouTuber earnings
    const platformFee = Math.floor(Number(razorpayPayment.amount) * 0.3); // 30% platform fee
    const earnings = Number(razorpayPayment.amount) - platformFee;

    let paymentStatus: PaymentStatus = PaymentStatus.PROCESSING;
    let paymentMessage = 'Payment received but processing';

    // Verify YouTuber's bank details before attempting payout
    if (!payment.youtuber.bankVerified) {
      paymentMessage = 'Payment received but payout pending - Bank details not verified';
    } else if (payment.youtuber.bankName && payment.youtuber.accountNumber && payment.youtuber.ifscCode) {
      try {
        const payoutResponse = await axios.post(
          'https://api.razorpay.com/v1/payouts',
          {
            account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
            fund_account_id: payment.youtuber.accountNumber,
            amount: earnings,
            currency: razorpayPayment.currency,
            mode: 'IMPS',
            purpose: 'payout',
            queue_if_low_balance: true,
            reference_id: `payout_${orderId}`,
            narration: `Payout for order ${orderId}`
          },
          {
            headers: {
              'X-Payout-Idempotency': crypto.randomUUID(),
              'Content-Type': 'application/json'
            },
            auth: {
              username: process.env.RAZORPAY_KEY_ID || '',
              password: process.env.RAZORPAY_KEY_SECRET || ''
            }
          }
        );

        // Update YouTuber's earnings
        await prisma.youtuber.update({
          where: { id: payment.youtuberId },
          data: {
            earnings: {
              increment: earnings / 100 // Convert back to base currency
            }
          }
        });

        paymentStatus = PaymentStatus.PAID;
        paymentMessage = 'Payment processed successfully';
      } catch (payoutError) {
        console.error('Payout failed:', payoutError);
        paymentMessage = 'Payment received but payout failed - Will retry automatically';
      }
    }

    // Update payment status regardless of video upload
    await prisma.payment.update({
      where: { orderId },
      data: {
        status: paymentStatus,
        transactionId: paymentId,
        earnings: earnings / 100, // Convert back to base currency
        platformFee: platformFee / 100 // Convert back to base currency
      }
    });

    let videoUploadStatus = null;
    
    // Handle video upload separately if payment is at least in processing state
    if (videoData?.url && payment.playsNeeded > 0) {
      try {
        await VideoQueueService.uploadVideoToYoutuberWithPlays(
          payment.youtuberId,
          {
            url: videoData.url,
            paymentId: payment.id,
            ...videoData
          },
          payment.playsNeeded
        );
        videoUploadStatus = { success: true, message: 'Video uploaded successfully' };
      } catch (error) {
        console.error('Video upload error:', error);
        videoUploadStatus = { success: false, message: 'Failed to upload video after payment' };
      }
    }

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
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
};

export const verifyBulkPayment = async (req: Request, res: Response) => {
  const { orderId, paymentId, signature, videoData } = req.body;

  try {
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    // Find all payments with the given order ID
    const payments = await prisma.payment.findMany({
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

    if (!payments || payments.length === 0) {
      return res.status(404).json({ success: false, message: 'No payments found for this order' });
    }

    // Verify signature
    const text = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(text)
      .digest('hex');

    if (signature !== expectedSignature) {
      await prisma.payment.updateMany({
        where: { orderId },
        data: { 
          status: PaymentStatus.FAILED,
          transactionId: paymentId
        }
      });
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Verify payment status with Razorpay
    const razorpayPayment = await razorpay.payments.fetch(paymentId);
    if (razorpayPayment.status !== 'captured') {
      await prisma.payment.updateMany({
        where: { orderId },
        data: { 
          status: PaymentStatus.FAILED,
          transactionId: paymentId
        }
      });
      return res.status(400).json({ success: false, message: 'Payment not captured' });
    }

    // Calculate total amount for verification
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0) * 100; // Convert to paise
    if (totalAmount !== Number(razorpayPayment.amount)) {
      console.error(`Amount mismatch: expected ${totalAmount}, received ${razorpayPayment.amount}`);
      return res.status(400).json({ success: false, message: 'Payment amount does not match order total' });
    }

    // Get campaign details for video upload if available
    const campaignId = payments[0].campaignId;
    let campaignDetails = null;
    
    if (campaignId) {
      campaignDetails = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { brandLink: true, description: true, name: true }
      });
    }

    // Process each payment
    const results = await Promise.all(payments.map(async (payment) => {
      // Calculate platform fee and earnings for this specific payment
      const paymentAmount = payment.amount * 100; // Convert to paise
      const paymentShare = paymentAmount / totalAmount;
      const paymentAmountReceived = Math.floor(Number(razorpayPayment.amount) * paymentShare);
      const platformFee = Math.floor(paymentAmountReceived * 0.3); // 30% platform fee
      const earnings = paymentAmountReceived - platformFee;
      
      try {
        // If YouTuber's bank is verified, attempt payout
        if (payment.youtuber.bankVerified && 
            payment.youtuber.bankName && 
            payment.youtuber.accountNumber && 
            payment.youtuber.ifscCode) {
          try {
            const payoutResponse = await axios.post(
              'https://api.razorpay.com/v1/payouts',
              {
                account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
                fund_account_id: payment.youtuber.accountNumber,
                amount: earnings,
                currency: razorpayPayment.currency,
                mode: 'IMPS',
                purpose: 'payout',
                queue_if_low_balance: true,
                reference_id: `payout_${orderId}_${payment.id}`,
                narration: `Payout for order ${orderId}`
              },
              {
                headers: {
                  'X-Payout-Idempotency': crypto.randomUUID(),
                  'Content-Type': 'application/json'
                },
                auth: {
                  username: process.env.RAZORPAY_KEY_ID || '',
                  password: process.env.RAZORPAY_KEY_SECRET || ''
                }
              }
            );

            // Update YouTuber's earnings
            await prisma.youtuber.update({
              where: { id: payment.youtuberId },
              data: {
                earnings: {
                  increment: earnings / 100 // Convert back to base currency
                }
              }
            });

            // Update payment status to PAID
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: PaymentStatus.PAID,
                transactionId: paymentId,
                earnings: earnings / 100, // Convert back to base currency
                platformFee: platformFee / 100 // Convert back to base currency
              }
            });

            // Upload videos if video data is provided
            if (videoData && videoData.url && payment.playsNeeded > 0) {
              // Prepare video message if campaign has brandLink
              let message = null;
              if (campaignDetails && campaignDetails.description) {
                message = `${campaignDetails.description || 'Thank you for watching!'}`;
              }

              // Upload video to YouTuber's queue with optional campaign message
              await VideoQueueService.uploadVideoToYoutuberWithPlays(
                payment.youtuberId,
                {
                  url: videoData.url,
                  paymentId: payment.id,
                  campaignId: payment.campaignId,
                  message,
                  ...videoData
                },
                payment.playsNeeded
              );

              return { 
                id: payment.id, 
                status: payment.status, 
                success: true,
                videosUploaded: payment.playsNeeded
              };
            }

            return { id: payment.id, status: 'PAID', success: true };
          } catch (payoutError) {
            console.error(`Payout failed for payment ${payment.id}:`, payoutError);
            
            // Update payment to PROCESSING status
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: PaymentStatus.PROCESSING,
                transactionId: paymentId,
                earnings: earnings / 100,
                platformFee: platformFee / 100
              }
            });
            
            return { id: payment.id, status: 'PROCESSING', error: 'Payout failed' };
          }
        } else {
          // Bank details not verified or missing
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.PROCESSING,
              transactionId: paymentId,
              earnings: earnings / 100,
              platformFee: platformFee / 100
            }
          });
          
          return { id: payment.id, status: 'PROCESSING', error: 'Bank details not verified' };
        }
      } catch (error) {
        console.error(`Error processing payment ${payment.id}:`, error);

        // Even if payment processing succeeds but video upload fails, 
        // try to upload the videos separately and report the issue
        try {
          if (videoData && videoData.url && payment.playsNeeded > 0) {
            console.log('Retrying video upload for payment:', payment.id);
            await VideoQueueService.uploadVideoToYoutuberWithPlays(
              payment.youtuberId,
              {
                url: videoData.url,
                paymentId: payment.id,
                campaignId: payment.campaignId,
                ...videoData
              },
              payment.playsNeeded
            );
          }
          
          return { 
            id: payment.id, 
            status: payment.status || 'PROCESSING', 
            success: true,
            videoUploadRetry: true
          };
        } catch (videoError) {
          console.error(`Video upload retry failed for payment ${payment.id}:`, videoError);
          return { 
            id: payment.id, 
            status: 'PROCESSING', 
            error: 'Video upload failed',
            paymentProcessed: payment.status === 'PAID'
          };
        }
      }
    }));

    res.json({
      success: true,
      message: 'Bulk payment processed',
      orderId,
      paymentId,
      videosUploaded: results.reduce((sum, r) => sum + (r.videosUploaded || 0), 0),
      results
    });
  } catch (error) {
    console.error('Bulk payment verification error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify bulk payment' });
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