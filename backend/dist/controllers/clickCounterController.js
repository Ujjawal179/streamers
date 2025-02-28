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
exports.ClickCounterController = void 0;
const clickCounterService_1 = require("../services/clickCounterService");
class ClickCounterController {
    static updateClickCount(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { messageId, clicks } = req.body;
            if (!messageId || clicks === undefined) {
                return res.status(400).json({
                    success: false,
                    error: 'messageId and clicks are required',
                });
            }
            try {
                yield clickCounterService_1.ClickCounterService.updateClickCount(messageId, clicks);
                return res.status(200).json({
                    success: true,
                    message: 'Click count updated successfully',
                });
            }
            catch (error) {
                console.error('Update click count error:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to update click count',
                });
            }
        });
    }
    static getClickCount(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { messageId } = req.params;
            try {
                const clicks = yield clickCounterService_1.ClickCounterService.getClickCount(messageId);
                return res.status(200).json({
                    success: true,
                    data: { clicks },
                });
            }
            catch (error) {
                console.error('Get click count error:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch click count',
                });
            }
        });
    }
    static handleRedirect(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { redirectId } = req.params; // Change from messageId to redirectId
            try {
                const originalUrl = yield clickCounterService_1.ClickCounterService.incrementClickAndGetUrl(redirectId);
                if (!originalUrl) {
                    return res.status(404).json({
                        success: false,
                        error: 'No URL found for this redirect ID',
                    });
                }
                return res.redirect(originalUrl);
            }
            catch (error) {
                console.error('Redirect error:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to process redirect',
                });
            }
        });
    }
}
exports.ClickCounterController = ClickCounterController;
