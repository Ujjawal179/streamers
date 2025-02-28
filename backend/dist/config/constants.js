"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AD_CONSTANTS = exports.REDIS_KEYS = exports.CPM_RATES = void 0;
exports.CPM_RATES = [
    { minCCV: 50, cpmRate: 275, maxIncomePerStream16: 154, maxIncomePerStream8: 77, maxIncomePerMonth: 4620 },
    { minCCV: 100, cpmRate: 300, maxIncomePerStream16: 336, maxIncomePerStream8: 168, maxIncomePerMonth: 10080 },
    { minCCV: 200, cpmRate: 325, maxIncomePerStream16: 728, maxIncomePerStream8: 364, maxIncomePerMonth: 21840 },
    { minCCV: 300, cpmRate: 350, maxIncomePerStream16: 1176, maxIncomePerStream8: 588, maxIncomePerMonth: 35280 },
    { minCCV: 400, cpmRate: 375, maxIncomePerStream16: 1680, maxIncomePerStream8: 840, maxIncomePerMonth: 50400 },
    { minCCV: 500, cpmRate: 400, maxIncomePerStream16: 2240, maxIncomePerStream8: 1120, maxIncomePerMonth: 67200 },
    // ...add remaining rates from your table
];
exports.REDIS_KEYS = {
    DONATION_QUEUE: 'youtuber:{id}:donations',
    VIDEO_QUEUE: 'youtuber:{id}:videos',
};
exports.AD_CONSTANTS = {
    DEFAULT_AD_DURATION: 15000, // 15 seconds
    MAX_ADS_PER_HOUR: 16,
    MIN_GAP_BETWEEN_ADS: 180000, // 3 minutes
};
