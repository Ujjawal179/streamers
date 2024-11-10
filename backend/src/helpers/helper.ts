import jwt from "jsonwebtoken";
import crypto from "crypto";

import dotenv from 'dotenv';
import { Response } from 'express';

dotenv.config();

const jwt_secret= process.env.JWT_SECRET ||"2344";
export const generateCloudinarySignature = (paramsToSign: string): string => {
    return crypto
      .createHash('sha256')
      .update(paramsToSign + process.env.CLOUDINARY_API_SECRET)
      .digest('hex');
  };