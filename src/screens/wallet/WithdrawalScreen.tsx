import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MappedWithdrawal,
  getWithdrawalProposals,
  voteWithdrawalProposal,
  mapWithdrawalProposal,
} from '../../services/withdrawal.service';

const STATUS_COLORS: Record<MappedWithdrawal['status'], string> = {
  executed: '#10b981',
  approved: '#3b82f6',
  rejected: '#ef4444',
  pending: '#f59e0b',
};

const STATUS_LABELS: Record<MappedWithdrawal['status'], string> = {
  executed: 'Executed',
  approved: 'Approved',
  rejected: 'Rejected',
  pending: 'Pending',
};

const WithdrawalScreen = () => {
  const insets = useSafeAreaInsets();
  const [withdrawals, setWithdrawals] = useState<MappedWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [refuseReason, setRefuseReason] = useState('');
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);

  const fetchWithdrawals = useCallback(async (pageNum: number, append = false) => {
    try {
      append ? setLoadingMore(true) : setLoading(true);
      setError(null);

      const response = await getWithdrawalProposals(pageNum, 10);
      console.log(response)
      const mapped = response.data.map(mapWithdrawalProposal);

      setWithdrawals(prev => (append ? [...prev, ...mapped] : mapped));
      setTotalPages(response.total_pages);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch withdrawal proposals');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchWithdrawals(0);
  }, [fetchWithdrawals]);

  const handleLoadMore = () => {
    if (!loadingMore && page + 1 < totalPages) {
      fetchWithdrawals(page + 1, true);
    }
  };

  const handleVote = (id: string, voteType: 'for' | 'against', reason?: string) => {
    if (voteType === 'against' && !reason) {
      // Open modal for refusal reason when voting against
      setSelectedProposalId(id);
      setRefuseReason('');
      setShowRefuseModal(true);
      return;
    }

    Alert.alert(
      'Confirm Vote',
      `Vote ${voteType === 'for' ? 'FOR' : 'AGAINST'} this withdrawal?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await voteWithdrawalProposal(
                id,
                voteType === 'for' ? 'approve' : 'refuse',
                reason
              );
              Alert.alert('Vote Recorded', 'Your vote has been submitted successfully.');
              fetchWithdrawals(0);
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.message || 'Failed to submit vote. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const handleSubmitRefuseReason = () => {
    if (!refuseReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for voting against.');
      return;
    }
    setShowRefuseModal(false);
    if (selectedProposalId) {
      handleVote(selectedProposalId, 'against', refuseReason);
    }
  };

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const totalAmountVND = withdrawals
    .reduce((sum, w) => {
      const raw = parseInt(w.amount.replace(/[^0-9]/g, ''), 10);
      return sum + (isNaN(raw) ? 0 : raw);
    }, 0)
    .toLocaleString('vi-VN');

  const renderCard = ({ item }: { item: MappedWithdrawal }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.badgeRow}>
          {item.verified && (
            <View style={styles.localPoolBadge}>
              <MaterialIcons name="shield" size={12} color="#065f46" />
              <Text style={styles.localPoolText}>Local Pool</Text>
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
            <Text style={styles.statusText}>{STATUS_LABELS[item.status]}</Text>
          </View>
        </View>
        <View style={styles.timerBadge}>
          <MaterialIcons name="access-time" size={12} color="#64748b" />
          <Text style={styles.timeRemaining}>{item.timeRemaining}</Text>
        </View>
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

      <View style={styles.amountRow}>
        <Text style={styles.amountVND}>{item.amount}</Text>
        <Text style={styles.amountUSD}>{item.amountUSD}</Text>
      </View>

      <View style={styles.evidenceCard}>
        <Image source={{ uri: 'https://via.placeholder.com/48' }} style={styles.evidenceImage} />
        <View style={styles.evidenceTextBlock}>
          <Text style={styles.evidenceTitle} numberOfLines={1}>{item.description}</Text>
          <Text style={styles.evidenceSubtitle}>Verified Source</Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color="#1e40af" />
      </View>

      {item.status === 'rejected' && item.refuseReasons.length > 0 && (
        <View style={styles.rejectReasonBox}>
          <MaterialIcons name="info-outline" size={14} color="#b91c1c" />
          <Text style={styles.rejectReasonText} numberOfLines={2}>
            {item.refuseReasons[0]}
          </Text>
        </View>
      )}

      {item.status === 'pending' && (
        <View style={styles.voteSection}>
          <View style={styles.voteLabels}>
            <Text style={styles.voteForLabel}>{item.voteForPct}% FOR</Text>
            <Text style={styles.voteAgainstLabel}>{item.voteAgainstPct}% AGAINST</Text>
          </View>
          <View style={styles.voteTrack}>
            <View style={[styles.voteBarFor, { flex: Math.max(item.voteForPct, 5) }]} />
            <View style={[styles.voteBarAgainst, { flex: Math.max(item.voteAgainstPct, 5) }]} />
          </View>
          <View style={styles.quorumRow}>
            <MaterialIcons name="groups" size={12} color="#64748b" />
            <Text style={styles.quorumText}>Quorum: 50% Required</Text>
          </View>
          <View style={styles.voteButtons}>
            <TouchableOpacity
              style={styles.btnFor}
              onPress={() => handleVote(item.id, 'for')}
              activeOpacity={0.85}
            >
              <MaterialIcons name="thumb-up" size={16} color="white" />
              <Text style={styles.btnText}>Vote For</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnAgainst}
              onPress={() => handleVote(item.id, 'against')}
              activeOpacity={0.85}
            >
              <MaterialIcons name="thumb-down" size={16} color="white" />
              <Text style={styles.btnText}>Against</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <>
      <View style={[styles.container]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Withdrawals</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => fetchWithdrawals(0)}
            disabled={loading}
          >
            <MaterialIcons name="refresh" size={22} color="#1e40af" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#1e40af" />
            <Text style={styles.loadingText}>Loading proposals…</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <MaterialIcons name="error-outline" size={52} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchWithdrawals(0)}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <MaterialIcons name="account-balance-wallet" size={20} color="white" />
              <Text style={styles.summaryLabel}>Active Proposals</Text>
            </View>
            <Text style={styles.summaryBig}>{pendingCount} Open Votes</Text>
            <Text style={styles.summarySub}>Total in pool: {totalAmountVND} VND</Text>
            <View style={styles.verifiedTrustBadge}>
              <MaterialIcons name="verified" size={14} color="white" />
              <Text style={styles.verifiedTrustText}>Verified Treasury</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Disbursement Requests</Text>
              <View style={styles.realTimeDot}>
                <View style={styles.dot} />
                <Text style={styles.realTimeText}>Live</Text>
              </View>
            </View>

            {withdrawals.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialIcons name="inbox" size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>No withdrawal proposals found</Text>
              </View>
            ) : (
              <FlatList
                data={withdrawals}
                renderItem={renderCard}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
            )}

            {page + 1 < totalPages && (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#1e40af" />
                ) : (
                  <>
                    <Text style={styles.loadMoreText}>Load More</Text>
                    <Text style={styles.loadMoreSub}>Page {page + 1} of {totalPages}</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
      </View>

      {/* Refuse Reason Modal */}
      <Modal
        visible={showRefuseModal}
        animationType="fade"
        transparent
        onRequestClose={() => {
          setShowRefuseModal(false);
          setRefuseReason('');
        }}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Refusal Reason</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowRefuseModal(false);
                    setRefuseReason('');
                  }}
                >
                  <MaterialIcons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Please explain why you are voting against this withdrawal proposal
              </Text>

              <TextInput
                style={styles.reasonInput}
                placeholder="Enter your reason..."
                placeholderTextColor="#cbd5e1"
                multiline
                numberOfLines={4}
                maxLength={500}
                value={refuseReason}
                onChangeText={setRefuseReason}
                textAlignVertical="top"
              />

              <Text style={styles.charCount}>
                {refuseReason.length}/500
              </Text>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowRefuseModal(false);
                    setRefuseReason('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    !refuseReason.trim() && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmitRefuseReason}
                  disabled={!refuseReason.trim()}
                >
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e40af' },
  refreshButton: { padding: 6 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },
  loadingText: { fontSize: 15, color: '#64748b', fontWeight: '500' },
  errorText: { fontSize: 15, color: '#dc2626', fontWeight: '600', textAlign: 'center' },
  retryBtn: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  retryBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },
  summaryCard: { margin: 16, padding: 24, backgroundColor: '#1e40af', borderRadius: 20, gap: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryLabel: {
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  summaryBig: { fontSize: 30, fontWeight: '800', color: 'white' },
  summarySub: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.75)' },
  verifiedTrustBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12,
    paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  verifiedTrustText: {
    fontSize: 11, fontWeight: '700', color: 'white',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  section: { paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  realTimeDot: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  realTimeText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  card: {
    backgroundColor: 'white', borderRadius: 16, padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  badgeRow: { flexDirection: 'row', gap: 6, flexShrink: 1 },
  localPoolBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  localPoolText: { fontSize: 10, fontWeight: '700', color: '#065f46', textTransform: 'uppercase' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '700', color: 'white', textTransform: 'uppercase' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeRemaining: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', lineHeight: 22, marginBottom: 10 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 14 },
  amountVND: { fontSize: 18, fontWeight: '800', color: '#1e40af' },
  amountUSD: { fontSize: 13, fontWeight: '500', color: '#64748b' },
  evidenceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f1f5f9', borderRadius: 12, padding: 12,
    marginBottom: 14, borderWidth: 1, borderColor: '#e2e8f0',
  },
  evidenceImage: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' },
  evidenceTextBlock: { flex: 1 },
  evidenceTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  evidenceSubtitle: { fontSize: 11, color: '#64748b', marginTop: 2 },
  rejectReasonBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#fef2f2', borderRadius: 10, padding: 10,
    marginBottom: 14, borderWidth: 1, borderColor: '#fecaca',
  },
  rejectReasonText: { flex: 1, fontSize: 12, color: '#b91c1c', lineHeight: 17 },
  voteSection: { gap: 10 },
  voteLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  voteForLabel: { fontSize: 10, fontWeight: '700', color: '#1e40af', textTransform: 'uppercase' },
  voteAgainstLabel: { fontSize: 10, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  voteTrack: {
    flexDirection: 'row', height: 8, borderRadius: 4,
    overflow: 'hidden', backgroundColor: '#e2e8f0',
  },
  voteBarFor: { backgroundColor: '#1e40af' },
  voteBarAgainst: { backgroundColor: '#cbd5e1' },
  quorumRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  quorumText: {
    fontSize: 10, fontWeight: '600', color: '#64748b',
    textTransform: 'uppercase', letterSpacing: 0.3,
  },
  voteButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btnFor: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1e40af', paddingVertical: 13, borderRadius: 12, gap: 6,
  },
  btnAgainst: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#dc2626', paddingVertical: 13, borderRadius: 12, gap: 6,
  },
  btnText: { fontSize: 15, fontWeight: '700', color: 'white' },
  loadMoreBtn: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 14,
    marginBottom: 8, borderRadius: 12, borderWidth: 1.5, borderColor: '#1e40af', gap: 2,
  },
  loadMoreText: { fontSize: 14, fontWeight: '700', color: '#1e40af' },
  loadMoreSub: { fontSize: 11, color: '#94a3b8' },
  emptyBox: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  emptyText: { fontSize: 15, color: '#94a3b8', fontWeight: '500' },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    marginBottom: 50,
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 8,
    fontFamily: 'System',
    backgroundColor: '#f8fafc',
  },
  charCount: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 16,
    textAlign: 'right',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748b',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1e40af',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#cbd5e1',
    opacity: 1,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
});

export default WithdrawalScreen;