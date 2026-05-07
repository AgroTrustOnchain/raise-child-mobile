import { API_BASE_URL, apiService } from "./api.service";

export type ChildItem = {
  id: string;
  identity_code?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  avatar_blob_id?: string;
  home_address?: string;
  region?: string;
};

const MOCK_CHILDREN = [
  // minimal shape from user-provided payload (trimmed)
  {
    id: "9",
    first_name: "Diệp",
    last_name: "Bùi",
    date_of_birth: "2018-09-01T00:00:00Z",
    avatar_blob_id: "avt-child-9",
    home_address: "18 Đường số 8, Phường 8",
  },
  {
    id: "19",
    first_name: "Phúc",
    last_name: "Bùi",
    date_of_birth: "2018-07-01T00:00:00Z",
    avatar_blob_id: "avt-child-19",
  },
  {
    id: "15",
    first_name: "Lan",
    last_name: "Hoàng",
    date_of_birth: "2019-03-01T00:00:00Z",
    avatar_blob_id: "avt-child-15",
  },
];

function calcAge(dob?: string) {
  if (!dob) return undefined;
  const b = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

export const mapChildToBeneficiary = (c: ChildItem) => ({
  id: String(c.id),
  name: `${c.first_name || ""} ${c.last_name || ""}`.trim(),
  age: calcAge(c.date_of_birth) || 0,
  grade: 0,
  image: c.avatar_blob_id
    ? `${API_BASE_URL.replace(/\/+$/, "")}/blobs/${c.avatar_blob_id}`
    : undefined,
  description: c.home_address || "",
  status: "available" as const,
  raw: c,
});

type ChildrenQuery = { campaignId?: string; region?: string };

// Get available regions with pagination
export const getRegions = async (
  page: number = 1,
  pageSize: number = 10
): Promise<{ items: string[]; hasMore: boolean }> => {
  try {
    const res = await apiService.get(
      `/children/regions?page=${page}&page_size=${pageSize}`
    );
    const regions = Array.isArray(res.data)
      ? res.data
      : res.data?.data || [];
    const totalPages = res.data?.total_pages;
    const hasMore =
      typeof totalPages === 'number'
        ? page < totalPages
        : (regions as string[]).length >= pageSize;
    return { items: regions as string[], hasMore };
  } catch (e) {
    // Fallback to mock regions if endpoint not available
    console.warn("getRegions failed, using default regions", e);
    const fallback = ['AgroTrust', 'North', 'South', 'Central'];
    return { items: page === 1 ? fallback : [], hasMore: false };
  }
};

// Get children by region with pagination
export const getChildrenByRegion = async (
  region: string,
  page: number = 0,
  pageSize: number = 10
) => {
  try {
    const res = await apiService.get(
      `/children?page=${page}&page_size=${pageSize}&region=${encodeURIComponent(region)}`
    );

    const data = res.data?.data || res.data || [];
    const items = Array.isArray(data) ? data : [];
    const pagination = {
      amount: res.data?.amount || items.length,
      page: res.data?.page || page,
      totalPages: res.data?.total_pages || 1,
    };

    return { items: items as ChildItem[], pagination };
  } catch (e) {
    console.warn("getChildrenByRegion failed", e);
    return { items: MOCK_CHILDREN as ChildItem[], pagination: { amount: MOCK_CHILDREN.length, page: 1, totalPages: 1 } };
  }
};

export const getChildrenByCampaign = async ({
  campaignId,
  region,
}: ChildrenQuery) => {
  try {
    let res;
    if (region) {
      // backend may support filtering children by region
      res = await apiService.get(
        `/children?region=${encodeURIComponent(region)}`,
      );
    } else {
      // fallback to listing children
      res = await apiService.get(`/children`);
    }

    const items = Array.isArray(res.data)
      ? res.data
      : res.data?.data || res.data;
    return items as ChildItem[];
  } catch (e) {
    // fallback to mock data when endpoint not available
    console.warn("getChildrenByCampaign failed, using mock data", e);
    return MOCK_CHILDREN as ChildItem[];
  }
};

export const getChildById = async (childId: string) => {
  try {
    const res = await apiService.get(`/children/${childId}`);
    const item = res.data?.data || res.data || res;
    return res.data as any;
  } catch (e) {
    console.warn('getChildById failed, using mock first child', e);
    return MOCK_CHILDREN[0];
  }
};

export type SupportedChildrenResponse = {
  data: any[];
  amount: number;
  page: number;
  total_pages: number;
};

export const getSupportedChildren = async (
  walletAddress: string,
  page = 1
): Promise<SupportedChildrenResponse> => {
  const res = await apiService.get<SupportedChildrenResponse>(
    `/children/user/${walletAddress}/supported`,
    { params: { page } }
  );
  return res.data;
};
