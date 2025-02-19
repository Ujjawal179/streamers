// authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../db/db';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { generateCloudinarySignature, generateUniqueCode } from '../helpers/helper';
import { sendVerificationEmail } from '../helpers/email';

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
    const { name, email, password, userType }  = req.body;
    console.log( { name, email, password, userType }  )

    // if (!parseResult.success) {
    //   return res.status(400).json({
    //     success: false,
    //     errors: parseResult.error.issues.map(issue => ({
    //       path: issue.path[0],
    //       message: issue.message,
    //     }))
    //   });
    // }

    // const { name, email, password, userType } = parseResult.data;

    // Check if email already exists before doing anything else
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Continue with registration if email doesn't exist
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Use transaction to ensure data consistency
    if (userType === 'company') {
      await prisma.$transaction(async (prisma) => {
        const user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            role: 'COMPANY',
            verificationToken,
            isVerified: false
          }
        });

        await prisma.company.create({
          data: {
            name,
            userId: user.id,
            isVerified: false
          }
        });
      });

      await sendVerificationEmail(email, verificationToken);
      return res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.'
      });
    }

    // YouTuber registration
    await prisma.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'YOUTUBER',
          verificationToken,
          isVerified: false
        }
      });

      await prisma.youtuber.create({
        data: {
          userId: user.id,
          alertBoxUrl: `${process.env.FRONTEND_URL}/alert-box/${crypto.randomUUID()}`,
          MagicNumber: generateUniqueCode(),
          isVerified: false
        }
      });
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
      message: 'Registration failed. Please try again.'
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
        user: { ...companyUser?.company, password: undefined },
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
      user: { ...youtuberUser.youtuber, password: undefined },
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
  try {
    const { token } = req.params; // Changed from req.query to req.params
    
    // Find user by verification token
    const user = await prisma.user.findFirst({
      where: { verificationToken: token }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Update user verification status
    await prisma.$transaction(async (prisma) => {
      // Update user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          verificationToken: null // Clear the token after verification
        }
      });

      // Update associated company or youtuber based on role
      if (user.role === 'COMPANY') {
        await prisma.company.update({
          where: { userId: user.id },
          data: { isVerified: true }
        });
      } else if (user.role === 'YOUTUBER') {
        await prisma.youtuber.update({
          where: { userId: user.id },
          data: { isVerified: true }
        });
      }
    });

    // Redirect to frontend with success message
    return res.redirect(`${process.env.FRONTEND_URL}/verification-success`);
    } catch (error) {
    console.error('Verification error:', error);
    // Redirect to frontend with error message
    return res.redirect(`${process.env.FRONTEND_URL}/verification-error`);
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
