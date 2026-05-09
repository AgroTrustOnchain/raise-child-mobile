import { apiService } from './api.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WithdrawalProposal = {
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
};

export type WithdrawalProposalsResponse = {
  data: WithdrawalProposal[];
  amount: number;
  page: number;
  total_pages: number;
};

export type MappedWithdrawal = {
  id: string;
  title: string;
  amount: string;
  amountUSD: string;
  timeRemaining: string;
  voteForPct: number;
  voteAgainstPct: number;
  approveWeight: number;
  refuseWeight: number;
  verified: boolean;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  refuseReasons: string[];
  approvers: string[];
  refusers: string[];
  createdAt: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const GO_ZERO_TIME = '0001-01-01';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isValidDate = (dateStr: string): boolean =>
  Boolean(dateStr) && !dateStr.startsWith(GO_ZERO_TIME);

const calcTimeRemaining = (closedAt: string): string => {
  if (!isValidDate(closedAt)) return 'Open';

  const now = new Date();
  const closed = new Date(closedAt);
  if (closed <= now) return 'Closed';

  const diffMs = closed.getTime() - now.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

const deriveStatus = (proposal: WithdrawalProposal): MappedWithdrawal['status'] => {
  if (proposal.is_executed) return 'executed';
  if (proposal.refuse_weight > 0 && proposal.refusers.length > 0) return 'rejected';
  if (proposal.approve_weight > 0) return 'approved';
  return 'pending';
};

export const mapWithdrawalProposal = (proposal: WithdrawalProposal): MappedWithdrawal => {
  const totalWeight = proposal.approve_weight + proposal.refuse_weight;
  const voteForPct =
    totalWeight > 0 ? Math.round((proposal.approve_weight / totalWeight) * 100) : 0;
  const voteAgainstPct =
    totalWeight > 0 ? Math.round((proposal.refuse_weight / totalWeight) * 100) : 0;

  const amountUSD = Math.round(proposal.withdraw_amount / 24000);

  return {
    id: proposal.id,
    title: proposal.description,
    amount: `${proposal.withdraw_amount.toLocaleString('vi-VN')} VND`,
    amountUSD: `≈ $${amountUSD.toLocaleString('en-US')} USD`,
    timeRemaining: calcTimeRemaining(proposal.closed_at),
    voteForPct,
    voteAgainstPct,
    approveWeight: proposal.approve_weight,
    refuseWeight: proposal.refuse_weight,
    verified: proposal.is_from_local_pool,
    description: `${proposal.pool_name} — ${proposal.creator}`,
    status: deriveStatus(proposal),
    refuseReasons: proposal.refuse_reasons,
    approvers: proposal.approvers ?? [],
    refusers: proposal.refusers ?? [],
    createdAt: proposal.created_at,
  };
};

// ─── API Calls ────────────────────────────────────────────────────────────────

export const getWithdrawalProposals = async (
  page = 0,
  pageSize = 10
): Promise<WithdrawalProposalsResponse> => {
  try {
    const res = await apiService.get<WithdrawalProposalsResponse>(
      `/withdraw-proposals?page=${page}&page_size=${pageSize}`
    );
    return res.data;
  } catch (error) {
    console.error('Failed to fetch withdrawal proposals:', error);
    throw error;
  }
};

export const getWithdrawalProposalById = async (id: string): Promise<WithdrawalProposal> => {
  try {
    const res = await apiService.get<WithdrawalProposal>(`/withdraw-proposals/${id}`);
    return res.data;
  } catch (error) {
    console.error(`Failed to fetch withdrawal proposal ${id}:`, error);
    throw error;
  }
};

export const voteWithdrawalProposal = async (
  id: string,
  voteType: 'approve' | 'refuse',
  refuseReason?: string
): Promise<void> => {
  try {
    const isVoteYes = voteType === 'approve';
    const queryParams = new URLSearchParams({
      is_vote_yes: isVoteYes.toString(),
      ...(refuseReason && !isVoteYes ? { refuse_reason: refuseReason } : { refuse_reason: '' }),
    });

    await apiService.post(`/withdraw-proposals/${id}/vote?${queryParams.toString()}`, '');
  } catch (error) {
    console.error(`Failed to ${voteType} withdrawal proposal ${id}:`, error);
    throw error;
  }
};