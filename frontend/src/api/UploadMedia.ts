import axios, { AxiosError } from 'axios';
import { BACKEND_API_URL } from '../config/env';

// Types
interface SignatureResponse {
  signature: string;
  timestamp: number;
  folder: string;
  cloudName: string;
  apiKey: string;
}

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  resource_type: string;
}

interface BackendResponse {
  message: string;
  data: {
    url: string;
    public_id: string;
    resource_type: string;
    uploaded_at: string;
  };
}

export class UploadError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'UploadError';
  }
}

export const uploadMedia = async (
  file: File, 
  userId: string,
  companyId: string,
  videoDuration:number,
  onProgress?: (progress: number) => void
): Promise<string> => {
  if (!file) {
    throw new UploadError('Please select a file to upload.');
  }

  if (!userId) {
    throw new UploadError('User ID is required.');
  }

  try {
    // Step 1: Create Payment
    const { data: paymentData } = await axios.post(`${BACKEND_API_URL}/create-payment`, {
      userId,
      companyId,
      amount: 1000, // Specify the payment amount
      currency: 'INR' // Specify the currency
    });

    // Step 2: Verify Payment
    const { data: verifyData } = await axios.post(`${BACKEND_API_URL}/verify-payment`, {
      paymentId: paymentData.paymentId, // Use the paymentId returned from create-payment
      userId,
      companyId
    });

    if (!verifyData.success) {
      throw new UploadError('Payment verification failed.');
    }

    // Step 3: Get signature and upload parameters from backend
    const { data: signatureData } = await axios.get<SignatureResponse>(
      `${BACKEND_API_URL}/get-signature`
    );

    // Step 4: Prepare form data for Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signatureData.apiKey);
    formData.append('timestamp', signatureData.timestamp.toString());
    formData.append('signature', signatureData.signature);
    formData.append('folder', signatureData.folder);

    // Step 5: Upload to Cloudinary
    const { data:cloudinaryData } = await axios.post<CloudinaryResponse>(
      `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/video/upload`,
      formData,
      {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          if (onProgress) {
            onProgress(progress);
          }
        },
      }
    );
    // Step 6: Save upload details in backend
    const { data: backendData } = await axios.post<BackendResponse>(
      `${BACKEND_API_URL}/upload/${userId}`,
      {
        url: cloudinaryData.secure_url,
        public_id: cloudinaryData.public_id,
        resource_type: cloudinaryData.resource_type,
        time:videoDuration
      }
    );

    // Step 7: Return the secure URL of the uploaded video
    return cloudinaryData.secure_url;

  } catch (error) {
    // Handle error
    if (axios.isAxiosError(error)) {
      throw new UploadError('Failed to upload media', error);
    }
    throw new UploadError('An unknown error occurred');
  }
};
