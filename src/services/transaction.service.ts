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

const formatRelativeTime = (isoDate: string): string => {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;

  const mins = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const shortenAddress = (address: string): string => {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const mapTxRecord = (tx: TxRecord): MappedTransaction => {
  const isDeposit = tx.action_type === 'Deposit';
  return {
    id: tx.id,
    address: shortenAddress(tx.actor_address),
    time: formatRelativeTime(tx.created_at),
    type: isDeposit ? 'inflow' : 'outflow',
    amount: `${isDeposit ? '+' : '-'}${tx.amount.toLocaleString('vi-VN')}`,
    description: tx.message,
    category: tx.pool_name,
    poolName: tx.pool_name,
    coinType: tx.coin_type,
    rawAmount: tx.amount,
  };
};

// ─── API Calls ────────────────────────────────────────────────────────────────

export const getTxRecords = async (
  page = 0,
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