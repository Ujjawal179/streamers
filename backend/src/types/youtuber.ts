interface BankingDetails {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
}

export interface YoutuberSettings {
  timeout?: number;
  charge?: number;
  name?: string;
  channelLink?: string;
  phoneNumber?: string;
  alertBoxUrl?: string;
}

export interface YoutuberProfile extends YoutuberSettings {
  id: string;
  channelName: string;
  isLive: boolean;
  currentCCV: number;
  earnings: number;
  bankingDetails?: BankingDetails;
}
