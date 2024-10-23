import axios from 'axios';
import { BACKEND_API_URL, RAZORPAY_KEY_ID } from '../config/env';
import { useRazorpay, RazorpayOrderOptions } from 'react-razorpay';

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

interface PaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export class UploadError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'UploadError';
  }
}

// Custom hook to handle Razorpay payments
export const usePaymentHandler = () => {
  const [Razorpay]:any = useRazorpay(); // Correctly destructure the Razorpay constructor

  const handlePayment = async (userId: string, companyId: string, amount: number = 1000): Promise<void> => {
    try {
      const { data: paymentData } = await axios.post(`${BACKEND_API_URL}/create-payment`, {
        youtuberId: userId,
        companyId,
        amount,
        currency: 'INR'
      });

      return new Promise((resolve, reject) => {
        const options = {
          key: RAZORPAY_KEY_ID,
          name: "Streamers.com",
          amount: paymentData.amount,
          currency: 'INR' as RazorpayOrderOptions['currency'],
          order_id: paymentData.id,
          handler: async function (response: PaymentResponse) {
            try {
              await axios.post(`${BACKEND_API_URL}/verify-payment`, {
                orderId: paymentData.id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature
              });
              resolve();
            } catch (error) {
              reject(new Error('Payment verification failed'));
            }
          },
          modal: {
            ondismiss: function() {
              reject(new Error('Payment cancelled'));
            }
          }
        };

        const rzp = new Razorpay(options);
        rzp.open();
      });
    } catch (error) {
      throw new Error('Failed to initialize payment');
    }
  };

  return { handlePayment };
};

// Main upload function
export const uploadMedia = async (
  file: File, 
  userId: string,
  companyId: string,
  videoDuration: number,
  onProgress?: (progress: number) => void
): Promise<string> => {
  if (!file) {
    throw new UploadError('Please select a file to upload.');
  }

  if (!userId) {
    throw new UploadError('User ID is required.');
  }

  try {
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

    // Step 6: Save upload details in backend
    const { data: backendData } = await axios.post<BackendResponse>(
      `${BACKEND_API_URL}/upload/${userId}`,
      {
        url: cloudinaryData.secure_url,
        public_id: cloudinaryData.public_id,
        resource_type: cloudinaryData.resource_type,
        time: videoDuration
      }
    );

    // Step 7: Return the secure URL of the uploaded video
    return cloudinaryData.secure_url;

  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new UploadError('Failed to upload media', error);
    }
    throw new UploadError('An unknown error occurred');
  }
};