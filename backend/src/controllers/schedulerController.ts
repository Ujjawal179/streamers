import { Request, Response } from 'express';
import { ScheduleService } from '../services/scheduleService';

export class SchedulerController {
  static async createSchedule(req: Request, res: Response) {
    const { youtuberId } = req.params;
    const { startTime, endTime, maxAdsPerHour } = req.body;

    try {
      const schedule = await ScheduleService.createSchedule(youtuberId, {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        maxAdsPerHour
      });
      res.json(schedule);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getYoutuberSchedule(req: Request, res: Response) {
    const { youtuberId } = req.params;

    try {
      const schedule = await ScheduleService.getYoutuberSchedule(youtuberId);
      res.json(schedule);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getQueueStatus(req: Request, res: Response) {
    const { youtuberId } = req.params;

    try {
      const queueStatus = await ScheduleService.getYoutuberQueue(youtuberId);
      res.json(queueStatus);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async scheduleDonation(req: Request, res: Response) {
    const { donationId } = req.params;
    const { scheduledTime } = req.body;

    try {
      const donation = await ScheduleService.scheduleDonation(donationId, new Date(scheduledTime));
      res.json(donation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAvailableSlots(req: Request, res: Response) {
    const { youtuberId } = req.params;
    const { date } = req.query;

    try {
      const slots = await ScheduleService.getAvailableSlots(youtuberId, new Date(date as string));
      res.json(slots);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateSchedule(req: Request, res: Response) {
    const { scheduleId } = req.params;
    const { startTime, endTime, maxAdsPerHour } = req.body;

    try {
      const updatedSchedule = await ScheduleService.updateSchedule(scheduleId, {
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        maxAdsPerHour
      });
      res.json(updatedSchedule);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteSchedule(req: Request, res: Response) {
    const { scheduleId } = req.params;

    try {
      await ScheduleService.deleteSchedule(scheduleId);
      res.json({ message: 'Schedule deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async checkScheduleConflicts(req: Request, res: Response) {
    const { youtuberId } = req.params;
    const { startTime, endTime } = req.body;

    try {
      const hasConflicts = await ScheduleService.checkScheduleConflicts(
        youtuberId,
        new Date(startTime),
        new Date(endTime)
      );

      res.json({
        hasConflicts,
        message: hasConflicts ? 'Schedule conflicts found' : 'No conflicts found'
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}