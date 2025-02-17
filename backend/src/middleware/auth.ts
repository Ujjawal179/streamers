import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import prisma from '../config/database';

export interface AuthUser {
  id: string;
  userType: Role;
  companyId?: string;
  youtuberId?: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

export const authenticateCompany = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
    console.log(decoded);
    if (decoded.userType.toUpperCase( ) !== 'COMPANY') {
      return res.status(403).json({ error: 'Company access required' });
    }

    const company = await prisma.company.findFirst({
      where: { userId: decoded.id }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    (req as AuthenticatedRequest).user = {
      ...decoded,
      companyId: company.id
    };
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export const authenticateYoutuber = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
    if (decoded.userType.toUpperCase( ) !== 'YOUTUBER') {
      return res.status(403).json({ error: 'Youtuber access required' });
    }

    const youtuber = await prisma.youtuber.findFirst({
      where: { userId: decoded.id }
    });

    if (!youtuber) {
      return res.status(404).json({ error: 'Youtuber not found' });
    }

    (req as AuthenticatedRequest).user = {
      ...decoded,
      youtuberId: youtuber.id
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};
