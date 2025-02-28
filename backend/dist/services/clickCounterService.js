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
exports.ClickCounterService = void 0;
// src/services/clickCounterService.ts
const database_1 = __importDefault(require("../config/database"));
class ClickCounterService {
    static extractUrls(message) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return message.match(urlRegex) || [];
    }
    static storeChatMessage(youtuberId, channelId, liveChatId, messageId, redirectId, // Add redirectId parameter
    messageText, originalMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            const urls = this.extractUrls(originalMessage);
            yield database_1.default.chatMessage.create({
                data: {
                    youtuberId,
                    channelId,
                    liveChatId,
                    messageId,
                    redirectId, // Store redirectId
                    messageText,
                    url: urls.length > 0 ? urls[0] : null,
                },
            });
        });
    }
    static updateClickCount(messageId, clicks) {
        return __awaiter(this, void 0, void 0, function* () {
            yield database_1.default.chatMessage.update({
                where: { messageId },
                data: { clicks },
            });
        });
    }
    static getClickCount(messageId) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = yield database_1.default.chatMessage.findUnique({
                where: { messageId },
            });
            return message ? message.clicks : 0;
        });
    }
    static incrementClickAndGetUrl(redirectId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const message = yield database_1.default.chatMessage.update({
                    where: { redirectId }, // Use redirectId instead of messageId
                    data: { clicks: { increment: 1 } },
                });
                return message.url;
            }
            catch (error) {
                console.error('Error incrementing click count:', error);
                return null;
            }
        });
    }
}
exports.ClickCounterService = ClickCounterService;
