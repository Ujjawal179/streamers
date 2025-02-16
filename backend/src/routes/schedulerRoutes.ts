import { Router } from 'express';
import { authenticateYoutuber, AuthenticatedRequest } from '../middleware/auth';
import { SchedulerController } from '../controllers/schedulerController';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// Type-safe handler wrapper
const handler = (fn: (req: AuthenticatedRequest, res: Response) => Promise<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req as AuthenticatedRequest, res).catch(next);
    };
};

router.post('/schedule', authenticateYoutuber, handler(SchedulerController.createSchedule));
router.patch('/schedule/:id', authenticateYoutuber, handler(SchedulerController.updateSchedule));
router.delete('/schedule/:id', authenticateYoutuber, handler(SchedulerController.deleteSchedule));

export default router;
