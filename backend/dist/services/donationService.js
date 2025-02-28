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
exports.DonationService = void 0;
const database_1 = __importDefault(require("../config/database"));
const redis_1 = require("../config/redis");
const campaignService_1 = require("./campaignService");
const scheduleService_1 = require("./scheduleService");
class DonationService {
    static createDonation(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. First validates schedule if provided
            if (data.scheduledFor) {
                const slotValidation = yield scheduleService_1.ScheduleService.validateScheduleSlot(data.youtuberId, data.scheduledFor);
                if (!slotValidation.valid) {
                    throw new Error(`Invalid schedule slot: ${slotValidation.reason}`);
                }
            }
            // 2. Creates donation record
            const donation = yield database_1.default.donation.create({
                data: Object.assign(Object.assign({}, data), { status: data.scheduledFor ? 'SCHEDULED' : 'PENDING' })
            });
            // 3. Calculates revenue and updates analytics
            const youtuber = yield database_1.default.youtuber.findUnique({
                where: { id: data.youtuberId }
            });
            if (youtuber === null || youtuber === void 0 ? void 0 : youtuber.averageViews) {
                // Calculate CPM based revenue
                const cpmRate = campaignService_1.CampaignService.calculateCPMRate(youtuber.averageViews);
                const revenue = (cpmRate.cpmRate * youtuber.averageViews) / 1000;
                // Create analytics record
                yield database_1.default.streamAnalytics.create({
                    data: {
                        youtuberId: data.youtuberId,
                        streamId: youtuber.currentStreamId || 'unknown',
                        averageCCV: youtuber.averageViews,
                        peakCCV: youtuber.averageViews,
                        adsPlayed: 1,
                        revenue,
                        timestamp: new Date()
                    }
                });
                // Update campaign metrics
                yield campaignService_1.CampaignService.updateCampaignMetrics(data.campaignId, youtuber.averageViews, revenue);
            }
            // 4. Adds to YouTuber's queue
            if (data.scheduledFor) {
                yield (0, redis_1.addToQueue)(`youtuber:${data.youtuberId}:donations`, donation, data.scheduledFor.getTime());
            }
            else {
                yield (0, redis_1.addToQueue)(`youtuber:${data.youtuberId}:donations`, donation);
            }
            return donation;
        });
    }
    static getNextDonation(youtuberId) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `youtuber:${youtuberId}:donations`;
            const donation = yield (0, redis_1.getNextFromQueue)(key);
            if (!donation)
                return null;
            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                yield (0, redis_1.removeFromQueue)(key);
                yield this.updateDonationStatus(donation.id, 'PLAYED');
            }), 15000);
            return donation;
        });
    }
    static updateDonationStatus(id, status) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.default.donation.update({
                where: { id },
                data: { status }
            });
        });
    }
    static getDonationsByCampaign(campaignId) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.default.donation.findMany({
                where: { campaignId },
                include: {
                    company: true,
                    youtuber: true
                }
            });
        });
    }
    static getYoutuberDonations(youtuberId) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.default.donation.findMany({
                where: { youtuberId },
                include: {
                    company: true,
                    campaign: true
                }
            });
        });
    }
}
exports.DonationService = DonationService;
