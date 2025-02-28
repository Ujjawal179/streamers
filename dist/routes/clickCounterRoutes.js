"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/clickCounterRoutes.ts
// src/routes/clickCounterRoutes.ts
const express_1 = __importDefault(require("express"));
const clickCounterController_1 = require("../controllers/clickCounterController");
const router = express_1.default.Router();
router.post('/updateClicks', clickCounterController_1.ClickCounterController.updateClickCount);
router.get('/clicks/:messageId', clickCounterController_1.ClickCounterController.getClickCount);
router.get('/r/:redirectId', clickCounterController_1.ClickCounterController.handleRedirect); // Change to redirectId
exports.default = router;
