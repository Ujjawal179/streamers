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
exports.CompanyController = void 0;
const companyService_1 = require("../services/companyService");
const VideoQueueService_1 = require("../services/VideoQueueService");
const paymentService_1 = require("../services/paymentService");
const ApiError_1 = require("../utils/ApiError");
class CompanyController {
    // P2P direct video upload
    static uploadVideoToYoutuber(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { url } = req.body;
                const { youtuberId } = req.params;
                const companyId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.companyId;
                if (!companyId) {
                    throw new ApiError_1.ApiError(401, 'Company authentication required');
                }
                // Verify YouTuber
                const youtuber = yield companyService_1.CompanyService.getYoutuber(youtuberId);
                if (!(youtuber === null || youtuber === void 0 ? void 0 : youtuber.isLive)) {
                    throw new ApiError_1.ApiError(404, 'YouTuber is not available');
                }
                // Create payment
                const payment = yield paymentService_1.PaymentService.createPayment({
                    companyId,
                    youtuberId,
                    amount: youtuber.charge || 0,
                    playsNeeded: 1
                });
                // Add to queue
                yield VideoQueueService_1.VideoQueueService.addToYoutuberQueue(youtuberId, {
                    url,
                    paymentId: payment.id,
                    playNumber: 1,
                    totalPlays: 1
                });
                res.json({
                    success: true,
                    data: { payment }
                });
            }
            catch (error) {
                if (error instanceof ApiError_1.ApiError) {
                    res.status(error.statusCode).json({ success: false, error: error.message });
                }
                else {
                    res.status(500).json({ success: false, error: 'Failed to upload video' });
                }
            }
        });
    }
    // Get list of available YouTubers
    static getYoutubers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { requiredViews } = req.query;
                const youtubers = yield companyService_1.CompanyService.getYoutubers(requiredViews ? Number(requiredViews) : undefined);
                res.json({ success: true, data: youtubers });
            }
            catch (error) {
                res.status(500).json({ success: false, error: 'Failed to fetch YouTubers' });
            }
        });
    }
    // Company profile management
    static updateCompany(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const companyId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.companyId;
                if (!companyId) {
                    throw new ApiError_1.ApiError(401, 'Company authentication required');
                }
                const company = yield companyService_1.CompanyService.updateCompany(companyId, req.body);
                res.json({ success: true, data: company });
            }
            catch (error) {
                if (error instanceof ApiError_1.ApiError) {
                    res.status(error.statusCode).json({ success: false, error: error.message });
                }
                else {
                    res.status(500).json({ success: false, error: 'Failed to update company' });
                }
            }
        });
    }
    static deleteCompany(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const companyId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.companyId;
                if (!companyId) {
                    throw new ApiError_1.ApiError(401, 'Company authentication required');
                }
                yield companyService_1.CompanyService.deleteCompany(companyId);
                res.json({ success: true, message: 'Company deleted successfully' });
            }
            catch (error) {
                if (error instanceof ApiError_1.ApiError) {
                    res.status(error.statusCode).json({ success: false, error: error.message });
                }
                else {
                    res.status(500).json({ success: false, error: 'Failed to delete company' });
                }
            }
        });
    }
}
exports.CompanyController = CompanyController;
