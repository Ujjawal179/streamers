import prisma from '../config/database';
import { Campaign } from '../types';
import { CPM_RATES } from '../config/constants';
import { CPMRate } from '../types';
import { ApiError } from '../utils/ApiError';
import Razorpay from 'razorpay';
import { VideoQueueService } from './VideoQueueService';
import  {SingleYoutuberCampaignInput } from '../interfaces/ICampaign';

// New interface for optimal youtuber selection
interface OptimalYoutuber {
  id: string;
  name: string | null;
  averageViews: number;
  charge: number;
  playsNeeded: number;
  expectedViews: number;
  cost: number;
  costPerView: number;
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

export class CampaignService {
  static async createCampaign(data: {
    name: string;
    description?: string;
    budget: number;
    targetViews: number;
    companyId: string;
    youtubers: Array<{
      id: string;
      playsNeeded: number;
      expectedViews: number;
      cost: number;
    }>;
  }) {
    return prisma.$transaction(async (prisma) => {
      // Create the campaign first
      const campaign = await prisma.campaign.create({
        data: {
          name: data.name,
          description: data.description,
          budget: data.budget,
          targetViews: data.targetViews,
          companyId: data.companyId,
          youtubers: {
            connect: data.youtubers.map(y => ({ id: y.id }))
          }
        },
      });

      // Create payment records for each youtuber with their specific playsNeeded
      const payment = await Promise.all(data.youtubers.map(youtuber => 
        prisma.payment.create({
          data: {
            amount: youtuber.cost,
            companyId: data.companyId,
            youtuberId: youtuber.id,
            playsNeeded: youtuber.playsNeeded,
            status: 'PENDING',
            earnings: youtuber.cost * 0.7, // 70% for youtuber
            platformFee: youtuber.cost * 0.3, // 30% platform fee
            orderId: `order_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          }
        })
      ));

      return { campaign, payment };
    });
  }

  static async getCampaignById(id: string) {
    return prisma.campaign.findUnique({
      where: { id },
      include: {
        youtubers: true,
        donations: true,
        company: true
      }
    });
  }

  static async getCampaignsByCompany(companyId: string) {
    return prisma.campaign.findMany({
      where: { companyId },
      include: {
        youtubers: true,
        donations: true
      }
    });
  }

  static async updateCampaignStatus(id: string, status: Campaign['status']) {
    return prisma.campaign.update({
      where: { id },
      data: { status }
    });
  }

  static async addYoutubersToCampaign(id: string, youtuberIds: string[]) {
    return prisma.campaign.update({
      where: { id },
      data: {
        youtubers: {
          connect: youtuberIds.map(id => ({ id }))
        }
      }
    });
  }

  static async getCampaignStats(id: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        donations: true,
        youtubers: true
      }
    });

    if (!campaign) return null;

    return {
      totalDonations: campaign.donations.length,
      totalSpent: campaign.donations.reduce((sum, d) => sum + d.amount, 0),
      youtuberCount: campaign.youtubers.length,
      remainingBudget: campaign.budget - campaign.donations.reduce((sum, d) => sum + d.amount, 0)
    };
  }

  static async deleteCampaign(id: string) {
    return prisma.campaign.delete({
      where: { id }
    });
  }

  static async getAllCampaigns() {
    return prisma.campaign.findMany({
      include: {
        youtubers: true,
        donations: true,
        company: true
      }
    });
  }

  static calculateCPMRate(ccv: number): CPMRate {
    return CPM_RATES.find(rate => ccv <= rate.minCCV) || CPM_RATES[CPM_RATES.length - 1];
  }

  static async updateCampaignMetrics(campaignId: string, views: number, revenue: number) {
    return prisma.campaign.update({
      where: { id: campaignId },
      data: {
        currentViews: { increment: views },
        totalRevenue: { increment: revenue },
        updatedAt: new Date()
      }
    });
  }

  static async getCampaignAnalytics(id: string) {
    const campaign = await this.getCampaignById(id);
    if (!campaign) return null;

    // Fixed query to properly get analytics
    const analytics = await prisma.streamAnalytics.findMany({
      where: {
        youtuber: {
          campaigns: {
            some: { id }
          }
        },
        timestamp: {
          gte: campaign.createdAt
        }
      }
    });

    return {
      ...campaign,
      totalViews: analytics.reduce((sum, a) => sum + a.totalViews, 0),
      totalRevenue: analytics.reduce((sum, a) => sum + a.revenue, 0),
      averageCCV: analytics.reduce((sum, a) => sum + a.averageCCV, 0) / (analytics.length || 1),
      totalAdsPlayed: analytics.reduce((sum, a) => sum + a.adsPlayed, 0)
    };
  }

  static async createCampaignWithVideo(input: {
    name: string;
    description?: string;
    budget: number;
    targetViews: number;
    companyId: string;
    videoUrl: string;
    youtubers: Array<{
      id: string;
      playsNeeded: number;
      expectedViews: number;
      cost: number;
    }>;
  }) {
    return prisma.$transaction(async (prisma) => {
      // 1. Create campaign record
      const campaign = await prisma.campaign.create({
        data: {
          name: input.name,
          description: input.description,
          budget: input.budget,
          targetViews: input.targetViews,
          companyId: input.companyId,
          status: 'ACTIVE',
          youtubers: {
            connect: input.youtubers.map(y => ({ id: y.id }))
          }
        }
      });


      // Create Order in Razorpay
      const razorpayOrder = await razorpay.orders.create({
        amount: input.budget * 100, // Razorpay expects amount in paise (₹ x 100)
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        payment_capture: true // Auto-capture payment
      });



      // 2. Create payment records and queue videos for each YouTuber
      await Promise.all(
        input.youtubers.map(async (youtuber) => {
          // Create payment
          const payment = await prisma.payment.create({
            data: {
              amount: youtuber.cost,
              companyId: input.companyId,
              youtuberId: youtuber.id,
              campaignId: campaign.id,
              playsNeeded: youtuber.playsNeeded,
              status: 'PENDING',
              earnings: youtuber.cost * 0.7,
              platformFee: youtuber.cost * 0.3,
              orderId: razorpayOrder.id,
            }
          });

          // // Queue video for each required play
          // await VideoQueueService.uploadVideoToYoutuberWithPlays(
          //   youtuber.id,
          //   {
          //     url: input.videoUrl,
          //     campaignId: campaign.id,
          //     paymentId: payment.id
          //   },
          //   youtuber.playsNeeded
          // );

          return { youtuberId: youtuber.id, payment, playsNeeded: youtuber.playsNeeded };
        })
      );

      return { campaign, orderId: razorpayOrder.id };
    });
  }

  static async createSingleYoutuberCampaign(input: SingleYoutuberCampaignInput) {
    if (!input.youtuberId) {
      throw new ApiError(400, 'YouTuber ID is required');
    }

    const youtuber = await prisma.youtuber.findUnique({
      where: { id: input.youtuberId },
      select: {
        id: true,
        name: true,
        averageViews: true, // Use averageViews instead of averageViews
        charge: true
      }
    });

    if (!youtuber) {
      throw new ApiError(404, 'YouTuber not found');
    }

    // Calculate total cost based on YouTuber's charge and plays needed
    // Ensure the cost is an integer to avoid decimal values in payment
    const totalCost = Math.round(youtuber.charge * input.playsNeeded);

    return prisma.$transaction(async (prisma) => {
      const campaign = await prisma.campaign.create({
        data: {
          name: input.name,
          description: input.description,
          budget: totalCost,
          targetViews: (youtuber.averageViews || 0) * input.playsNeeded, // Use averageViews
          companyId: input.companyId,
          status: 'ACTIVE',
          brandLink: input.brandLink,
          youtubers: {
            connect: [{ id: youtuber.id }]
          }
        }
      });

        
    // Create Order in Razorpay
    const razorpayOrder = await razorpay.orders.create({
      amount: totalCost * 100, // Razorpay expects amount in paise (₹ x 100)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: true // Auto-capture payment
    });

      const payment = await prisma.payment.create({
        data: {
          amount: totalCost,
          status: 'PENDING',
          campaignId: campaign.id,
          companyId: input.companyId,
          youtuberId: youtuber.id,
          orderId: razorpayOrder.id,
          earnings: totalCost * 0.7,
          platformFee: totalCost * 0.3,
          playsNeeded: input.playsNeeded
        }
      });

      // await VideoQueueService.uploadVideoToYoutuberWithPlays(
      //   youtuber.id,
      //   {
      //     url: input.videoUrl,
      //     campaignId: campaign.id,
      //     paymentId: payment.id
      //   },
      //   input.playsNeeded
      // );

      return { campaign, payment };
    });
  }

  // Simplified method to find optimal youtuber combinations using only averageViews
  static async findOptimalYoutuberCombination(targetViews: number) {
    // 1. Fetch all active YouTubers with their stats
    const youtubers = await prisma.youtuber.findMany({
      where: { 
        averageViews: { gt: 0 } // Only using averageViews
      },
      select: {
        id: true,
        name: true,
        averageViews: true,
        charge: true
      }
    });

    if (!youtubers.length) {
      throw new ApiError(404, 'No YouTubers found with view data. Please ensure YouTubers have averageViews set.');
    }
    console.log("%%%%%",youtubers)
    // 2. Calculate cost per view for each YouTuber and sort by efficiency
    const youtuberData: OptimalYoutuber[] = youtubers
      .map(y => ({
        id: y.id,
        name: y.name,
        averageViews: y.averageViews || 0,
        charge: y.charge || 0,
        playsNeeded: 0,
        expectedViews: 0,
        cost: 0,
        costPerView: y.averageViews && y.averageViews > 0 ? y.charge / y.averageViews : Infinity
      }))
      .sort((a, b) => a.costPerView - b.costPerView); // Sort by cost efficiency
    console.log("#####",youtuberData)
    return this.calculateOptimalCombination(youtuberData, targetViews);
  }

  // Helper method to calculate optimal combination (extracted to avoid code duplication)
  private static calculateOptimalCombination(youtuberData: OptimalYoutuber[], targetViews: number) {
    // 3. Greedy algorithm to select YouTubers
    let remainingViews = targetViews;
    let totalCost = 0;

    // Loop until we meet or exceed the target views
    while (remainingViews > 0 && youtuberData.some(y => y.averageViews > 0)) {
      // Find the most cost-effective YouTuber
      const mostEfficient = youtuberData.find(y => y.averageViews > 0) as OptimalYoutuber;
      
      // Calculate how many plays we need from this YouTuber
      const playsNeeded = Math.ceil(remainingViews / mostEfficient.averageViews);
      const actualPlays = Math.min(playsNeeded, 5); // Limit to max 5 plays per YouTuber
      
      // Store EXACT cost values (no rounding yet)
      mostEfficient.playsNeeded = actualPlays;
      mostEfficient.expectedViews = actualPlays * mostEfficient.averageViews;
      mostEfficient.cost = actualPlays * mostEfficient.charge; // Remove rounding
      
      // Update remaining views and total cost
      remainingViews -= mostEfficient.expectedViews;
      totalCost += mostEfficient.cost;
      
      // Remove this YouTuber from further consideration
      mostEfficient.averageViews = 0;
    }

    // Filter out YouTubers that weren't selected
    const selectedYoutubers = youtuberData.filter(y => y.playsNeeded > 0);
    
    if (selectedYoutubers.length === 0) {
      throw new ApiError(400, 'Could not find a suitable combination of YouTubers');
    }

    // Use integer math to avoid floating point issues
    // First convert all costs to paisa (integer) for calculations
    let totalPaisa = 0;
    const displayYoutubers = selectedYoutubers.map(y => {
      // Convert each youtuber's cost to paisa
      const costInPaisa = Math.round(y.cost * 100);
      totalPaisa += costInPaisa;
      
      return {
        ...y,
        // Store the integer cost in paisa
        costInPaisa, 
        // For display purposes, convert back to currency with 2 decimals
        cost: costInPaisa / 100
      };
    });

    const totalViewsExact = selectedYoutubers.reduce((sum, y) => sum + y.expectedViews, 0);
    const totalCostExact = totalPaisa / 100; // This is the exact amount in currency units

    return {
      youtubers: displayYoutubers,
      totalViews: totalViewsExact,
      totalCost: totalCostExact, 
      amountInPaisa: totalPaisa // This is the EXACT integer for Razorpay
    };
  }

  // New campaign creation method based on target views
  static async createCampaignByViews(data: {
    name: string;
    description?: string;
    targetViews: number;
    companyId: string;
    videoUrl: string;
    brandLink?: string;
  }) {
    // First check if company exists
    const company = await prisma.company.findUnique({
      where: { id: data.companyId }
    });

    if (!company) {
      throw new ApiError(404, 'Company not found');
    }

    // Find optimal youtuber combination
    const { youtubers, totalCost, amountInPaisa } = await this.findOptimalYoutuberCombination(data.targetViews);

    // REMOVED the second calculation of amountInPaise

    return prisma.$transaction(async (prisma) => {
      // Create the campaign
      const campaign = await prisma.campaign.create({
        data: {
          name: data.name,
          description: data.description,
          budget: totalCost, // Use the exact calculated amount
          targetViews: data.targetViews,
          companyId: data.companyId,
          status: 'ACTIVE',
          brandLink: data.brandLink,
          youtubers: {
            connect: youtubers.map(y => ({ id: y.id }))
          }
        },
      });

      // Create Order in Razorpay with the EXACT integer amount
      const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaisa, // Use the pre-calculated exact integer
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        payment_capture: true
      });

      // Create payment records for each youtuber
      const payments = await Promise.all(youtubers.map(youtuber => 
        prisma.payment.create({
          data: {
            // Use the exact cost for each youtuber (retrieve from costInPaisa)
            amount: youtuber.costInPaisa ? youtuber.costInPaisa / 100 : youtuber.cost,
            companyId: data.companyId,
            youtuberId: youtuber.id,
            campaignId: campaign.id,
            playsNeeded: youtuber.playsNeeded,
            status: 'PENDING',
            earnings: youtuber.cost * 0.7, // 70% for youtuber
            platformFee: youtuber.cost * 0.3, // 30% platform fee
            orderId: razorpayOrder.id
          }
        })
      ));

      return { 
        campaign, 
        payments, 
        selectedYoutubers: youtubers, 
        orderId: razorpayOrder.id,
        totalCost
      };
    });
  }
}