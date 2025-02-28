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
exports.startQueueWorker = void 0;
const cron_1 = require("cron");
const scheduleService_1 = require("../services/scheduleService");
const donationService_1 = require("../services/donationService");
const redis_1 = require("../config/redis");
// Checks every minute for pending donations
const startQueueWorker = () => {
    new cron_1.CronJob('* * * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const redis = (0, redis_1.getRedisClient)(); // This will throw if Redis isn't initialized
            const keys = yield redis.keys('youtuber:*:donations');
            for (const key of keys) {
                const [, youtuberId] = key.split(':');
                const nextDonation = yield donationService_1.DonationService.getNextDonation(youtuberId);
                if (nextDonation) {
                    yield scheduleService_1.ScheduleService.notifyQueueUpdate(youtuberId);
                }
            }
        }
        catch (error) {
            console.error('Queue worker error:', error);
        }
        // Processes queued donations
        // Notifies YouTubers of updates
    })).start();
    console.log('Queue worker started');
};
exports.startQueueWorker = startQueueWorker;
