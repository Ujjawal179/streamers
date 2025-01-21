import { Router } from 'express';
import donationRoutes from './donationRoutes';
import campaignRoutes from './campaignRoutes';
import companyRoutes from './companyRoutes';
import schedulerRoutes from './schedulerRoutes';

const router = Router();

router.use('/donations', donationRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/companies', companyRoutes);
router.use('/scheduler', schedulerRoutes);

export default router;
