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

const IMAGE_BASE = ''; // if there's a separate blob URL, set it here; otherwise service will build from baseURL

export const getCampaigns = async (page = 1, pageSize = 20) => {
  try {
    const res = await apiService.get(`/centers?page=${page}&page_size=${pageSize}`);
    // assume backend returns { data: [...], amount, page, total_pages }
    return res.data;
  } catch (error) {
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
