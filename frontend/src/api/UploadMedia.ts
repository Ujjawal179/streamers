import axios, { AxiosError } from 'axios';
import { BACKEND_API_URL, RAZORPAY_KEY_ID, SIGHTENGINE_CALLBACK_URL,SIGHTENGINE_API_USER,SIGHTENGINE_API_SECRET } from '../config/env';
import { RazorpayOrderOptions } from 'react-razorpay';
import FormData from 'form-data';

// Types
interface SignatureResponse {
  signature: string;
  timestamp: number;
  folder: string;
  cloudName: string;
  apiKey: string;
  uploadPreset: string;
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
interface SightengineResponse {
  status: 'success' | 'error';
  error?: string;
  // Add other response fields as needed based on Sightengine's API
}

interface SightengineError {
  response?: {
    data: {
      error?: string;
    };
  };
  message: string;
}

export class UploadError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'UploadError';
  }
}

// Helper function to handle payment verification
const verifyPayment = async (orderId: string, paymentId: string, signature: string): Promise<boolean> => {
  try {
    const { data } = await axios.post(`${BACKEND_API_URL}/verify-payment`, {
      orderId,
      paymentId,
      signature
    });
    return true;
  } catch (error) {
    throw new UploadError('Payment verification failed');
  }
};

export const uploadMedia = async (
  file: File,
  userId: string,
  companyId: string,
  videoDuration: number,
  Razorpay: any,
  onProgress?: (progress: number) => void
): Promise<string> => {
  if (!file) {
    throw new UploadError('Please select a file to upload.');
  }

  if (!userId) {
    throw new UploadError('User ID is required.');
  }

  try {
    const performContentModeration = async (file: File | Blob): Promise<SightengineResponse> => {
      console.log('Step 0: Starting content moderation...');
      
      const data = new FormData();
      
      // Append the file as a readable stream
      data.append('media', file);
      
      // Configure Sightengine specific parameters
      data.append('models', 'nudity');  // You can add more models as needed
      data.append('callback_url', `${SIGHTENGINE_CALLBACK_URL}/${userId}`);
      data.append('api_user', SIGHTENGINE_API_USER);
      data.append('api_secret', SIGHTENGINE_API_SECRET);
    
      try {
        const response = await axios<SightengineResponse>({
          method: 'post',
          url: 'https://api.sightengine.com/1.0/video/check.json',
          data: data,
          headers: {
            ...data.getHeaders(),
            timeout: 300000,
            withCredentials: true
          }
        });
    
        console.log('Moderation API Response:', response.data);
        
        if (response.data.status !== 'success') {
          throw new UploadError('Content moderation failed: ' + response.data.error);
        }
    
        console.log('Content moderation check initiated successfully');
        return response.data;
    
      } catch (error: unknown) {
        const typedError = error as SightengineError;
        
        if (typedError.response) {
          console.error('Moderation API Error:', typedError.response.data);
          throw new UploadError(typedError.response.data.error || 'Content moderation service error');
        } else {
          console.error('Moderation Request Error:', typedError.message);
          throw new UploadError('Failed to perform content moderation: ' + typedError.message);
        }
      }
    };
    try {
      const result = await performContentModeration(file);

    } catch (error) {
      if (error instanceof UploadError) {
        // Handle upload error
        console.error(error.message);
      }
    }
    // Step 1: Create Payment
    console.log({
      youtuberId: userId,
      companyId: companyId,
      amount: 100,
      currency: 'INR'
    });
    console.log('Step 1: Initiating payment...');
    const { data: paymentData } = await axios.post(`${BACKEND_API_URL}/create-payment`, {
      youtuberId: userId,
      companyId: companyId,
      amount: 1000,
      currency: 'INR'
    });

    // Step 2: Process Payment
    console.log('Step 2: Processing payment...');
    const paymentPromise = new Promise<void>((resolve, reject) => {
      const options = {
        key: RAZORPAY_KEY_ID,
        name: "Streamers.com",
        amount: paymentData.amount,
        currency: 'INR' as RazorpayOrderOptions['currency'],
        order_id: paymentData.id,
        handler: async function (response: any) {
          try {
            const isVerified = await verifyPayment(
              paymentData.id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            if (isVerified) {
              resolve();
            } else {
              reject(new Error('Payment verification failed'));
            }
          } catch (error) {
            reject(error);
          }
        },
        modal: {
          ondismiss: function() {
            reject(new Error('Payment cancelled by user'));
          }
        }
      };

      const rzp1 = new Razorpay(options);
      rzp1.open();
    });

    await paymentPromise;
    console.log('Payment completed and verified successfully');

    // Step 3: Get upload signature
    console.log('Step 3: Getting upload signature...');
    const { data: signatureData } = await axios.get<SignatureResponse>(
      `${BACKEND_API_URL}/get-signature`
    );

    // Step 4: Upload to Cloudinary
    console.log('Step 4: Uploading to Cloudinary...');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signatureData.apiKey);
    formData.append('timestamp', signatureData.timestamp.toString());
    formData.append('signature', signatureData.signature);
    formData.append('folder', signatureData.folder);
    formData.append('upload_preset', signatureData.uploadPreset);

    const { data: cloudinaryData } = await axios.post<CloudinaryResponse>(
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

    // Step 5: Save upload details
    console.log('Step 5: Saving upload details...');
    const { data: backendData } = await axios.post<BackendResponse>(
      `${BACKEND_API_URL}/upload/${userId}`,
      {
        url: cloudinaryData.secure_url,
        public_id: cloudinaryData.public_id,
        resource_type: cloudinaryData.resource_type,
        time: videoDuration
      }
    );

    console.log('Upload process completed successfully');
    return cloudinaryData.secure_url;

  } catch (error) {
    console.error('Upload process failed:', error);
    if (axios.isAxiosError(error)) {
      throw new UploadError(`Upload failed: ${error.message}`, error);
    }
    throw new UploadError('An unknown error occurred during the upload process');
  }
};
