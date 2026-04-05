export interface WithdrawalProposal {
  id: string;
  pool_name: string;
  creator: string;
  withdraw_amount: number;
  description: string;
  approvers: string[];
  refusers: string[];
  approve_weight: number;
  refuse_weight: number;
  refuse_reasons: string[];
  is_executed: boolean;
  is_from_local_pool: boolean;
  approved_periods: string[];
  refused_periods: string[];
  created_at: string;
  updated_at: string;
  closed_at: string;
}

export interface WithdrawalProposalsResponse {
  data: WithdrawalProposal[];
  amount: number;
  page: number;
  total_pages: number;
}
