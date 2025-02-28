"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YoutubeAdCostCalculator = void 0;
class YoutubeAdCostCalculator {
    /**
     * Gets the appropriate CPM tier for the given concurrent viewers count
     */
    static getCPMTier(ccv) {
        // Find the matching tier or use the highest tier for extremely high CCVs
        const tier = this.CPM_TIERS.find(t => ccv >= t.minCCV && ccv <= t.maxCCV) ||
            this.CPM_TIERS[this.CPM_TIERS.length - 1];
        return tier;
    }
    /**
     * Calculates the cost for a single ad display based on concurrent viewers
     */
    static calculateSingleAdCost(ccv) {
        const tier = this.getCPMTier(ccv);
        const cpv = tier.cpm / 1000; // Convert CPM to cost per view
        return Math.round(ccv * cpv); // Cost for a single ad display
    }
    /**
     * Calculates the streamer's income for a single stream
     */
    static calculateStreamIncome(ccv, useMaxAds = true) {
        const tier = this.getCPMTier(ccv);
        const cpv = tier.cpm / 1000; // Cost per view
        // Determine number of ads to calculate for
        const adsPerStream = useMaxAds ? tier.maxAdsPerStream : Math.min(8, tier.maxAdsPerStream);
        // Calculate income for the stream
        const totalStreamIncome = Math.round(ccv * cpv * adsPerStream);
        // Calculate platform and streamer shares
        const platformShare = Math.round(totalStreamIncome * (this.STREAM_CONSTANTS.PLATFORM_FEE_PERCENTAGE / 100));
        const streamerShare = totalStreamIncome - platformShare;
        // Calculate monthly income based on streams per month
        const monthlyIncome = totalStreamIncome * this.STREAM_CONSTANTS.STREAMS_PER_MONTH;
        return {
            cpmRate: tier.cpm,
            maxAdsPerStream: tier.maxAdsPerStream,
            incomePerStream: totalStreamIncome,
            adsPerStream,
            estimatedMonthlyIncome: monthlyIncome,
            minAdInterval: tier.minInterval,
            platformShare,
            streamerShare
        };
    }
    /**
     * Calculate cost for a campaign based on target views and selected streamers
     */
    static calculateCampaignCost(streamers) {
        let totalCost = 0;
        let totalViews = 0;
        const breakdown = streamers.map(streamer => {
            const tier = this.getCPMTier(streamer.ccv);
            const costPerAd = this.calculateSingleAdCost(streamer.ccv);
            const totalStreamerCost = costPerAd * streamer.adDisplays;
            const streamerViews = streamer.ccv * streamer.adDisplays;
            totalCost += totalStreamerCost;
            totalViews += streamerViews;
            return {
                ccv: streamer.ccv,
                cost: totalStreamerCost,
                views: streamerViews,
                cpm: tier.cpm
            };
        });
        return {
            totalCost,
            totalViews,
            breakdownByStreamer: breakdown
        };
    }
    /**
     * Calculate how many ad displays are possible within a budget
     */
    static calculatePossibleAdsForBudget(ccv, budget) {
        const costPerDisplay = this.calculateSingleAdCost(ccv);
        const possibleAdDisplays = Math.floor(budget / costPerDisplay);
        const totalCost = possibleAdDisplays * costPerDisplay;
        const remainingBudget = budget - totalCost;
        const tier = this.getCPMTier(ccv);
        // Calculate recommended stream distribution
        const maxAdsPerStream = tier.maxAdsPerStream;
        const recommendedStreams = Math.ceil(possibleAdDisplays / maxAdsPerStream);
        return {
            possibleAdDisplays,
            totalViews: ccv * possibleAdDisplays,
            costPerDisplay,
            remainingBudget,
            cpmRate: tier.cpm,
            recommendedStreams
        };
    }
    /**
     * Optimize ad distribution across multiple streamers for a target view count
     */
    static optimizeAdDistributionForViews(targetViews, streamers) {
        // Sort streamers by efficiency (cost per view)
        const sortedStreamers = [...streamers].sort((a, b) => {
            const aCostPerView = this.calculateSingleAdCost(a.ccv) / a.ccv;
            const bCostPerView = this.calculateSingleAdCost(b.ccv) / b.ccv;
            return aCostPerView - bCostPerView; // Lowest cost per view first
        });
        let remainingViews = targetViews;
        let totalCost = 0;
        let totalViews = 0;
        const selectedStreamers = [];
        // Greedy algorithm to allocate ads
        for (const streamer of sortedStreamers) {
            if (remainingViews <= 0)
                break;
            const tier = this.getCPMTier(streamer.ccv);
            const costPerAd = this.calculateSingleAdCost(streamer.ccv);
            // Calculate how many ads we need from this streamer
            const neededAds = Math.ceil(remainingViews / streamer.ccv);
            // Limit to max ads per stream (typically 8 or 16)
            const maxAds = tier.maxAdsPerStream;
            // Use what we need or max, whichever is less
            const adDisplays = Math.min(neededAds, maxAds);
            const views = streamer.ccv * adDisplays;
            const cost = costPerAd * adDisplays;
            selectedStreamers.push({
                id: streamer.id,
                name: streamer.name,
                ccv: streamer.ccv,
                adDisplays,
                cost,
                views
            });
            remainingViews -= views;
            totalCost += cost;
            totalViews += views;
        }
        return {
            selectedStreamers,
            totalCost,
            totalViews
        };
    }
}
exports.YoutubeAdCostCalculator = YoutubeAdCostCalculator;
// Exact CPM tiers based on the provided table
YoutubeAdCostCalculator.CPM_TIERS = [
    { minCCV: 1, maxCCV: 50, cpm: 275, maxAdsPerStream: 8, minInterval: 15 },
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
YoutubeAdCostCalculator.STREAM_CONSTANTS = {
    AVERAGE_STREAM_TIME: 120, // 2 hours in minutes
    MAX_AD_DURATION: 10, // seconds per ad
    STREAMS_PER_MONTH: 30,
    PLATFORM_FEE_PERCENTAGE: 30,
};
