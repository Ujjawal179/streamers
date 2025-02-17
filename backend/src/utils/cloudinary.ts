import { Request, Response } from 'express';
import crypto from 'crypto';

export const getCloudinarySignature = (req: Request, res: Response) => {
  try {
    const { CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY } = process.env;

    if (!CLOUDINARY_API_SECRET || !CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY) {
      return res.status(500).json({ error: 'Missing Cloudinary API credentials' });
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = 'uploads';
    const uploadPreset = 'ml_default';

    // Include all parameters (alphabetically sorted) that you're sending with the request.
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}&upload_preset=${uploadPreset}`;

    // Generate signature using SHA-1.
    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + CLOUDINARY_API_SECRET)
      .digest('hex');

    res.json({
      signature,
      timestamp,
      folder,
      uploadPreset,
      cloudName: CLOUDINARY_CLOUD_NAME,
      apiKey: CLOUDINARY_API_KEY
    });
  } catch (error) {
    console.error('Error generating Cloudinary signature:', error);
    return res.status(500).json({ error: 'Failed to generate signature' });
  }
};
