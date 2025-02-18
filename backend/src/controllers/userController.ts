// authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../db/db';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { generateCloudinarySignature, generateUniqueCode } from '../helpers/helper';
import {  sendVerificationEmail } from '../helpers/email';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Add to your existing schemas
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

// Updated register controller
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
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Update the company registration section to:
    if (userType === 'company') {
      // Check if user exists with email
      const existingUser = await prisma.user.findUnique({
        where: { email },
        include: { 
          company: true,
          youtuber: true 
        }
      });

      // Type guard to check user exists
      if (existingUser) {
        // Check associations
        const isCompany = !!existingUser.company;
        const isYoutuber = !!existingUser.youtuber;
        
        let message = 'Email already registered';
        if (isCompany) message += ' as company';
        if (isYoutuber) message += ' as youtuber';
        
        return res.status(400).json({
          success: false,
          message
        });
      }

      // Proceed with company creation
      const company = await prisma.company.create({
        data: { 
          name,
          user: {
            create: {
              email,
              password: hashedPassword,
              name,
              role: 'COMPANY',
              isVerified: false,
              verificationToken
            }
          },
          verificationToken,
          isVerified: false
        }
      });

      await sendVerificationEmail(email, verificationToken);
      return res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.'
      });
    }
    const existingYoutuberUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingYoutuberUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const youtuber = await prisma.youtuber.create({
      data: {
        user: {
          create: {
            email,
            password: hashedPassword,
            name,
            role: 'YOUTUBER'
          }
        },
        alertBoxUrl: `${process.env.FRONTEND_URL}/alert-box/${crypto.randomUUID()}`,
        MagicNumber: generateUniqueCode(),
        verificationToken,
        isVerified: false
      }
    });
    
    
    
    await sendVerificationEmail(email, verificationToken);

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.'
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Updated login controller
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
      
      const companyUser = await prisma.user.findUnique({
        where: { email },
        include: { company: true }
      });
      
      if (!companyUser?.company || !await bcrypt.compare(password, companyUser.password)) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      if (!companyUser.isVerified) {
        return res.status(401).json({
          success: false,
          message: 'Email not verified. Please check your email.'
        });
      }

      const token = jwt.sign(
        { id: companyUser.id, userType },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        success: true,
        user: { ...companyUser, password: undefined },
        userType,
        token
      });
    }

    // Updated login for Youtuber
    const youtuberUser = await prisma.user.findUnique({
      where: { email },
      include: { youtuber: true }
    });

    if (!youtuberUser?.youtuber || !await bcrypt.compare(password, youtuberUser.password)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!youtuberUser.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Email not verified. Please check your email.'
      });
    }

    const token = jwt.sign(
      { id: youtuberUser.id, userType },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      user: { ...youtuberUser, password: undefined },
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

// Add new verification controller
export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.query;

  try {
    // Verify Company
    const company = await prisma.company.findFirst({
      where: { 
        verificationToken: token as string 
      }
    });

    if (company) {
      await prisma.company.update({
        where: { id: company.id },
        data: { 
          isVerified: true,
          verificationToken: null 
        }
      });
      return res.status(200).json({ 
        success: true, 
        message: 'Email verified successfully' 
      });
    }

    // Verify Youtuber
    const youtuber = await prisma.youtuber.findFirst({
      where: { 
        verificationToken: token as string 
      }
    });

    if (youtuber) {
      await prisma.youtuber.update({
        where: { id: youtuber.id },
        data: { 
          isVerified: true,
          verificationToken: null 
        }
      });
      return res.status(200).json({ 
        success: true, 
        message: 'Email verified successfully' 
      });
    }

    return res.status(400).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};
// Keep existing getCloudinarySignature function
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
