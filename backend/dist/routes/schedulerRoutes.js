"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const schedulerController_1 = require("../controllers/schedulerController");
const router = (0, express_1.Router)();
// Type-safe handler wrapper
const handler = (fn) => {
    return (req, res, next) => {
        fn(req, res).catch(next);
    };
};
router.post('/schedule', auth_1.authenticateYoutuber, handler(schedulerController_1.SchedulerController.createSchedule));
router.patch('/schedule/:id', auth_1.authenticateYoutuber, handler(schedulerController_1.SchedulerController.updateSchedule));
router.delete('/schedule/:id', auth_1.authenticateYoutuber, handler(schedulerController_1.SchedulerController.deleteSchedule));
exports.default = router;
