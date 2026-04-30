import { apiService } from './api.service';

export type UpdateProfileRequest = {
  date_of_birth?: string;
  email?: string;
  first_name?: string;
  gender?: string;
  identity_code?: string;
  last_name?: string;
  phone_number?: string;
  region?: string;
};

export type Profile = {
  id: string;
  status?: string;
  salt?: string;
  token?: string;
  date_of_birth?: string;
  email?: string;
  first_name?: string;
  gender?: string;
  identity_code?: string;
  last_name?: string;
  phone_number?: string;
  region?: string;
  created_at?: string;
  updated_at?: string;
};

export interface TransactionRecord {
  id?: string;
  order_code?: string;
  description?: string;
  amount?: number;
  status?: string;
  created_at?: string;
}

export interface WalletProfile {
  wallet_address: string;
  first_name: string;
  last_name: string;
  total_donation: number;
  supported_childs: string[] | null;
  transaction_records: TransactionRecord[] | null;
  record_amount: number;
  page: number;
  total_pages: number;
}

export const getPersonalWalletProfile = async (
  walletAddress: string,
  page = 1
): Promise<WalletProfile> => {
  const res = await apiService.get<WalletProfile>(
    `/profiles/personal-wallet-profile/${walletAddress}`,
    { params: { page } }
  );
  return res.data;
};

export const getProfile = async (profileId: string): Promise<Profile> => {
  try {
    const res = await apiService.get<Profile>(`/profiles/${profileId}`);
    return res.data;
  } catch (error) {
    console.error(`Failed to fetch profile ${profileId}:`, error);
    throw error;
  }
};

export const updateProfile = async (
  profileId: string | null,
  payload: UpdateProfileRequest
): Promise<Profile> => {
  try {
    const res = await apiService.post<Profile>(
      `/profiles/${profileId}`,
      payload
    );
    return res.data;
  } catch (error) {
    console.error(`Failed to update profile ${profileId}:`, error);
    throw error;
  }
};