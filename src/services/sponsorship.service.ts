import { apiService } from './api.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Guardian = {
  guardian_full_name: string;
  guardian_phone_number: string;
  guardian_relation: string;
  identity_card_blob_id: string;
};

export type ChildDetail = {
  id: string;
  identity_code: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  home_address: string;
  region: string;
  avatar_blob_id: string;
  home_blob_id: string;
  first_guardian: Guardian;
  second_guardian: Guardian;
  image_blob_ids: string[];
  upload_image_periods: string[];
  dynamic_fields: string[];
  books_needs: string[];
  health_insurance_need: string;
  meal_need: string;
  special_need_proposals: string[];
  special_need_campaigns: string[];
  gifts: string[];
  uploaded_by: string;
  uploaded_at: string;
  updated_at: string;
  dynamic_values: Record<string, number>;
};

export type SupportType = 'books' | 'meals' | 'health' | null;

export type SponsorPayload =
  | { type: 'books'; childId: string }
  | { type: 'meals'; childId: string; months: number }
  | { type: 'health'; childId: string };

// ─── API Calls ────────────────────────────────────────────────────────────────

export const getChildById = async (childId: string): Promise<ChildDetail> => {
  try {
    const res = await apiService.get<ChildDetail>(`/children/${childId}`);
    return res.data;
  } catch (error) {
    console.error(`Failed to fetch child ${childId}:`, error);
    throw error;
  }
};

export type BookNeedDetail = {
  value: number;
  description?: string;
  semester?: number;
  year?: number;
  supported_years?: number[];
  donations?: string[];
  donations_by_semester?: Record<string, string[]>;
};

export type MealNeedDetail = {
  value: number;
  description?: string;
  durations?: { start_period: string; end_period: string }[];
  supported_years?: { year: number; supported_months: number }[];
};

export type HealthInsuranceNeedDetail = {
  value: number;
  description?: string;
  semester?: number;
  year?: number;
  supported_years?: number[];
  donations?: string[];
};

/**
 * GET /child-needs/books-need/{id}
 * Fetches books need details for a child, including the donation amount.
 */
export const getBookNeedDetails = async (childId: string): Promise<BookNeedDetail> => {
  try {
    const res = await apiService.get(`/child-needs/books-need/${childId}`);
    return res.data;
  } catch (error) {
    console.error(`Failed to fetch books need details for child ${childId}:`, error);
    // Return default value if API fails (VND)
    return { value: 350000, description: 'Per Semester' };
  }
};

/**
 * GET /child-needs/meal-need/{id}
 * Fetches meal need details for a child, including the monthly donation amount.
 */
export const getMealNeedDetails = async (childId: string): Promise<MealNeedDetail> => {
  try {
    const res = await apiService.get(`/child-needs/meal-need/${childId}`);
    return res.data;
  } catch (error) {
    console.error(`Failed to fetch meal need details for child ${childId}:`, error);
    return { value: 100000, description: 'Per Month' };
  }
};

export type MealNeedProof = {
  id: string;
  value: number;
  year: number;
  total_supported_months: number;
  donations: string[];
  donors: string[];
  durations: { start_period: string; end_period: string }[];
  provide_dates: string[];
  provide_image_blob_ids: string[];
  provide_periods: string[];
  provide_staffs: string[];
  supported_years: { year: number; supported_months: number }[];
  withdraw_proposals: string[];
  withdraws_for_need: string[];
};

export const getMealNeedProof = async (mealNeedId: string): Promise<MealNeedProof> => {
  const res = await apiService.get<MealNeedProof>(`/child-needs/meal-need/${mealNeedId}`);
  return res.data;
};

/**
 * GET /child-needs/health-insurance-need/{id}
 * Fetches health insurance need details for a child, including the donation amount.
 */
export const getHealthInsuranceNeedDetails = async (childId: string): Promise<HealthInsuranceNeedDetail> => {
  try {
    const res = await apiService.get(`/child-needs/health-insurance-need/${childId}`);
    return res.data;
  } catch (error) {
    console.error(`Failed to fetch health insurance need details for child ${childId}:`, error);
    // Return default value if API fails
    return { value: 0, description: 'Custom Amount' };
  }
};

/**
 * POST /children/books-need/{id}/support
 * Supports the books need for a child.
 */
export type SponsorResponse = { url: string, payment_id?: string | number, order_code?: string | number, id?: string | number };

export const supportBooksNeed = async (childId: string): Promise<SponsorResponse> => {
  const res = await apiService.post(`/children/books-need/${childId}/support`, {});
  return res.data;
};

export const supportMealNeed = async (
  childId: string,
  months: number
): Promise<SponsorResponse> => {
  const res = await apiService.post(`/children/meal-need/${childId}/support`, { months });
  return res.data;
};

export const supportHealthInsuranceNeed = async (childId: string): Promise<SponsorResponse> => {
  const res = await apiService.post(
    `/children/health-insurance-need/${childId}/support`,
    {}
  );
  return res.data;
};

export const submitSponsorship = async (payload: SponsorPayload): Promise<SponsorResponse> => {
  switch (payload.type) {
    case 'books':
      return supportBooksNeed(payload.childId);
    case 'meals':
      return supportMealNeed(payload.childId, payload.months);
    case 'health':
      return supportHealthInsuranceNeed(payload.childId);
    default:
      throw new Error('Invalid support type');
  }
};