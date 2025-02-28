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
exports.CompanyService = void 0;
const database_1 = __importDefault(require("../config/database"));
const VideoQueueService_1 = require("./VideoQueueService");
const paymentService_1 = require("./paymentService");
const ApiError_1 = require("../utils/ApiError");
class CompanyService {
    static getYoutubers(requiredViews) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = {
                isLive: true,
                charge: { gt: 0 }
            };
            // If requiredViews is provided, add additional filtering
            if (requiredViews) {
                Object.assign(where, {
                    averageViews: {
                        gte: Math.ceil(requiredViews / 3) // Ensure YouTuber can deliver required views in max 3 plays
                    }
                });
            }
            return database_1.default.youtuber.findMany({
                where,
                orderBy: {
                    charge: 'asc'
                }
            });
        });
    }
    static getYoutubersForViews(requiredViews) {
        return __awaiter(this, void 0, void 0, function* () {
            const youtubers = yield database_1.default.youtuber.findMany({
                where: {
                    isLive: true,
                    charge: { gt: 0 }
                },
                orderBy: { charge: 'asc' }
            });
            let remainingViews = requiredViews;
            const selectedYoutubers = [];
            for (const youtuber of youtubers) {
                if (remainingViews <= 0)
                    break;
                const viewsPerPlay = youtuber.averageViews || 0;
                if (viewsPerPlay <= 0)
                    continue;
                const playsNeeded = Math.ceil(Math.min(remainingViews, viewsPerPlay * 3) / viewsPerPlay);
                const expectedViews = viewsPerPlay * playsNeeded;
                const paymentAmount = playsNeeded * (youtuber.charge || 0);
                selectedYoutubers.push({
                    youtuber,
                    playsNeeded,
                    expectedViews,
                    paymentAmount,
                    charge: youtuber.charge || 0
                });
                remainingViews -= expectedViews;
            }
            return {
                youtubers: selectedYoutubers,
                totalViewsAchieved: requiredViews - remainingViews,
                remainingViews
            };
        });
    }
    static uploadVideoToYoutubers(selectedYoutubers, videoData) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.all(selectedYoutubers.map(({ youtuberId, playsNeeded }) => VideoQueueService_1.VideoQueueService.addToYoutuberQueue(youtuberId, Object.assign(Object.assign({}, videoData), { playNumber: 1, totalPlays: playsNeeded }))));
        });
    }
    static getVideo(youtuberId, pin) {
        return __awaiter(this, void 0, void 0, function* () {
            const youtuber = yield database_1.default.youtuber.findUnique({
                where: { id: youtuberId }
            });
            if (!youtuber || youtuber.MagicNumber !== Number(pin)) {
                throw new ApiError_1.ApiError(401, 'Invalid YouTuber or PIN');
            }
            return VideoQueueService_1.VideoQueueService.removeCurrentVideo(youtuberId);
        });
    }
    static calculateCampaignYoutubers(requiredViews, budget) {
        return __awaiter(this, void 0, void 0, function* () {
            const youtubers = yield database_1.default.youtuber.findMany({
                where: {
                    charge: { gt: 0 }
                },
                orderBy: { charge: 'asc' }
            });
            let remainingViews = requiredViews;
            let totalCost = 0;
            const selectedYoutubers = [];
            for (const youtuber of youtubers) {
                if (remainingViews <= 0 || totalCost >= budget)
                    break;
                const viewsPerPlay = youtuber.averageViews || 0;
                if (viewsPerPlay <= 0)
                    continue;
                const maxPlaysForBudget = Math.floor((budget - totalCost) / youtuber.charge);
                const playsNeededForViews = Math.ceil(Math.min(remainingViews, viewsPerPlay * 3) / viewsPerPlay);
                const playsNeeded = Math.min(maxPlaysForBudget, playsNeededForViews);
                const cost = playsNeeded * youtuber.charge;
                const expectedViews = playsNeeded * viewsPerPlay;
                selectedYoutubers.push({
                    youtuber,
                    playsNeeded,
                    expectedViews,
                    cost
                });
                remainingViews -= expectedViews;
                totalCost += cost;
            }
            return {
                youtubers: selectedYoutubers,
                totalCost,
                remainingViews,
                achievableViews: requiredViews - remainingViews
            };
        });
    }
    static createCampaignAndUploadVideos(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const campaign = yield this.calculateCampaignYoutubers(input.requiredViews, input.budget);
            if (campaign.youtubers.length === 0) {
                throw new ApiError_1.ApiError(404, 'No suitable YouTubers found for the campaign');
            }
            // Create campaign record
            const campaignRecord = yield database_1.default.campaign.create({
                data: {
                    companyId: input.companyId,
                    name: input.name,
                    description: input.description,
                    budget: input.budget,
                    targetViews: input.requiredViews,
                    status: 'ACTIVE',
                    youtubers: {
                        connect: campaign.youtubers.map(y => ({ id: y.youtuber.id }))
                    }
                }
            });
            // Process each YouTuber
            const results = yield Promise.all(campaign.youtubers.map((_a) => __awaiter(this, [_a], void 0, function* ({ youtuber, playsNeeded, cost }) {
                // Create payment record
                const payment = yield paymentService_1.PaymentService.createPayment({
                    companyId: input.companyId,
                    youtuberId: youtuber.id,
                    amount: cost,
                    playsNeeded,
                });
                // Add videos to YouTuber's queue
                for (let i = 0; i < playsNeeded; i++) {
                    yield VideoQueueService_1.VideoQueueService.addToYoutuberQueue(youtuber.id, {
                        url: input.videoUrl,
                        playNumber: i + 1,
                        totalPlays: playsNeeded,
                        campaignId: campaignRecord.id,
                        paymentId: payment.id
                    });
                }
                return { youtuberId: youtuber.id, payment, playsNeeded };
            })));
            return {
                campaign: campaignRecord,
                results,
                totalCost: campaign.totalCost,
                expectedViews: campaign.achievableViews
            };
        });
    }
    static getYoutuber(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.default.youtuber.findUnique({
                where: { id }
            });
        });
    }
    static updateCompany(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.default.company.update({
                where: { id },
                data
            });
        });
    }
    static deleteCompany(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const company = yield database_1.default.company.findUnique({
                where: { id },
                select: { userId: true }
            });
            if (!company)
                throw new ApiError_1.ApiError(404, 'Company not found');
            yield database_1.default.$transaction([
                database_1.default.company.update({
                    where: { id },
                    data: { name: "", address: null, country: null, city: null, zip: null }
                }),
                database_1.default.user.update({
                    where: { id: company.userId },
                    data: {
                        email: `deleted_${Date.now()}_${company.userId}@deleted.com`,
                        password: 'DELETED_ACCOUNT'
                    }
                })
            ]);
        });
    }
    static uploadVideoToYoutuberWithPlays(youtuberId, videoData, playsNeeded) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = [];
            for (let i = 0; i < playsNeeded; i++) {
                promises.push(VideoQueueService_1.VideoQueueService.addToYoutuberQueue(youtuberId, Object.assign(Object.assign({}, videoData), { playNumber: i + 1, totalPlays: playsNeeded, playsNeeded })));
            }
            return Promise.all(promises);
        });
    }
    static uploadVideoToYoutuber(youtuberId, videoData) {
        return __awaiter(this, void 0, void 0, function* () {
            return VideoQueueService_1.VideoQueueService.addToYoutuberQueue(youtuberId, Object.assign(Object.assign({}, videoData), { playNumber: 1, totalPlays: 1, playsNeeded: 1 }));
        });
    }
}
exports.CompanyService = CompanyService;
