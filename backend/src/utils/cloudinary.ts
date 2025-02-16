import { Request, Response } from 'express';
import crypto from 'crypto';

export const getCloudinarySignature = (req: Request, res: Response) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'uploads';
    const uploadPreset = 'ml_default';
    
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}&upload_preset=${uploadPreset}`;
    const signature = crypto
      .createHmac('sha256', process.env.CLOUDINARY_API_SECRET || '')
      .update(paramsToSign)
      .digest('hex');

    res.json({
      signature,
      timestamp,
      folder,
      uploadPreset,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate signature' });
  }
};
