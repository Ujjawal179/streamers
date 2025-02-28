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
exports.VideoQueueService = void 0;
const redis_1 = require("../config/redis");
class VideoQueueService {
    static addToYoutuberQueue(youtuberId, video, scheduledTime) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `youtuber:${youtuberId}:videos`;
            return (0, redis_1.addToQueue)(key, Object.assign(Object.assign({}, video), { uploadedAt: new Date().toISOString(), sequence: {
                    current: video.playNumber,
                    total: video.totalPlays
                } }), scheduledTime);
        });
    }
    static getNextVideo(youtuberId) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `youtuber:${youtuberId}:videos`;
            return (0, redis_1.getNextFromQueue)(key);
        });
    }
    static removeVideo(youtuberId) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `youtuber:${youtuberId}:videos`;
            return (0, redis_1.removeFromQueue)(key);
        });
    }
    static getQueueStatus(youtuberId) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `youtuber:${youtuberId}:videos`;
            const queueLength = yield this.getQueueLength(key);
            const nextVideo = yield this.getNextVideo(youtuberId);
            return {
                queueLength,
                nextVideo,
                estimatedWaitTime: queueLength * 15 // 15 seconds per video
            };
        });
    }
    static clearQueue(youtuberId) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `youtuber:${youtuberId}:videos`;
            const client = yield (0, redis_1.getRedisClient)();
            yield client.del(key);
        });
    }
    static getQueueLength(youtuberId) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `youtuber:${youtuberId}:videos`;
            return (0, redis_1.getQueueLength)(key);
        });
    }
    static removeCurrentVideo(youtuberId) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `youtuber:${youtuberId}:videos`;
            // Get the video first
            const video = yield this.getNextVideo(youtuberId);
            if (!video)
                return null;
            // Remove it from queue
            yield (0, redis_1.removeFromQueue)(key);
            return video;
        });
    }
    static uploadVideoToYoutuberWithPlays(youtuberId, videoData, playsNeeded) {
        return __awaiter(this, void 0, void 0, function* () {
            const uploads = [];
            for (let i = 0; i < playsNeeded; i++) {
                uploads.push(this.addToYoutuberQueue(youtuberId, Object.assign(Object.assign({}, videoData), { playNumber: i + 1, totalPlays: playsNeeded, sequence: { current: i + 1, total: playsNeeded }, uploadedAt: new Date().toISOString() })));
            }
            return Promise.all(uploads);
        });
    }
}
exports.VideoQueueService = VideoQueueService;
