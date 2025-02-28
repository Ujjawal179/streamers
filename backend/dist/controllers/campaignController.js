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
exports.getYoutuberEstimate = exports.createCampaignByViews = exports.CampaignController = void 0;
const companyService_1 = require("../services/companyService");
const campaignService_1 = require("../services/campaignService");
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
class CampaignController {
    // Calculate campaign costs and YouTuber distribution
    static calculateCampaign(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { requiredViews, budget } = req.body;
                const result = yield companyService_1.CompanyService.calculateCampaignYoutubers(Number(requiredViews), Number(budget));
                res.json({ success: true, data: result });
            }
            catch (error) {
                res.status(500).json({ success: false, error: 'Campaign calculation failed' });
            }
        });
    }
    // Create new campaign with multiple YouTubers
    static createCampaign(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, description, budget, targetViews, selectedYoutubers, companyId, videoUrl } = req.body;
                if (!videoUrl) {
                    throw new ApiError_1.ApiError(400, 'Video URL is required');
                }
                if (!companyId) {
                    throw new ApiError_1.ApiError(400, 'Company ID is required');
                }
                // Validate selected youtubers
                if (!selectedYoutubers || !Array.isArray(selectedYoutubers)) {
                    throw new ApiError_1.ApiError(400, 'Selected youtubers are required');
                }
                const result = yield campaignService_1.CampaignService.createCampaignWithVideo({
                    name,
                    description,
                    budget: Number(budget),
                    targetViews: Number(targetViews),
                    companyId,
                    videoUrl,
                    youtubers: selectedYoutubers
                });
                res.json({ success: true, data: result });
            }
            catch (error) {
                console.log(error);
                if (error instanceof ApiError_1.ApiError) {
                    res.status(error.statusCode).json({
                        success: false,
                        error: error.message
                    });
                }
                else {
                    res.status(500).json({
                        success: false,
                        error: 'Failed to create campaign'
                    });
                }
            }
        });
    }
    static createSingleYoutuberCampaign(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, description, youtuberId, videoUrl, playsNeeded, companyId, brandLink } = req.body;
                if (!videoUrl || !youtuberId) {
                    throw new ApiError_1.ApiError(400, 'Video URL and YouTuber ID are required');
                }
                const result = yield campaignService_1.CampaignService.createSingleYoutuberCampaign({
                    name,
                    youtuberId,
                    description,
                    companyId,
                    playsNeeded: Number(playsNeeded),
                    brandLink,
                    videoUrl // Now this matches the interface
                });
                res.json({ success: true, data: result });
            }
            catch (error) {
                if (error instanceof ApiError_1.ApiError) {
                    res.status(error.statusCode).json({ success: false, error: error.message });
                }
                else {
                    res.status(500).json({ success: false, error: 'Failed to create campaign' });
                }
            }
        });
    }
    static getCampaigns(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const companyId = req.params.id;
            console.log('Company ID:', companyId);
            try {
                const campaigns = yield campaignService_1.CampaignService.getCampaignsByCompany(companyId);
                res.json({
                    success: true,
                    data: campaigns
                });
            }
            catch (error) {
                console.log(error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to fetch campaigns'
                });
            }
        });
    }
    static updateCampaign(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { status } = req.body;
            try {
                const updatedCampaign = yield campaignService_1.CampaignService.updateCampaignStatus(id, status);
                res.json(updatedCampaign);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to update campaign' });
            }
        });
    }
    static deleteCampaign(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                yield campaignService_1.CampaignService.deleteCampaign(id);
                res.json({ message: 'Campaign deleted successfully' });
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to delete campaign' });
            }
        });
    }
    static getAllCampaigns(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const campaigns = yield campaignService_1.CampaignService.getAllCampaigns();
                res.json(campaigns);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to fetch campaigns' });
            }
        });
    }
    static getCampaign(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                const campaign = yield campaignService_1.CampaignService.getCampaignById(id);
                if (!campaign) {
                    return res.status(404).json({ error: 'Campaign not found' });
                }
                res.json(campaign);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to fetch campaign' });
            }
        });
    }
    // Get campaign analytics
    static getCampaignAnalytics(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { campaignId } = req.params;
                const analytics = yield campaignService_1.CampaignService.getCampaignAnalytics(campaignId);
                res.json({ success: true, data: analytics });
            }
            catch (error) {
                res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
            }
        });
    }
    // Add these methods to the controller class
    static getOptimalYoutubers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { targetViews } = req.body;
                if (!targetViews || targetViews <= 0) {
                    return res.status(400).json({ success: false, error: 'Valid target views required' });
                }
                const estimate = yield campaignService_1.CampaignService.findOptimalYoutuberCombination(targetViews);
                res.json({ success: true, data: estimate });
            }
            catch (error) {
                if (error instanceof ApiError_1.ApiError) {
                    res.status(error.statusCode).json({ success: false, error: error.message });
                }
                else {
                    res.status(500).json({ success: false, error: 'Failed to estimate campaign' });
                }
            }
        });
    }
    static createOptimalCampaign(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, description, targetViews, companyId, videoUrl } = req.body;
                // Validate required fields
                if (!name || !targetViews || !companyId || !videoUrl) {
                    return res.status(400).json({ success: false, error: 'Missing required fields' });
                }
                if (targetViews <= 0) {
                    return res.status(400).json({ success: false, error: 'Target views must be greater than 0' });
                }
                // Changed to call the correct method
                const result = yield campaignService_1.CampaignService.createCampaignByViews({
                    name,
                    description,
                    targetViews,
                    companyId,
                    videoUrl,
                });
                res.json({ success: true, data: result });
            }
            catch (error) {
                console.log(error);
                if (error instanceof ApiError_1.ApiError) {
                    res.status(error.statusCode).json({ success: false, error: error.message });
                }
                else {
                    res.status(500).json({
                        success: false,
                        error: 'Failed to create campaign',
                        details: error.message
                    });
                }
            }
        });
    }
}
exports.CampaignController = CampaignController;
// Create campaign by views
const createCampaignByViews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, targetViews, companyId, videoUrl, brandLink } = req.body;
        // Validate required fields
        if (!name || !targetViews || !companyId || !videoUrl) {
            throw new ApiError_1.ApiError(400, 'Missing required fields');
        }
        if (targetViews <= 0) {
            throw new ApiError_1.ApiError(400, 'Target views must be greater than 0');
        }
        const result = yield campaignService_1.CampaignService.createCampaignByViews({
            name,
            description,
            targetViews,
            companyId,
            videoUrl,
            brandLink
        });
        return res.json(new ApiResponse_1.ApiResponse(201, result, 'Campaign created successfully with optimal youtuber selection'));
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});
exports.createCampaignByViews = createCampaignByViews;
// Optional: Function to get an estimate before creating the campaign
const getYoutuberEstimate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { targetViews } = req.body;
        if (!targetViews || targetViews <= 0) {
            throw new ApiError_1.ApiError(400, 'Valid target views required');
        }
        const estimate = yield campaignService_1.CampaignService.findOptimalYoutuberCombination(targetViews);
        return res.json(new ApiResponse_1.ApiResponse(200, estimate, 'Estimated campaign cost and youtuber selection'));
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});
exports.getYoutuberEstimate = getYoutuberEstimate;
