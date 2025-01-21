export interface BankingDetails {
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  panCard?: string;
  upiId?: string;
  bankVerified?: boolean;
}

export interface PaymentInfo extends BankingDetails {
  id: string;
  youtuberId: string;
  earnings: number;
}
