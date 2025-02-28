"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const companyController_1 = require("../controllers/companyController");
const campaignRoutes_1 = __importDefault(require("./campaignRoutes"));
const router = (0, express_1.Router)();
// Company profile routes
router.use(auth_1.authenticateCompany); // Apply to all routes
router.get('/profile', companyController_1.CompanyController.getYoutubers);
router.patch('/profile', companyController_1.CompanyController.updateCompany);
router.delete('/profile', companyController_1.CompanyController.deleteCompany);
router.post('/video/:youtuberId', companyController_1.CompanyController.uploadVideoToYoutuber);
router.get('/youtubers', companyController_1.CompanyController.getYoutubers);
// Campaign routes
router.use('/campaigns', campaignRoutes_1.default);
exports.default = router;
