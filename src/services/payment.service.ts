import { apiService } from "./api.service";

export type DonatePayload = {
  amount: number;
  message: string;
  pool_id: string;
};

export type DonateResponse = {
  url: string;
};

export const donateToPool = async (
  payload: DonatePayload,
): Promise<DonateResponse> => {
  const response = await apiService.post<DonateResponse>(
    "/payments/donate",
    payload,
  );
  return response.data;
};

export type ExecuteTxPayload = {
  center_req?: string;
  proposal_id?: string;
  registration_req?: string;
  signature: string;
  tx_bytes: string;
  upload_child_req?: string;
};

export type ExecuteTxResponse = {
  [key: string]: any;
};

export const executeTransaction = async (
  payload: ExecuteTxPayload,
): Promise<ExecuteTxResponse> => {
  try {
    console.log(payload)
    const response = await apiService.post<ExecuteTxResponse>(
      "/tx/execute",
      payload,
    );
    return response.data;
  } catch (error) {
    console.error("Transaction execution failed:", error);
    throw error;
  }
};

export const fakePaymentCallback = async (): Promise<any> => {
  const response = await apiService.get("/payments/fake-callback");
  return response.data;
};

export type PaymentTransaction = {
  [key: string]: any;
};

export type PaymentListResponse = {
  data: PaymentTransaction[];
  total?: number;
  page?: number;
  page_size?: number;
};

export const getPaymentsByActor = async (
  actor: string,
  page = 0,
  pageSize = 10,
): Promise<PaymentListResponse> => {
  const response = await apiService.get<PaymentListResponse>("/payments", {
    params: { actor, page, page_size: pageSize },
  });
  return response.data;
};
