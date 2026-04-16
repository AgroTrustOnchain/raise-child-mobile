import { API_BASE_URL, apiService } from './api.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

export interface RegistrationPayload {
  avatar_blob_id: string;
  identity_card_blob_id: string;
  region: string;
  register_role: string;
}

export interface RegistrationResponse {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * Get JWT token from async storage
 */
export const getStoredToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    return token;
  } catch (error) {
    console.error('Failed to retrieve token:', error);
    return null;
  }
};

/**
 * Submit registration form
 * Requires JWT token in Authorization header
 */
export const submitRegistration = async (
  payload: RegistrationPayload,
  token?: string
): Promise<RegistrationResponse> => {
  try {
    // Get token from storage if not provided
    // let authToken = token;
    // if (!authToken) {
    //   authToken = await getStoredToken();
    //   if (!authToken) {
    //     throw new Error('No authentication token found. Please login first.');
    //   }
    // }

    const response = await apiService.post('/registrations', payload, {
      headers: {
        // Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = response.data;

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Registration submission error:', error);
    throw error;
  }
};

/**
 * Fetch all available regions
 */
export const getRegions = async (): Promise<string[]> => {
  try {
    const response = await fetch(
      'https://agrotrust-server-production.onrender.com/regions',
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch regions');
    }

    const data = await response.json();

    // Handle different response formats
    let regions: string[] = [];
    if (Array.isArray(data)) {
      regions = data;
    } else if (data.regions && Array.isArray(data.regions)) {
      regions = data.regions;
    } else if (data.data && Array.isArray(data.data)) {
      regions = data.data;
    }

    return regions;
  } catch (error) {
    console.error('Failed to fetch regions:', error);
    throw error;
  }
};
