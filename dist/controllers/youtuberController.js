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
exports.YoutuberController = void 0;
const db_1 = __importDefault(require("../db/db"));
const youtuberService_1 = require("../services/youtuberService");
const nightbotService_1 = require("../services/nightbotService");
class YoutuberController {
    static updateYoutuber(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const updateData = req.body;
                if (!id) {
                    return res.status(400).json({
                        success: false,
                        error: 'No id provided'
                    });
                }
                if (updateData.timeout !== undefined) {
                    updateData.timeout = Number(updateData.timeout);
                }
                if (updateData.charge !== undefined) {
                    updateData.charge = Number(updateData.charge);
                }
                const youtuber = yield db_1.default.youtuber.update({
                    where: { id },
                    data: updateData
                });
                return res.status(200).json({
                    success: true,
                    data: youtuber
                });
            }
            catch (error) {
                console.error('Update youtuber error:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to update youtuber'
                });
            }
        });
    }
    static getUsername(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const youtuber = yield db_1.default.youtuber.findUnique({
                    where: { id },
                    select: {
                        name: true,
                        channelLink: true,
                        charge: true,
                        isLive: true,
                        timeout: true
                    }
                });
                if (!youtuber) {
                    return res.status(404).json({
                        success: false,
                        error: 'Youtuber not found'
                    });
                }
                return res.status(200).json({
                    success: true,
                    data: {
                        username: youtuber.name || youtuber.channelLink[0],
                        charge: youtuber.charge,
                        isLive: youtuber.isLive,
                        timeout: youtuber.timeout || 30
                    }
                });
            }
            catch (error) {
                console.error('Get username error:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch username'
                });
            }
        });
    }
    static updateViewerCount(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { id } = req.params; // youtuberId
                const { message } = req.body;
                if (!id) {
                    return res.status(400).json({ success: false, error: 'Youtuber ID is required' });
                }
                const youtuber = yield db_1.default.youtuber.findUnique({
                    where: { id },
                    select: { channelLink: true },
                });
                if (!youtuber || !((_a = youtuber.channelLink) === null || _a === void 0 ? void 0 : _a.length)) {
                    return res.status(404).json({ success: false, error: 'Youtuber or channel Link not found' });
                }
                const channelLink = youtuber.channelLink[0];
                console.log('channellink:', channelLink);
                const channelId = yield YoutuberController.nightbotService.getChannelIdByUsername(channelLink);
                console.log('channelId:', channelId);
                if (!channelId) {
                    return res.status(400).json({ success: false, error: 'Could not derive channel ID from channel link' });
                }
                const liveData = yield YoutuberController.nightbotService.updateRealTimeViews(channelId);
                let viewers;
                if (!liveData) {
                    const averageViews = yield YoutuberController.nightbotService.calculateAverageViews(channelId);
                    if (averageViews === null) {
                        return res.status(500).json({ success: false, error: 'Failed to calculate average views' });
                    }
                    viewers = Math.round(averageViews);
                    yield youtuberService_1.YoutuberService.updateLiveStatus(id, false);
                }
                else {
                    viewers = Number(liveData.viewers) || 0;
                    yield youtuberService_1.YoutuberService.updateLiveStatus(id, true);
                }
                const updatedYoutuber = yield youtuberService_1.YoutuberService.updateYoutuber(id, {
                    isLive: liveData ? true : false,
                    averageViews: viewers,
                    charge: youtuberService_1.YoutuberService.calculateYouTubeAdCost(viewers),
                });
                let messageId = null;
                if (message && liveData && liveData.liveChatId) {
                    messageId = yield YoutuberController.nightbotService.sendStreamMessage(liveData.liveChatId, message, channelId, id);
                }
                return res.status(200).json({
                    success: true,
                    data: {
                        viewers: viewers.toString(),
                        messageId,
                        liveChatId: liveData ? liveData.liveChatId : null,
                        youtuber: updatedYoutuber,
                    },
                });
            }
            catch (error) {
                console.error('Update viewer count error:', error);
                return res.status(500).json({ success: false, error: 'Internal server error' });
            }
        });
    }
    static getYoutuberDetails(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const youtuber = yield db_1.default.youtuber.findUnique({
                    where: { id },
                    select: {
                        id: true,
                        name: true,
                        channelLink: true,
                        timeout: true,
                        charge: true,
                        isLive: true,
                        alertBoxUrl: true,
                        averageViews: true,
                        avatar: true,
                        description: true,
                    }
                });
                if (!youtuber) {
                    return res.status(404).json({
                        success: false,
                        error: 'Youtuber not found'
                    });
                }
                return res.status(200).json({
                    success: true,
                    data: youtuber
                });
            }
            catch (error) {
                console.error('Get youtuber details error:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch youtuber details'
                });
            }
        });
    }
    static updateSettings(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const { timeout, charge, name, channelLink, phoneNumber, alertBoxUrl } = req.body;
                const youtuber = yield youtuberService_1.YoutuberService.updateSettings(id, {
                    timeout: timeout ? Number(timeout) : undefined,
                    charge: charge ? Number(charge) : undefined,
                    name,
                    channelLink,
                    phoneNumber,
                    alertBoxUrl
                });
                return res.status(200).json({
                    success: true,
                    data: youtuber
                });
            }
            catch (error) {
                console.error('Update settings error:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to update settings'
                });
            }
        });
    }
    static getYoutuberCampaigns(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const campaigns = yield db_1.default.campaign.findMany({
                    where: {
                        youtubers: {
                            some: { id }
                        }
                    }
                });
                return res.status(200).json({
                    success: true,
                    data: campaigns
                });
            }
            catch (error) {
                console.error('Get campaigns error:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch campaigns'
                });
            }
        });
    }
    static updatePayoutDetails(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { youtuberId } = req.params;
                const bankingDetails = req.body;
                const youtuber = yield youtuberService_1.YoutuberService.updatePayoutDetails(youtuberId, bankingDetails);
                return res.status(200).json({
                    success: true,
                    data: youtuber
                });
            }
            catch (error) {
                console.error('Update payout details error:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message || 'Failed to update payout details'
                });
            }
        });
    }
    static deleteYoutuber(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const youtuber = yield db_1.default.youtuber.findUnique({
                    where: { id },
                    select: { userId: true }
                });
                if (!youtuber) {
                    return res.status(404).json({
                        success: false,
                        error: 'Youtuber not found'
                    });
                }
                // Only delete youtuber profile data, keep transactions
                yield db_1.default.youtuber.update({
                    where: { id },
                    data: {
                        name: null,
                        email: null,
                        channelLink: [],
                        phoneNumber: null,
                        bankName: null,
                        accountNumber: null,
                        ifscCode: null,
                        panCard: null,
                        upiId: null,
                        avatar: null,
                        description: null,
                        address: null,
                        vat: null,
                        country: null,
                        city: null,
                        zip: null
                    }
                });
                // Deactivate user account
                yield db_1.default.user.update({
                    where: { id: youtuber.userId },
                    data: {
                        email: `deleted_${Date.now()}_${youtuber.userId}@deleted.com`,
                        password: 'DELETED_ACCOUNT'
                    }
                });
                return res.status(200).json({
                    success: true,
                    message: 'Youtuber data deleted successfully'
                });
            }
            catch (error) {
                console.error('Delete youtuber error:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to delete youtuber data'
                });
            }
        });
    }
}
exports.YoutuberController = YoutuberController;
YoutuberController.youtuberService = new youtuberService_1.YoutuberService();
YoutuberController.nightbotService = new nightbotService_1.NightbotService();
