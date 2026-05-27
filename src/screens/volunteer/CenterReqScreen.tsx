import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '../../services/api.service';
import WalrusImage from '../../components/WalrusImage';
import { useAuth } from '../../hooks/useAuth';
import { useModal } from '../../context/ModalContext';

interface CenterReq {
  id: string;
  profile_id?: string;
  region: string;
  address?: string;
  phone_number?: string;
  image_blob_id?: string;
  approvers?: string[] | null;
  refusers?: string[] | null;
  refuse_reasons?: string[] | null;
  status: string;
  is_confirm_register?: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap }> = {
  pending:  { label: 'Đang chờ',  bg: '#FFF7ED', color: '#EA580C', icon: 'time-outline' },
  approved: { label: 'Đã duyệt',  bg: '#F0FDF4', color: '#16A34A', icon: 'checkmark-circle-outline' },
  rejected: { label: 'Từ chối',   bg: '#FEE2E2', color: '#DC2626', icon: 'close-circle-outline' },
  refused:  { label: 'Từ chối',   bg: '#FEE2E2', color: '#DC2626', icon: 'close-circle-outline' },
};

const formatDateTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const timeRemaining = (iso?: string): { label: string; expired: boolean } => {
  if (!iso) return { label: '—', expired: false };
  const closed = new Date(iso).getTime();
  if (isNaN(closed)) return { label: iso, expired: false };
  const diff = closed - Date.now();
  if (diff <= 0) return { label: 'Đã đóng', expired: true };
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return { label: `Còn ${mins} phút`, expired: false };
  const hours = Math.floor(mins / 60);
  if (hours < 24) return { label: `Còn ${hours} giờ`, expired: false };
  const days = Math.floor(hours / 24);
  return { label: `Còn ${days} ngày`, expired: false };
};

const shortenAddress = (a: string) =>
  a.length > 20 ? `${a.slice(0, 8)}…${a.slice(-6)}` : a;

const getStatusConfig = (status: string) =>
  STATUS_CONFIG[status?.toLowerCase()] ?? STATUS_CONFIG['pending'];

const fetchCenterReqs = async (page = 0, pageSize = 10): Promise<CenterReq[]> => {
  const res = await apiService.get(`/center-reqs?page=${page}&page_size=${pageSize}`);
  const data = res.data;
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
};

const voteForReq = async (
  id: string,
  isVoteYes: boolean,
  refuseReason = '',
): Promise<void> => {
  const res = await apiService.post(`/center-reqs/${id}/vote`, {
    is_vote_yes: isVoteYes,
    refuse_reason: refuseReason,
  });
  return res.data;
};

const CenterReqScreen = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const modal = useModal();
  const myWallet = user?.walletAddress?.toLowerCase() ?? null;
  const [items, setItems] = useState<CenterReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [voting, setVoting] = useState<{ id: string; vote: 'yes' | 'no' } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [refuseReason, setRefuseReason] = useState('');
  const [pendingRefuseId, setPendingRefuseId] = useState<string | null>(null);

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      setItems(await fetchCenterReqs());
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  const submitVote = async (
    id: string,
    isYes: boolean,
    reason = '',
  ) => {
    try {
      setVoting({ id, vote: isYes ? 'yes' : 'no' });
      await voteForReq(id, isYes, reason);
      setItems((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          if (isYes) {
            return { ...r, approvers: [...(r.approvers ?? []), myWallet ?? ''] };
          }
          return {
            ...r,
            refusers: [...(r.refusers ?? []), myWallet ?? ''],
            refuse_reasons: reason
              ? [...(r.refuse_reasons ?? []), reason]
              : r.refuse_reasons,
          };
        }),
      );
    } catch (e: any) {
      console.log(e);
      modal.error(
        'Lỗi',
        e?.response?.data?.message ||
          'Bình chọn thất bại. Vui lòng thử lại.',
      );
    } finally {
      setVoting(null);
    }
  };

  const handleVote = (item: CenterReq, isYes: boolean) => {
    if (!isYes) {
      // Voting "no" requires a reason — open the modal.
      setPendingRefuseId(item.id);
      setRefuseReason('');
      setShowRefuseModal(true);
      return;
    }
    modal.confirm(
      'Bình chọn',
      `Đồng ý với yêu cầu vùng "${item.region}"?`,
      () => submitVote(item.id, true),
    );
  };

  const handleSubmitRefuse = () => {
    if (!refuseReason.trim()) {
      modal.warning('Bắt buộc', 'Vui lòng cung cấp lý do từ chối.');
      return;
    }
    setShowRefuseModal(false);
    if (pendingRefuseId) {
      submitVote(pendingRefuseId, false, refuseReason.trim());
      setPendingRefuseId(null);
    }
  };

  const renderItem = ({ item }: { item: CenterReq }) => {
    const sc = getStatusConfig(item.status);
    const isVotingThis = voting?.id === item.id;
    const isVotingYes = isVotingThis && voting?.vote === 'yes';
    const isVotingNo = isVotingThis && voting?.vote === 'no';
    const isAnyVoting = voting !== null;
    const approvers = item.approvers ?? [];
    const refusers = item.refusers ?? [];
    const refuseReasons = item.refuse_reasons ?? [];
    const alreadyApproved =
      !!myWallet && approvers.some((a) => a.toLowerCase() === myWallet);
    const alreadyRefused =
      !!myWallet && refusers.some((a) => a.toLowerCase() === myWallet);
    const alreadyVoted = alreadyApproved || alreadyRefused;
    const remaining = timeRemaining(item.closed_at);
    const isPending = item.status?.toLowerCase() === 'pending';
    const canVote = isPending && !alreadyVoted && !remaining.expired;
    const isCreator =
      !!myWallet && item.created_by?.toLowerCase() === myWallet;

    return (
      <View style={styles.card}>
        {/* Image header */}
        {item.image_blob_id && (
          <WalrusImage
            blobId={item.image_blob_id}
            style={styles.heroImage}
            resizeMode="cover"
            fallbackIconSize={36}
          />
        )}

        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.iconWrap}>
            <Ionicons name="business" size={20} color="#1E40AF" />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.region}</Text>
            <View style={styles.subRow}>
              <Ionicons
                name={remaining.expired ? 'lock-closed-outline' : 'time-outline'}
                size={11}
                color={remaining.expired ? '#DC2626' : '#6B7280'}
              />
              <Text
                style={[
                  styles.cardSub,
                  remaining.expired && { color: '#DC2626' },
                ]}
              >
                {remaining.label}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Ionicons name={sc.icon} size={11} color={sc.color} />
            <Text style={[styles.statusBadgeText, { color: sc.color }]}>{sc.label}</Text>
          </View>
        </View>

        {/* Address */}
        {!!item.address && (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color="#6B7280" />
            <Text style={styles.metaText} numberOfLines={2}>{item.address}</Text>
          </View>
        )}

        {/* Phone */}
        {!!item.phone_number && (
          <View style={styles.metaRow}>
            <Ionicons name="call-outline" size={13} color="#6B7280" />
            <Text style={styles.metaText}>{item.phone_number}</Text>
          </View>
        )}

        {/* Created date */}
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color="#6B7280" />
          <Text style={styles.metaText}>Tạo ngày {formatDateTime(item.created_at)}</Text>
        </View>

        {/* Vote summary */}
        <View style={styles.voteSummaryRow}>
          <View style={[styles.voteChip, styles.voteApproveChip]}>
            <Ionicons name="thumbs-up" size={12} color="#16A34A" />
            <Text style={styles.voteApproveText}>{approvers.length} đồng ý</Text>
          </View>
          <View style={[styles.voteChip, styles.voteRefuseChip]}>
            <Ionicons name="thumbs-down" size={12} color="#DC2626" />
            <Text style={styles.voteRefuseText}>{refusers.length} từ chối</Text>
          </View>
          {item.is_confirm_register && (
            <View style={[styles.voteChip, styles.confirmChip]}>
              <Ionicons name="checkmark-circle" size={12} color="#1E40AF" />
              <Text style={styles.confirmText}>Đã xác nhận đăng ký</Text>
            </View>
          )}
        </View>

        {/* Refuse reasons */}
        {refuseReasons.length > 0 && (
          <View style={styles.reasonCard}>
            <View style={styles.reasonHeader}>
              <Ionicons name="alert-circle-outline" size={13} color="#DC2626" />
              <Text style={styles.reasonLabel}>Lý do từ chối</Text>
            </View>
            {refuseReasons.map((r, i) => (
              <Text key={i} style={styles.reasonText}>• {r}</Text>
            ))}
          </View>
        )}

        {/* Footer: vote button */}
        <View style={styles.cardFooter}>
          {isCreator ? (
            <View style={styles.creatorBadge}>
              <Ionicons name="person-outline" size={13} color="#6B7280" />
              <Text style={styles.creatorText}>Bạn là người tạo</Text>
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          <View style={styles.voteButtonRow}>
            <TouchableOpacity
              style={[
                styles.voteNoButton,
                (!canVote || isAnyVoting) && styles.voteButtonDisabled,
              ]}
              onPress={() => handleVote(item, false)}
              disabled={!canVote || isAnyVoting}
              activeOpacity={0.85}
            >
              {isVotingNo ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name={alreadyRefused ? 'checkmark' : 'thumbs-down'}
                    size={15}
                    color="#FFFFFF"
                  />
                  <Text style={styles.voteButtonText}>
                    {alreadyRefused ? 'Đã từ chối' : 'Từ chối'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.voteButton,
                (!canVote || isAnyVoting) && styles.voteButtonDisabled,
              ]}
              onPress={() => handleVote(item, true)}
              disabled={!canVote || isAnyVoting}
              activeOpacity={0.85}
            >
              {isVotingYes ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name={alreadyApproved ? 'checkmark' : 'thumbs-up'}
                    size={15}
                    color="#FFFFFF"
                  />
                  <Text style={styles.voteButtonText}>
                    {alreadyApproved
                      ? 'Đã đồng ý'
                      : remaining.expired
                      ? 'Đã đóng'
                      : !isPending
                      ? sc.label
                      : 'Đồng ý'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Yêu cầu trung tâm</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text style={styles.loadingText}>Đang tải yêu cầu…</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Yêu cầu trung tâm</Text>
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={52} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadData()}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yêu cầu trung tâm</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(true); }}
            tintColor="#1E40AF"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={52} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Không có yêu cầu nào</Text>
            <Text style={styles.emptySubtitle}>Kéo xuống để làm mới.</Text>
          </View>
        }
      />

      <Modal
        visible={showRefuseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRefuseModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Lý do từ chối</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowRefuseModal(false);
                  setPendingRefuseId(null);
                }}
              >
                <Ionicons name="close" size={22} color="#111827" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Vui lòng nêu lý do bạn từ chối yêu cầu này.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={refuseReason}
              onChangeText={setRefuseReason}
              placeholder="Nhập lý do…"
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => {
                  setShowRefuseModal(false);
                  setPendingRefuseId(null);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalSubmitBtn]}
                onPress={handleSubmitRefuse}
                activeOpacity={0.85}
              >
                <Text style={styles.modalSubmitText}>Gửi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.5)',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  loadingText: { fontSize: 15, color: '#64748B', fontWeight: '500' },
  errorText: { fontSize: 15, color: '#DC2626', fontWeight: '600', textAlign: 'center' },
  retryBtn: {
    backgroundColor: '#1E40AF', paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: 10, marginTop: 4,
  },
  retryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  listContent: { padding: 16, paddingBottom: 32 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  heroImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  voteSummaryRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    marginTop: 8, marginBottom: 4,
  },
  voteChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16,
    borderWidth: 1,
  },
  voteApproveChip: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  voteApproveText: { fontSize: 11, fontWeight: '700', color: '#16A34A' },
  voteRefuseChip: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  voteRefuseText: { fontSize: 11, fontWeight: '700', color: '#DC2626' },
  confirmChip: { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' },
  confirmText: { fontSize: 11, fontWeight: '700', color: '#1E40AF' },
  reasonCard: {
    marginTop: 10, padding: 12, borderRadius: 12,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
  },
  reasonHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  reasonLabel: {
    fontSize: 11, fontWeight: '700', color: '#DC2626',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  reasonText: { fontSize: 13, color: '#7F1D1D', lineHeight: 19 },
  creatorBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  creatorText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },

  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', lineHeight: 20 },
  cardSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
    flexShrink: 0,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  metaText: { fontSize: 12, color: '#6B7280' },
  description: { fontSize: 13, color: '#4B5563', lineHeight: 20, marginBottom: 12 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  voteCount: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  voteCountText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  voteButtonRow: { flexDirection: 'row', gap: 8 },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E40AF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    minWidth: 80,
    justifyContent: 'center',
  },
  voteNoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    minWidth: 80,
    justifyContent: 'center',
  },
  voteButtonDisabled: { opacity: 0.6 },
  voteButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 28,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  modalSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  modalInput: {
    minHeight: 110,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: { backgroundColor: '#F1F5F9' },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: '#374151' },
  modalSubmitBtn: { backgroundColor: '#DC2626' },
  modalSubmitText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});

export default CenterReqScreen;
