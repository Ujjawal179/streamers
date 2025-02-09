import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error();
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: (decoded as any).id, userType: (decoded as any).userType as Role };
    next();
  } catch (error) {
    return res.status(401).send({ error: 'Please authenticate.' });
  }
};
