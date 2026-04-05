import { apiService } from './api.service';

export type CampaignItem = {
  id: string;
  profile_id?: string;
  region?: string;
  address?: string;
  phone_number?: string;
  image_blob_id?: string;
  status?: string;
  IsAvailableToConfirm?: boolean;
  is_confirm_register?: boolean;
};

export type CenterDetail = {
  id: string;
  profile_id: string;
  region: string;
  address: string;
  phone_number: string;
  image_blob_id: string;
  approvers?: string[];
  refusers?: string[] | null;
  refuse_reasons?: string | null;
  status: string;
  IsAvailableToConfirm: boolean;
  is_confirm_register: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
};

const IMAGE_BASE = ''; // if there's a separate blob URL, set it here; otherwise service will build from baseURL

export const getCampaigns = async (page = 1, pageSize = 10) => {
  try {
    const res = await apiService.get(`/centers?page=${page}&page_size=${pageSize}`);
    // assume backend returns { data: [...], amount, page, total_pages }
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getCenterDetail = async (centerId: string): Promise<CenterDetail> => {
  try {
    const res = await apiService.get<CenterDetail>(`/centers/${centerId}`);
    return res.data;
  } catch (error) {
    console.error(`Failed to fetch center detail for ${centerId}:`, error);
    throw error;
  }
};

export const mapBackendToCampaign = (item: CampaignItem, apiBaseUrl: string) => {
  return {
    id: String(item.id),
    name: item.region || item.profile_id || `Campaign ${item.id}`,
    description: item.address || '',
    image: item.image_blob_id
      ? `${apiBaseUrl.replace(/\/+$/, '')}/blobs/${item.image_blob_id}`
      : undefined,
    raw: item,
  };
};
