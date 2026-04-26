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