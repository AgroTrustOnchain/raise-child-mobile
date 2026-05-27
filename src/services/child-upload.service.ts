import { apiService } from "./api.service";

export interface GuardianPayload {
  guardian_full_name: string;
  guardian_phone_number: string;
  guardian_relation: string;
  identity_card_blob_id: string;
  // identity_card_base64: string;
}

export interface ChildUploadReqPayload {
  avatar_blob_id: string;
  // avatar_base64: string;
  birth_certificate_blob_id: string;
  // birth_certificate_base64: string;
  date_of_birth: string;
  first_guardian: GuardianPayload;
  first_name: string;
  gender: string;
  home_address: string;
  home_blob_id: string;
  // home_base64: string;
  identity_code: string;
  last_name: string;
  region: string;
  second_guardian?: GuardianPayload;
}

export interface ChildUploadReqResponse {
  success?: boolean;
  message?: string;
  data?: any;
  [key: string]: any;
}

export const submitChildUploadRequest = async (
  payload: ChildUploadReqPayload,
): Promise<ChildUploadReqResponse> => {
  try {
    const response = await apiService.post<ChildUploadReqResponse>(
      "/child-upload-reqs",
      payload,
      { headers: { "Content-Type": "application/json" } },
    );
    return response.data;
  } catch (error) {
    console.error("Child upload request submission error:", error);
    throw error;
  }
};
