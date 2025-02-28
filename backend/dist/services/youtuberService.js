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
exports.YoutuberService = void 0;
const database_1 = __importDefault(require("../config/database"));
const youtubeAdCostCalculator_1 = require("./youtubeAdCostCalculator"); // Import the new calculator
class YoutuberService {
    static getYoutuberById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.default.youtuber.findUnique({
                where: { id }
            });
        });
    }
    static updateYoutuber(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.default.youtuber.update({
                where: { id },
                data
            });
        });
    }
    static updatePayoutDetails(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.default.youtuber.update({
                where: { id },
                data: {
                    bankName: data.bankName,
                    accountNumber: data.accountNumber,
                    ifscCode: data.ifscCode,
                    panCard: data.panCard,
                    upiId: data.upiId,
                    bankVerified: false // Reset verification when details are updated
                }
            });
        });
    }
    static updateLiveStatus(id, isLive) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.default.youtuber.update({
                where: { id },
                data: { isLive }
            });
        });
    }
    static getYoutubersByCharge(maxCharge) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.default.youtuber.findMany({
                where: {
                    charge: {
                        lte: maxCharge
                    }
                },
                orderBy: {
                    charge: 'asc'
                }
            });
        });
    }
    static getLiveYoutubers() {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.default.youtuber.findMany({
                where: {
                    isLive: true
                }
            });
        });
    }
    static searchYoutubers(query) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.default.youtuber.findMany({
                where: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { channelName: { contains: query, mode: 'insensitive' } }
                        // { channelLink: { contains: query, mode: 'insensitive' } }
                    ]
                }
            });
        });
    }
    static verifyBankingDetails(youtuberId) {
        return __awaiter(this, void 0, void 0, function* () {
            const youtuber = yield database_1.default.youtuber.findUnique({
                where: { id: youtuberId },
                select: {
                    bankName: true,
                    accountNumber: true,
                    ifscCode: true,
                    panCard: true
                }
            });
            return !!((youtuber === null || youtuber === void 0 ? void 0 : youtuber.bankName) && (youtuber === null || youtuber === void 0 ? void 0 : youtuber.accountNumber) &&
                (youtuber === null || youtuber === void 0 ? void 0 : youtuber.ifscCode) && (youtuber === null || youtuber === void 0 ? void 0 : youtuber.panCard));
        });
    }
    static updateSettings(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.default.youtuber.update({
                where: { id },
                data
            });
        });
    }
    static calculateYouTubeAdCost(averageViews) {
        return youtubeAdCostCalculator_1.YoutubeAdCostCalculator.calculateSingleAdCost(averageViews);
    }
}
exports.YoutuberService = YoutuberService;
