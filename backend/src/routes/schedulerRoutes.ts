import { Router } from 'express';
import { auth } from '../middleware/auth';
import { SchedulerController } from '../controllers/schedulerController';
import { scheduleAuth } from '../middleware/scheduleAuth';

const router = Router();

// Schedule management routes with full authentication
router.post('/:youtuberId/schedule', 
  auth, 
  scheduleAuth.verifyYoutuberStatus,
  scheduleAuth.validateScheduleTime,
  SchedulerController.createSchedule
);

router.get('/:youtuberId/schedule', 
  auth, 
  SchedulerController.getYoutuberSchedule
);

router.put('/schedule/:scheduleId', 
  auth, 
  scheduleAuth.verifyScheduleOwnership,
  scheduleAuth.validateScheduleTime,
  SchedulerController.updateSchedule
);

router.delete('/schedule/:scheduleId', 
  auth, 
  scheduleAuth.verifyScheduleOwnership,
  SchedulerController.deleteSchedule
);

router.post('/:youtuberId/check-conflicts', auth, SchedulerController.checkScheduleConflicts);

// Queue and donation scheduling routes
router.get('/:youtuberId/queue', auth, SchedulerController.getQueueStatus);
router.post('/donations/:donationId/schedule', auth, SchedulerController.scheduleDonation);
router.get('/:youtuberId/available-slots', auth, SchedulerController.getAvailableSlots);

// Add the router to the main routes file
export default router;
