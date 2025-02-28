"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const campaignController_1 = require("../controllers/campaignController");
const router = (0, express_1.Router)();
router.post('/calculate', campaignController_1.CampaignController.calculateCampaign);
router.post('/create', campaignController_1.CampaignController.createCampaign);
router.get('/getall/:id', campaignController_1.CampaignController.getCampaigns);
router.get('/:id', campaignController_1.CampaignController.getCampaign);
router.get('/:id/analytics', campaignController_1.CampaignController.getCampaignAnalytics);
router.patch('/:id', campaignController_1.CampaignController.updateCampaign);
router.delete('/:id', campaignController_1.CampaignController.deleteCampaign);
router.post('/single-youtuber', campaignController_1.CampaignController.createSingleYoutuberCampaign); // Updated route name
router.post('/optimal-estimate', campaignController_1.CampaignController.getOptimalYoutubers);
router.post('/create-optimal', campaignController_1.CampaignController.createOptimalCampaign);
exports.default = router;
