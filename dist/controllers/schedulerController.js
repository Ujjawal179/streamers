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
exports.SchedulerController = void 0;
const scheduleService_1 = require("../services/scheduleService");
class SchedulerController {
    static createSchedule(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { youtuberId } = req.params;
            const { startTime, endTime, maxAdsPerHour } = req.body;
            try {
                const schedule = yield scheduleService_1.ScheduleService.createSchedule(youtuberId, {
                    startTime: new Date(startTime),
                    endTime: new Date(endTime),
                    maxAdsPerHour
                });
                res.json(schedule);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    static getYoutuberSchedule(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { youtuberId } = req.params;
            try {
                const schedule = yield scheduleService_1.ScheduleService.getYoutuberSchedule(youtuberId);
                res.json(schedule);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    static getQueueStatus(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { youtuberId } = req.params;
            try {
                const queueStatus = yield scheduleService_1.ScheduleService.getYoutuberQueue(youtuberId);
                res.json(queueStatus);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    static scheduleDonation(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { donationId } = req.params;
            const { scheduledTime } = req.body;
            try {
                const donation = yield scheduleService_1.ScheduleService.scheduleDonation(donationId, new Date(scheduledTime));
                res.json(donation);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    static getAvailableSlots(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { youtuberId } = req.params;
            const { date } = req.query;
            try {
                const slots = yield scheduleService_1.ScheduleService.getAvailableSlots(youtuberId, new Date(date));
                res.json(slots);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    static updateSchedule(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { scheduleId } = req.params;
            const { startTime, endTime, maxAdsPerHour } = req.body;
            try {
                const updatedSchedule = yield scheduleService_1.ScheduleService.updateSchedule(scheduleId, {
                    startTime: startTime ? new Date(startTime) : undefined,
                    endTime: endTime ? new Date(endTime) : undefined,
                    maxAdsPerHour
                });
                res.json(updatedSchedule);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    static deleteSchedule(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { scheduleId } = req.params;
            try {
                yield scheduleService_1.ScheduleService.deleteSchedule(scheduleId);
                res.json({ message: 'Schedule deleted successfully' });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    static checkScheduleConflicts(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { youtuberId } = req.params;
            const { startTime, endTime } = req.body;
            try {
                const hasConflicts = yield scheduleService_1.ScheduleService.checkScheduleConflicts(youtuberId, new Date(startTime), new Date(endTime));
                res.json({
                    hasConflicts,
                    message: hasConflicts ? 'Schedule conflicts found' : 'No conflicts found'
                });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
}
exports.SchedulerController = SchedulerController;
