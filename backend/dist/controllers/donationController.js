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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonationController = void 0;
const donationService_1 = require("../services/donationService");
const VideoQueueService_1 = require("../services/VideoQueueService");
const ApiError_1 = require("../utils/ApiError");
class DonationController {
    // Direct P2P donation to single YouTuber
    static createDonation(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { amount, message, videoUrl, youtuberId, campaignId } = req.body;
                const companyId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.companyId;
                if (!companyId) {
                    throw new ApiError_1.ApiError(400, 'Company ID is required');
                }
                const donation = yield donationService_1.DonationService.createDonation({
                    amount,
                    message,
                    videoUrl,
                    companyId,
                    youtuberId,
                    campaignId
                });
                // Add to YouTuber's queue
                yield VideoQueueService_1.VideoQueueService.addToYoutuberQueue(youtuberId, {
                    url: videoUrl,
                    donationId: donation.id,
                    playNumber: 1,
                    totalPlays: 1
                });
                res.json({ success: true, data: donation });
            }
            catch (error) {
                res.status(500).json({ success: false, error: 'Failed to create donation' });
            }
        });
    }
    // Get next donation from queue (for YouTuber's OBS)
    static getNextDonation(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { youtuberId } = req.params;
                const donation = yield donationService_1.DonationService.getNextDonation(youtuberId);
                res.json({ success: true, data: donation });
            }
            catch (error) {
                res.status(500).json({ success: false, error: 'Failed to fetch donation' });
            }
        });
    }
    static getDonationsByCampaign(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { campaignId } = req.params;
            try {
                const donations = yield donationService_1.DonationService.getDonationsByCampaign(campaignId);
                res.json(donations);
            }
            catch (error) {
                console.error('Error fetching campaign donations:', error);
                res.status(500).json({
                    message: 'Failed to fetch campaign donations',
                    error: error.message
                });
            }
        });
    }
    static updateDonationStatus(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { status } = req.body;
            try {
                if (!id || !status) {
                    return res.status(400).json({
                        success: false,
                        message: 'Missing required fields: id or status'
                    });
                }
                const updatedDonation = yield donationService_1.DonationService.updateDonationStatus(id, status);
                return res.status(200).json({
                    success: true,
                    data: updatedDonation
                });
            }
            catch (error) {
                console.error('Error updating donation status:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update donation status',
                    error: error.message
                });
            }
        });
    }
    static getYoutuberDonations(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { youtuberId } = req.params;
            try {
                if (!youtuberId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Missing youtuberId parameter'
                    });
                }
                const donations = yield donationService_1.DonationService.getYoutuberDonations(youtuberId);
                return res.status(200).json({
                    success: true,
                    data: donations
                });
            }
            catch (error) {
                console.error('Error fetching youtuber donations:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch youtuber donations',
                    error: error.message
                });
            }
        });
    }
}
exports.DonationController = DonationController;
