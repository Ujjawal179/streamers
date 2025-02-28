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
exports.ScheduleService = void 0;
const database_1 = __importDefault(require("../config/database"));
const redis_1 = require("../config/redis");
const socket_1 = require("../config/socket");
const index_1 = require("../index");
class ScheduleService {
    static createSchedule(youtuberId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.default.adSchedule.create({
                data: Object.assign({ youtuberId }, data)
            });
        });
    }
    static notifyQueueUpdate(youtuberId) {
        return __awaiter(this, void 0, void 0, function* () {
            const queueStatus = yield this.getYoutuberQueue(youtuberId);
            if (index_1.io) {
                (0, socket_1.emitQueueUpdate)(index_1.io, youtuberId, queueStatus);
            }
        });
    }
    static scheduleDonation(donationId, scheduledTime) {
        return __awaiter(this, void 0, void 0, function* () {
            const donation = yield database_1.default.donation.update({
                where: { id: donationId },
                data: {
                    scheduledFor: scheduledTime,
                    status: 'SCHEDULED'
                }
            });
            yield (0, redis_1.addToQueue)(`youtuber:${donation.youtuberId}:donations`, donation, scheduledTime.getTime());
            yield this.notifyQueueUpdate(donation.youtuberId);
            return donation;
        });
    }
    static getYoutuberQueue(youtuberId) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = `youtuber:${youtuberId}:donations`;
            const queueLength = yield (0, redis_1.getQueueLength)(key);
            const items = yield (0, redis_1.getQueueItems)(key, 0, 9); // Get first 10 items
            return {
                totalItems: queueLength,
                nextItems: items,
                estimatedDuration: queueLength * 15 // 15 seconds per ad
            };
        });
    }
    static getYoutuberSchedule(youtuberId) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.default.adSchedule.findMany({
                where: { youtuberId }
            });
        });
    }
    static validateScheduleSlot(youtuberId, proposedTime) {
        return __awaiter(this, void 0, void 0, function* () {
            const schedule = yield database_1.default.adSchedule.findFirst({
                where: {
                    youtuberId,
                    startTime: { lte: proposedTime },
                    endTime: { gte: proposedTime }
                }
            });
            if (!schedule) {
                return { valid: false, reason: 'No schedule found for this time' };
            }
            const hourStart = new Date(proposedTime);
            hourStart.setMinutes(0, 0, 0);
            const adsInHour = yield database_1.default.donation.count({
                where: {
                    youtuberId,
                    scheduledFor: {
                        gte: hourStart,
                        lt: new Date(hourStart.getTime() + 3600000)
                    }
                }
            });
            return {
                valid: adsInHour < schedule.maxAdsPerHour,
                reason: adsInHour >= schedule.maxAdsPerHour ? 'Hour slot full' : null,
                availableSlots: schedule.maxAdsPerHour - adsInHour
            };
        });
    }
    static getAvailableSlots(youtuberId, date) {
        return __awaiter(this, void 0, void 0, function* () {
            const schedule = yield database_1.default.adSchedule.findFirst({
                where: {
                    youtuberId,
                    startTime: { lte: date },
                    endTime: { gte: date }
                }
            });
            if (!schedule) {
                return {
                    available: false,
                    message: 'No schedule found for this date'
                };
            }
            // Get all scheduled donations for the given day
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            const scheduledDonations = yield database_1.default.donation.findMany({
                where: {
                    youtuberId,
                    scheduledFor: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                orderBy: {
                    scheduledFor: 'asc'
                }
            });
            // Generate available slots
            const slots = [];
            const slotDuration = 15 * 60 * 1000; // 15 minutes in milliseconds
            let currentTime = Math.max(schedule.startTime.getTime(), startOfDay.getTime());
            const scheduleEnd = Math.min(schedule.endTime.getTime(), endOfDay.getTime());
            while (currentTime < scheduleEnd) {
                const slotTime = new Date(currentTime);
                const hourStart = new Date(slotTime);
                hourStart.setMinutes(0, 0, 0);
                // Count ads in this hour
                const adsInHour = scheduledDonations.filter(d => d.scheduledFor >= hourStart &&
                    d.scheduledFor < new Date(hourStart.getTime() + 3600000)).length;
                if (adsInHour < schedule.maxAdsPerHour) {
                    slots.push({
                        time: slotTime,
                        available: true
                    });
                }
                currentTime += slotDuration;
            }
            return {
                available: slots.length > 0,
                schedule,
                slots
            };
        });
    }
    static updateSchedule(scheduleId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.default.adSchedule.update({
                where: { id: scheduleId },
                data
            });
        });
    }
    static deleteSchedule(scheduleId) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.default.adSchedule.delete({
                where: { id: scheduleId }
            });
        });
    }
    static checkScheduleConflicts(youtuberId, startTime, endTime) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingSchedules = yield database_1.default.adSchedule.findMany({
                where: {
                    youtuberId,
                    OR: [
                        {
                            startTime: { lte: startTime },
                            endTime: { gte: startTime }
                        },
                        {
                            startTime: { lte: endTime },
                            endTime: { gte: endTime }
                        }
                    ]
                }
            });
            return existingSchedules.length > 0;
        });
    }
}
exports.ScheduleService = ScheduleService;
