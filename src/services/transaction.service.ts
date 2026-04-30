import { apiService } from './api.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TxRecord = {
  id: string;
  actor_address: string;
  action_type: 'Deposit' | 'Withdraw' | string;
  pool_name: string;
  amount: number;
  message: string;
  coin_type: string;
  created_at: string;
};

export type TxRecordsResponse = {
  data: TxRecord[];
  amount: number;
  page: number;
  total_pages: number;
};

export type MappedTransaction = {
  id: string;
  address: string;
  time: string;
  type: 'inflow' | 'outflow';
  amount: string;
  description: string;
  category: string;
  poolName: string;
  coinType: string;
  rawAmount: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INFLOW_TYPES = new Set(['Deposit', 'Donate', 'donate', 'deposit']);

const formatRelativeTime = (isoDate: string): string => {
  if (!isoDate) return '—';
  const then = new Date(isoDate).getTime();
  if (isNaN(then) || then <= 0) return '—';

  const diffMs = Date.now() - then;
  if (diffMs < 0) return '—';

  const mins = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Anything older than a year is almost certainly a placeholder/epoch date.
  if (days > 365) return '—';

  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  return `${days} ngày trước`;
};

const shortenAddress = (address: string): string => {
  if (!address) return '';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
};

export const mapTxRecord = (tx: TxRecord): MappedTransaction => {
  const isInflow = INFLOW_TYPES.has(tx.action_type);
  const poolName = tx.pool_name?.trim() || 'Quỹ chung';
  return {
    id: tx.id,
    address: shortenAddress(tx.actor_address),
    time: formatRelativeTime(tx.created_at),
    type: isInflow ? 'inflow' : 'outflow',
    amount: `${isInflow ? '+' : '-'}${tx.amount.toLocaleString('vi-VN')}`,
    description: tx.message?.trim() || tx.action_type,
    category: poolName,
    poolName,
    coinType: tx.coin_type,
    rawAmount: tx.amount,
  };
};

// ─── API Calls ────────────────────────────────────────────────────────────────

export const getTxRecords = async (
  page = 1,
  pageSize = 10
): Promise<TxRecordsResponse> => {
  try {
    const res = await apiService.get<TxRecordsResponse>(
      `/tx-records?page=${page}&page_size=${pageSize}`
    );
    return res.data;
  } catch (error) {
    console.error('Failed to fetch transaction records:', error);
    throw error;
  }
};