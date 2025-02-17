export interface IVideoUpload {
  url: string;
  public_id?: string;
  resource_type?: string;
  time?: string;
  playNumber?: number;
  totalPlays?: number;
  campaignId?: string;
  paymentId?: string;
  uploadedAt?: string;
  playsNeeded?: number;
  donationId?: string; // Make this optional
  brandLink?: string;  // Add this field
}
