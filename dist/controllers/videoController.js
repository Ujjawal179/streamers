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
exports.VideoController = void 0;
const companyService_1 = require("../services/companyService");
const VideoQueueService_1 = require("../services/VideoQueueService");
const youtuberController_1 = require("./youtuberController");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class VideoController {
    static uploadCampaignVideo(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { selectedYoutubers, videoData } = req.body;
                const result = yield companyService_1.CompanyService.uploadVideoToYoutubers(selectedYoutubers, videoData);
                res.json({ success: true, data: result });
            }
            catch (error) {
                res.status(500).json({ success: false, error: 'Failed to upload campaign video' });
            }
        });
    }
    static uploadDirectVideo(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { youtuberId } = req.params;
                const result = yield companyService_1.CompanyService.uploadVideoToYoutuber(youtuberId, req.body);
                res.json({ success: true, data: result });
            }
            catch (error) {
                res.status(500).json({ success: false, error: 'Failed to upload video' });
            }
        });
    }
    static getNextVideo(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { youtuberId } = req.params;
                const video = yield VideoQueueService_1.VideoQueueService.getNextVideo(youtuberId);
                res.json({ success: true, data: video });
            }
            catch (error) {
                res.status(500).json({ success: false, error: 'Failed to get next video' });
            }
        });
    }
    static getVideoByPin(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { youtuberId, pin } = req.params;
                // Get the video from the queue
                const video = yield companyService_1.CompanyService.getVideo(youtuberId, pin);
                // If there's a campaign ID in the video data, fetch the campaign message
                if (video && video.campaignId) {
                    try {
                        // Get campaign details
                        const campaign = yield prisma.campaign.findUnique({
                            where: { id: video.campaignId },
                            select: { description: true }
                        });
                        if (campaign) {
                            // Construct a promotional message using campaign data
                            const message = campaign.description || 'Thank you for watching!';
                            // Call updateViewerCount with the promotional message
                            const viewerCountReq = {
                                params: { id: youtuberId },
                                body: { message }
                            };
                            const viewerCountRes = {
                                statusCode: 200,
                                status: function (code) {
                                    this.statusCode = code;
                                    return this;
                                },
                                json: function (data) {
                                    return this;
                                }
                            };
                            // Process updating viewer count asynchronously, don't wait for it
                            youtuberController_1.YoutuberController.updateViewerCount(viewerCountReq, viewerCountRes)
                                .catch(err => console.error('Failed to update viewer count:', err));
                            // Add the message to the video response
                            video.message = message;
                        }
                    }
                    catch (error) {
                        console.error('Error processing campaign message:', error);
                        // Continue with the video delivery even if campaign processing fails
                    }
                }
                res.json({ success: true, data: video });
            }
            catch (error) {
                console.error('Failed to get video by pin:', error);
                res.status(500).json({ success: false, error: 'Failed to get video' });
            }
        });
    }
    static getQueueLength(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { youtuberId } = req.params;
                const length = yield VideoQueueService_1.VideoQueueService.getQueueLength(youtuberId);
                console.log(youtuberId, length);
                res.json({ success: true, data: length });
            }
            catch (error) {
                res.status(500).json({ success: false, error: 'Failed to get queue length' });
            }
        });
    }
    static removeCurrentVideo(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { youtuberId } = req.params;
                const removedVideo = yield VideoQueueService_1.VideoQueueService.removeCurrentVideo(youtuberId);
                if (!removedVideo) {
                    return res.status(404).json({
                        success: false,
                        message: 'No video found in queue'
                    });
                }
                res.json({
                    success: true,
                    message: 'Video removed successfully',
                    data: removedVideo
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'Failed to remove video from queue'
                });
            }
        });
    }
}
exports.VideoController = VideoController;
