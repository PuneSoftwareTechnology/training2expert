export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface QrCode {
  id: string;
  image_url: string;
  bank_name: string;
  branch?: string;
  upi_id: string;
  account_number: string;
  ifsc_code: string;
  is_active: boolean;
  created_at: string;
}
