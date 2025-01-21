
export interface PaymentDetails {
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PROCESSING';
  orderId: string;
  transactionId?: string;
  playsNeeded: number;
  earnings: number;
  platformFee: number;
}

export interface CreatePaymentRequest {
  amount: number;
  youtuberId: string;
  playsNeeded: number;
}