import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../db/db';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { generateCloudinarySignature } from '../helpers/helper';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Input validation schemas
const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  userType: z.enum(['company', 'youtuber']),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  userType: z.enum(['company', 'youtuber']),
});

export const register = async (req: Request, res: Response) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        errors: parseResult.error.issues.map(issue => ({
          path: issue.path[0],
          message: issue.message,
        }))
      });
    }

    const { name, email, password, userType } = parseResult.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    if (userType === 'company') {
      const existingCompany = await prisma.company.findUnique({ where: { email } });
      if (existingCompany) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }

      const company = await prisma.company.create({
        data: { name, email, password: hashedPassword }
      });

      const token = jwt.sign(
        { id: company.id, userType },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(201).json({
        success: true,
        user: { ...company, password: undefined },
        userType,
        token
      });
    }

    const existingYoutuber = await prisma.youtuber.findUnique({ where: { email } });
    if (existingYoutuber) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const youtuber = await prisma.youtuber.create({
      data: {
        name,
        email,
        password: hashedPassword,
        alertBoxUrl: `${process.env.FRONTEND_URL}/alert-box/${crypto.randomUUID()}`
      }
    });

    const token = jwt.sign(
      { id: youtuber.id, userType },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      success: true,
      user: { ...youtuber, password: undefined },
      userType,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        errors: parseResult.error.issues.map(issue => ({
          path: issue.path[0],
          message: issue.message,
        }))
      });
    }

    const { email, password, userType } = parseResult.data;

    if (userType === 'company') {
      const company = await prisma.company.findUnique({ where: { email } });
      
      if (!company || !await bcrypt.compare(password, company.password)) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const token = jwt.sign(
        { id: company.id, userType },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        success: true,
        user: { ...company, password: undefined },
        userType,
        token
      });
    }

    const youtuber = await prisma.youtuber.findUnique({ where: { email } });
    
    if (!youtuber || !await bcrypt.compare(password, youtuber.password)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { id: youtuber.id, userType },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      user: { ...youtuber, password: undefined },
      userType,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
export const getCloudinarySignature = (req: Request, res: Response) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'uploads';
    const uploadPreset = 'ml_default'; // Include the upload preset
    
    // Include all parameters that need to be signed
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}&upload_preset=${uploadPreset}`;
    const signature = generateCloudinarySignature(paramsToSign);
    res.json({
      signature,
      timestamp,
      folder,
      uploadPreset,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY
    });
  } catch (error) {
    console.error('Error generating signature:', error);
    res.status(500).json({ error: 'Failed to generate signature' });
  }
};
