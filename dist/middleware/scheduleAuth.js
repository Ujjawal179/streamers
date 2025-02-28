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
exports.scheduleAuth = exports.validateScheduleTime = exports.verifyYoutuberStatus = exports.verifyScheduleOwnership = void 0;
const database_1 = __importDefault(require("../config/database"));
const client_1 = require("@prisma/client");
const verifyScheduleOwnership = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { scheduleId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userType; // Now correctly accessing userType property
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        // Admin can access all schedules
        if (userRole === client_1.Role.ADMIN) { // Using enum from Prisma client
            const schedule = yield database_1.default.adSchedule.findUnique({
                where: { id: scheduleId }
            });
            if (!schedule) {
                return res.status(404).json({ error: 'Schedule not found' });
            }
            req.schedule = schedule;
            return next();
        }
        // For YouTubers, verify ownership
        const schedule = yield database_1.default.adSchedule.findFirst({
            where: {
                id: scheduleId,
                youtuber: {
                    userId
                }
            },
            include: {
                youtuber: {
                    select: {
                        id: true,
                        channelLink: true,
                        isLive: true
                    }
                }
            }
        });
        if (!schedule) {
            return res.status(403).json({ error: 'Unauthorized access to schedule' });
        }
        // Store schedule in request for use in route handlers
        req.schedule = schedule;
        next();
    }
    catch (error) {
        console.error('Schedule verification error:', error);
        res.status(500).json({ error: 'Failed to verify schedule ownership' });
    }
});
exports.verifyScheduleOwnership = verifyScheduleOwnership;
// Middleware to check if YouTuber is live before allowing schedule modifications
const verifyYoutuberStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { youtuberId } = req.params;
        const youtuber = yield database_1.default.youtuber.findFirst({
            where: {
                id: youtuberId,
                userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id
            }
        });
        if (!youtuber) {
            return res.status(403).json({ error: 'Unauthorized access' });
        }
        if (!youtuber.isLive) {
            return res.status(400).json({ error: 'YouTuber must be live to modify schedule' });
        }
        next();
    }
    catch (error) {
        console.error('YouTuber status verification error:', error);
        res.status(500).json({ error: 'Failed to verify YouTuber status' });
    }
});
exports.verifyYoutuberStatus = verifyYoutuberStatus;
// Middleware to validate schedule time slots
const validateScheduleTime = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startTime, endTime } = req.body;
        const { youtuberId } = req.params;
        // Basic time validation
        if (new Date(startTime) >= new Date(endTime)) {
            return res.status(400).json({ error: 'End time must be after start time' });
        }
        // Check for overlapping schedules
        const existingSchedule = yield database_1.default.adSchedule.findFirst({
            where: {
                youtuberId,
                OR: [
                    {
                        startTime: { lte: new Date(startTime) },
                        endTime: { gte: new Date(startTime) }
                    },
                    {
                        startTime: { lte: new Date(endTime) },
                        endTime: { gte: new Date(endTime) }
                    }
                ]
            }
        });
        if (existingSchedule) {
            return res.status(400).json({ error: 'Schedule overlaps with existing schedule' });
        }
        next();
    }
    catch (error) {
        console.error('Schedule time validation error:', error);
        res.status(500).json({ error: 'Failed to validate schedule time' });
    }
});
exports.validateScheduleTime = validateScheduleTime;
// Export all middleware functions
exports.scheduleAuth = {
    verifyScheduleOwnership: exports.verifyScheduleOwnership,
    verifyYoutuberStatus: exports.verifyYoutuberStatus,
    validateScheduleTime: exports.validateScheduleTime
};
