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
exports.P2PService = void 0;
const database_1 = __importDefault(require("../config/database"));
const VideoQueueService_1 = require("./VideoQueueService");
const scheduleService_1 = require("./scheduleService");
class P2PService {
    static createDirectUpload(companyId, youtuberId, videoData, scheduledTime) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Validate YouTuber availability
            const youtuber = yield database_1.default.youtuber.findUnique({
                where: { id: youtuberId, isLive: true }
            });
            if (!youtuber)
                throw new Error('YouTuber not available');
            // 2. Validate schedule if provided
            if (scheduledTime) {
                const slot = yield scheduleService_1.ScheduleService.validateScheduleSlot(youtuberId, scheduledTime);
                if (!slot.valid)
                    throw new Error(`Invalid slot: ${slot.reason}`);
            }
            // 3. Create payment record
            const payment = yield database_1.default.payment.create({
                data: {
                    companyId,
                    youtuberId,
                    amount: youtuber.charge || 0,
                    status: 'PENDING',
                    paymentId: `pay_${Date.now()}`,
                    orderId: `order_${Date.now()}`,
                    playsNeeded: 1,
                    earnings: 0,
                    platformFee: 0
                }
            });
            // 4. Add to queue
            yield VideoQueueService_1.VideoQueueService.addToYoutuberQueue(youtuberId, Object.assign(Object.assign({}, videoData), { paymentId: payment.id, playNumber: 1, totalPlays: 1 }), scheduledTime === null || scheduledTime === void 0 ? void 0 : scheduledTime.getTime());
            return { payment, videoData };
        });
    }
}
exports.P2PService = P2PService;
