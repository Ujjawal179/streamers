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
exports.NightbotController = void 0;
const nightbotService_1 = require("../services/nightbotService");
const db_1 = __importDefault(require("../db/db"));
class NightbotController {
    constructor() {
        this.nightbotService = new nightbotService_1.NightbotService();
    }
    updateViewerCount(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const channelId = req.params.id;
                const { message } = req.body;
                if (!channelId) {
                    return res.status(400).json({ error: 'Channel ID is required' });
                }
                // Fetch youtuberId based on channelId (assumes channelLink contains channelId)
                const youtuber = yield db_1.default.youtuber.findFirst({
                    where: {
                        channelLink: { has: channelId }, // Adjust if channelLink format differs
                    },
                    select: { id: true },
                });
                if (!youtuber) {
                    return res.status(404).json({ error: 'No youtuber found for this channel ID' });
                }
                const youtuberId = youtuber.id;
                const liveData = yield this.nightbotService.updateRealTimeViews(channelId);
                if (!liveData) {
                    return res.status(404).json({ error: 'No active live stream found' });
                }
                let messageId = null;
                if (message && liveData.liveChatId) {
                    // Pass all required parameters to sendStreamMessage
                    messageId = yield this.nightbotService.sendStreamMessage(liveData.liveChatId, message, channelId, youtuberId);
                }
                return res.status(200).json({
                    viewers: liveData.viewers,
                    messageId,
                    liveChatId: liveData.liveChatId,
                });
            }
            catch (error) {
                console.error('Controller error:', error);
                return res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
}
exports.NightbotController = NightbotController;
