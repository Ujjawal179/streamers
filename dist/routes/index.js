"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const donationRoutes_1 = __importDefault(require("./donationRoutes"));
const campaignRoutes_1 = __importDefault(require("./campaignRoutes"));
const companyRoutes_1 = __importDefault(require("./companyRoutes"));
const schedulerRoutes_1 = __importDefault(require("./schedulerRoutes"));
const router = (0, express_1.Router)();
router.use('/donations', donationRoutes_1.default);
router.use('/campaigns', campaignRoutes_1.default);
router.use('/companies', companyRoutes_1.default);
router.use('/scheduler', schedulerRoutes_1.default);
exports.default = router;
