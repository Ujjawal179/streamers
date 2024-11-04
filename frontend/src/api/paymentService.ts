import axios from 'axios';
import { BACKEND_API_URL } from '../config/env';
const BASE_URL: string = BACKEND_API_URL;

interface PaymentData {
  amount: number;
  currency: string;
  youtuberId: string;
}

interface VerifyPaymentData {
  orderId: string;
  paymentId: string;
  signature: string;
}

interface ApiResponse {
  success?: boolean;
  message?: string;
  errors?: { path: string; message: string }[];
  order?: any;
  payment?: any;
}

export const createPayment = async (paymentData: PaymentData): Promise<ApiResponse> => {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/payments/create-payment`, paymentData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error creating payment:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data;
    }
    throw new Error('Server error');
  }
};

export const verifyPayment = async (verifyPaymentData: VerifyPaymentData): Promise<ApiResponse> => {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/payments/verify-payment`, verifyPaymentData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data;
    }
    throw new Error('Server error');
  }
};
