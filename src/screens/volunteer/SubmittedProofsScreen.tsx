import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useWallet } from '../../context/WalletContext';
import {
  getTaskProofsByActor,
  TaskProof,
} from '../../services/task-proofs.service';
import WalrusImage from '../../components/WalrusImage';

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

const statusStyle = (raw?: string) => {
  const s = (raw || '').toLowerCase();
  if (s === 'approved') {
    return { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', label: 'Approved' };
  }
  if (s === 'rejected') {
    return { color: '#DC2626', bg: '#FEE2E2', border: '#FECACA', label: 'Rejected' };
  }
  return { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'Pending' };
};

const formatDateTime = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const SubmittedProofsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { wallet } = useWallet();

  const [proofs, setProofs] = useState<TaskProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchProofs = useCallback(async () => {
    if (!wallet?.address) {
      setProofs([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const res = await getTaskProofsByActor(wallet.address);
      setProofs(res.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load submitted proofs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [wallet?.address]);

  useEffect(() => {
    setLoading(true);
    fetchProofs();
  }, [fetchProofs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProofs();
  };

  const filtered = proofs.filter((p) => {
    if (filter === 'all') return true;
    return (p.review_status || '').toLowerCase() === filter;
  });

  const counts = {
    all: proofs.length,
    pending: proofs.filter((p) => (p.review_status || '').toLowerCase() === 'pending').length,
    approved: proofs.filter((p) => (p.review_status || '').toLowerCase() === 'approved').length,
    rejected: proofs.filter((p) => (p.review_status || '').toLowerCase() === 'rejected').length,
  };

  const renderItem = ({ item }: { item: TaskProof }) => {
    const s = statusStyle(item.review_status);

    return (
      <View style={styles.card}>
        <View style={[styles.accentBar, { backgroundColor: s.color }]} />
        <View style={styles.cardBody}>
          <View style={styles.headerRow}>
            <WalrusImage blobId={item.image_blob_id} style={styles.thumb} />
            <View style={{ flex: 1 }}>
              <Text style={styles.description} numberOfLines={2}>
                {item.description || `Task ${item.task_id}`}
              </Text>
              <Text style={styles.taskId}>ID: {item.task_id}</Text>
            </View>
            <View
              style={[
                styles.badge,
                { backgroundColor: s.bg, borderColor: s.border },
              ]}
            >
              <Text style={[styles.badgeText, { color: s.color }]}>
                {s.label}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={13} color="#6B7280" />
            <Text style={styles.metaText}>
              {formatDateTime(item.created_at) || item.raw_submit_date || '—'}
            </Text>
          </View>

          {!!item.ai_evaluation && (
            <View style={styles.aiRow}>
              <Ionicons name="sparkles-outline" size={13} color="#1E40AF" />
              <Text style={styles.aiText} numberOfLines={2}>
                {item.ai_evaluation}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderFilterChip = (key: FilterType, label: string, count: number) => (
    <TouchableOpacity
      key={key}
      style={[styles.filterChip, filter === key && styles.filterChipActive]}
      onPress={() => setFilter(key)}
      activeOpacity={0.85}
    >
      <Text
        style={[styles.filterChipText, filter === key && styles.filterChipTextActive]}
      >
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submitted Proofs</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.filtersWrap}>
        {renderFilterChip('all', 'All', counts.all)}
        {renderFilterChip('pending', 'Pending', counts.pending)}
        {renderFilterChip('approved', 'Approved', counts.approved)}
        {renderFilterChip('rejected', 'Rejected', counts.rejected)}
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text style={styles.loadingText}>Loading submitted proofs…</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle" size={56} color="#DC2626" />
          <Text style={styles.emptyTitle}>Could not load proofs</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchProofs}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1E40AF"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={56} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No proofs yet</Text>
              <Text style={styles.emptyText}>
                Submitted welfare updates will appear here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#1E40AF',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },

  filtersWrap: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8FAFF',
  },
  filterChipActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  filterChipText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  filterChipTextActive: { color: '#FFFFFF' },

  listContent: { padding: 16, paddingBottom: 32 },

  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  accentBar: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 10 },
  headerRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  description: { fontSize: 14, fontWeight: '700', color: '#111827', lineHeight: 20 },
  taskId: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: '800' },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: '#6B7280' },

  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 10,
    padding: 8,
  },
  aiText: { flex: 1, fontSize: 12, color: '#1E40AF', lineHeight: 18 },

  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 13, color: '#6B7280' },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 56,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#374151' },
  emptyText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },

  retryBtn: {
    marginTop: 8,
    backgroundColor: '#1E40AF',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});

export default SubmittedProofsScreen;
