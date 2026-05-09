import { API_BASE_URL, apiService } from "./api.service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../utils/constants";

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
    console.error("Failed to retrieve token:", error);
    return null;
  }
};

/**
 * Submit registration form
 * Requires JWT token in Authorization header
 */
export const submitRegistration = async (
  payload: RegistrationPayload,
  token?: string,
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

    const response = await apiService.post("/registrations", payload, {
      headers: {
        // Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = response.data;

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Registration submission error:", error);
    throw error;
  }
};

export interface SupportedRegionSuggestion {
  id: string;
  profile_id: string;
  region: string;
  content: string;
  status: string;
  reason?: string | null;
  created_by: string;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * GET /regions/established
 * Fetch regions that have been established and can accept child submissions.
 */
export const getEstablishedRegions = async (): Promise<string[]> => {
  const res = await apiService.get(`/regions/established`);
  const data = res.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.regions)) return data.regions;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

/**
 * Fetch regions that need volunteer/local leader support
 */
export const getSupportedRegionSuggestions = async (): Promise<
  SupportedRegionSuggestion[]
> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/regions/supported-suggestions`,
      { method: "GET", headers: { Accept: "application/json" } },
    );
    if (!response.ok) throw new Error("Failed to fetch region suggestions");
    const data = await response.json();
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error("Failed to fetch region suggestions:", error);
    throw error;
  }
};

export interface UserRegistration {
  id: string;
  profile_id: string;
  region: string;
  register_role: string;
  status: string;
  approvers: string[] | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch registrations submitted by the current user (identified by wallet address)
 */
export const getUserRegistrations = async (
  address: string,
): Promise<UserRegistration[]> => {
  const response = await apiService.get(`/registrations/user/${address}`);
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  return [];
};

/**
 * GET /regions/user/{address}/supported-suggestions
 * Fetch suggestions submitted by a specific wallet address.
 */
export const getMySupportedRegionSuggestions = async (
  address: string,
): Promise<SupportedRegionSuggestion[]> => {
  const res = await apiService.get(
    `/regions/user/${address}/supported-suggestions`,
  );
  const data = res.data;
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  return [];
};

/**
 * POST /regions/supported-suggestions
 * Submit a new region that needs support.
 */
export const createSupportedRegionSuggestion = async (
  payload: { region: string; content: string },
): Promise<SupportedRegionSuggestion> => {
  const res = await apiService.post(`/regions/supported-suggestions`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
};

/**
 * Confirm a registration by id
 */
export const confirmRegistration = async (
  registrationId: string,
): Promise<any> => {
  try {
    const res = await apiService.post(
      `/registrations/${registrationId}/confirm`,
    );
    return res.data;
  } catch (error) {
    console.error("Failed to confirm registration:", error);
    throw error;
  }
};

