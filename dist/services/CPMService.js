"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CPMService = void 0;
const ApiError_1 = require("../utils/ApiError");
// CPM tiers based on the exact data provided
const CPM_TIERS = [
    { minCCV: 0, maxCCV: 50, cpm: 275, maxAdsPerStream: 8, minInterval: 15 },
    { minCCV: 51, maxCCV: 100, cpm: 300, maxAdsPerStream: 8, minInterval: 15 },
    { minCCV: 101, maxCCV: 200, cpm: 325, maxAdsPerStream: 8, minInterval: 15 },
    { minCCV: 201, maxCCV: 300, cpm: 350, maxAdsPerStream: 8, minInterval: 15 },
    { minCCV: 301, maxCCV: 400, cpm: 375, maxAdsPerStream: 8, minInterval: 15 },
    { minCCV: 401, maxCCV: 500, cpm: 400, maxAdsPerStream: 8, minInterval: 15 },
    { minCCV: 501, maxCCV: 1000, cpm: 425, maxAdsPerStream: 16, minInterval: 7.5 },
    { minCCV: 1001, maxCCV: 2000, cpm: 450, maxAdsPerStream: 16, minInterval: 7.5 },
    { minCCV: 2001, maxCCV: 3000, cpm: 475, maxAdsPerStream: 16, minInterval: 7.5 },
    { minCCV: 3001, maxCCV: 5000, cpm: 500, maxAdsPerStream: 16, minInterval: 7.5 },
    { minCCV: 5001, maxCCV: 7500, cpm: 525, maxAdsPerStream: 16, minInterval: 7.5 },
    { minCCV: 7501, maxCCV: 10000, cpm: 550, maxAdsPerStream: 16, minInterval: 7.5 },
    { minCCV: 10001, maxCCV: 20000, cpm: 575, maxAdsPerStream: 16, minInterval: 7.5 },
    { minCCV: 20001, maxCCV: 30000, cpm: 600, maxAdsPerStream: 16, minInterval: 7.5 },
    { minCCV: 30001, maxCCV: 50000, cpm: 625, maxAdsPerStream: 16, minInterval: 7.5 },
    { minCCV: 50001, maxCCV: 100000, cpm: 650, maxAdsPerStream: 16, minInterval: 7.5 },
];
const STREAM_CONSTANTS = {
    AVERAGE_STREAM_TIME: 120, // 2 hours in minutes
    MAX_AD_DURATION: 10, // seconds per ad
    TOTAL_MAX_AD_TIME: 80, // seconds for 8 ads, 160 for 16 ads
    MIN_INTERVAL_LOW_CCV: 15, // minutes for CCV < 500
    MIN_INTERVAL_HIGH_CCV: 7.5, // minutes for CCV >= 500
    STREAMS_PER_MONTH: 30,
    PLATFORM_FEE_PERCENTAGE: 30,
};
class CPMService {
    static getCPMTier(ccv) {
        const tier = CPM_TIERS.find(t => ccv >= t.minCCV && ccv <= t.maxCCV);
        if (!tier) {
            throw new ApiError_1.ApiError(400, 'Invalid CCV value');
        }
        return tier;
    }
    static calculateStreamIncome(ccv) {
        const tier = this.getCPMTier(ccv);
        const cpv = tier.cpm / 1000; // Convert CPM to cost per view
        // Calculate income for both 8 and 16 ads scenarios
        const maxIncomePerStream8Ads = Math.round(ccv * cpv * 8);
        const maxIncomePerStream16Ads = Math.round(ccv * cpv * 16);
        // Use the appropriate max ads based on tier
        const monthlyIncome = (tier.maxAdsPerStream === 16 ? maxIncomePerStream16Ads : maxIncomePerStream8Ads)
            * STREAM_CONSTANTS.STREAMS_PER_MONTH;
        return {
            cpmRate: tier.cpm,
            maxAdsPerStream: tier.maxAdsPerStream,
            maxIncomePerStream8Ads,
            maxIncomePerStream16Ads,
            estimatedMonthlyIncome: monthlyIncome,
            minAdInterval: tier.minInterval,
            maxAdDuration: STREAM_CONSTANTS.MAX_AD_DURATION,
            streamsPerMonth: STREAM_CONSTANTS.STREAMS_PER_MONTH
        };
    }
    static calculateCampaignMetrics(ccv, budget) {
        const tier = this.getCPMTier(ccv);
        const cpv = tier.cpm / 1000;
        // Calculate cost per play based on current CCV
        const costPerPlay = Math.round(ccv * cpv);
        // Calculate how many plays are possible with the budget
        const possiblePlays = Math.floor(budget / costPerPlay);
        // Calculate estimated total views
        const estimatedViews = ccv * possiblePlays;
        // Calculate scheduling metrics
        const maxAdsPerDay = tier.maxAdsPerStream;
        const recommendedDays = Math.ceil(possiblePlays / maxAdsPerDay);
        return {
            cpmRate: tier.cpm,
            maxAdsPerStream: tier.maxAdsPerStream,
            possiblePlays,
            estimatedViews,
            costPerPlay,
            minAdInterval: tier.minInterval,
            recommendedDays,
            maxAdsPerDay
        };
    }
    static validateAdScheduling(ccv, requestedPlays) {
        const tier = this.getCPMTier(ccv);
        if (requestedPlays <= 0) {
            return {
                isValid: false,
                message: 'Number of plays must be greater than 0'
            };
        }
        const maxPlaysPerDay = tier.maxAdsPerStream;
        const recommendedDays = Math.ceil(requestedPlays / maxPlaysPerDay);
        const totalAdTime = requestedPlays * STREAM_CONSTANTS.MAX_AD_DURATION;
        // Check if total ad time exceeds limit
        const maxAdTime = tier.maxAdsPerStream === 16 ? 160 : 80; // seconds
        if (totalAdTime > maxAdTime) {
            return {
                isValid: false,
                message: `Total ad time ${totalAdTime}s exceeds maximum allowed ${maxAdTime}s per stream`,
                totalAdTime,
                maxPlaysPerDay,
                minInterval: tier.minInterval
            };
        }
        if (requestedPlays > maxPlaysPerDay) {
            return {
                isValid: true,
                message: `Campaign will be spread across ${recommendedDays} streams`,
                recommendedDays,
                maxPlaysPerDay,
                minInterval: tier.minInterval,
                totalAdTime
            };
        }
        return {
            isValid: true,
            message: 'Valid ad schedule',
            maxPlaysPerDay,
            minInterval: tier.minInterval,
            totalAdTime
        };
    }
    static calculateYoutuberEarnings(ccv, plays) {
        const tier = this.getCPMTier(ccv);
        const cpv = tier.cpm / 1000;
        const costPerPlay = Math.round(ccv * cpv);
        const totalAmount = costPerPlay * plays;
        const platformFee = Math.round(totalAmount * (STREAM_CONSTANTS.PLATFORM_FEE_PERCENTAGE / 100));
        const youtuberEarnings = totalAmount - platformFee;
        const estimatedViews = ccv * plays;
        return {
            totalAmount,
            platformFee,
            youtuberEarnings,
            estimatedViews,
            cpmRate: tier.cpm,
            costPerPlay
        };
    }
    static getStreamingConstraints(ccv) {
        const tier = this.getCPMTier(ccv);
        return {
            maxAdsPerStream: tier.maxAdsPerStream,
            minInterval: tier.minInterval,
            maxAdDuration: STREAM_CONSTANTS.MAX_AD_DURATION,
            totalMaxAdTime: tier.maxAdsPerStream === 16 ? 160 : 80,
            averageStreamTime: STREAM_CONSTANTS.AVERAGE_STREAM_TIME
        };
    }
}
exports.CPMService = CPMService;
