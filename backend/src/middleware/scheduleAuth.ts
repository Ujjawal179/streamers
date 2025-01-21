import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { Role } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    userType: Role;  // Changed back to userType to match Request interface
  };
  schedule?: any;
}

export const verifyScheduleOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { scheduleId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.userType; // Now correctly accessing userType property

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admin can access all schedules
    if (userRole === Role.ADMIN) { // Using enum from Prisma client
      const schedule = await prisma.adSchedule.findUnique({
        where: { id: scheduleId }
      });
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }
      req.schedule = schedule;
      return next();
    }

    // For YouTubers, verify ownership
    const schedule = await prisma.adSchedule.findFirst({
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
            channelName: true,
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
  } catch (error) {
    console.error('Schedule verification error:', error);
    res.status(500).json({ error: 'Failed to verify schedule ownership' });
  }
};

// Middleware to check if YouTuber is live before allowing schedule modifications
export const verifyYoutuberStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { youtuberId } = req.params;
    
    const youtuber = await prisma.youtuber.findFirst({
      where: {
        id: youtuberId,
        userId: req.user?.id
      }
    });

    if (!youtuber) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    if (!youtuber.isLive) {
      return res.status(400).json({ error: 'YouTuber must be live to modify schedule' });
    }

    next();
  } catch (error) {
    console.error('YouTuber status verification error:', error);
    res.status(500).json({ error: 'Failed to verify YouTuber status' });
  }
};

// Middleware to validate schedule time slots
export const validateScheduleTime = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startTime, endTime } = req.body;
    const { youtuberId } = req.params;

    // Basic time validation
    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    // Check for overlapping schedules
    const existingSchedule = await prisma.adSchedule.findFirst({
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
  } catch (error) {
    console.error('Schedule time validation error:', error);
    res.status(500).json({ error: 'Failed to validate schedule time' });
  }
};

// Export all middleware functions
export const scheduleAuth = {
  verifyScheduleOwnership,
  verifyYoutuberStatus,
  validateScheduleTime
};
