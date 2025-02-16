import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

export const authenticateCompany = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string, userType: string };
    
    if (decoded.userType !== 'company') {
      return res.status(403).json({ message: 'Company access required' });
    }

    const company = await prisma.company.findFirst({
      where: { userId: decoded.id }
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    req.user = { id: decoded.id, companyId: company.id };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
