import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '../../services/api.service';

interface CenterReq {
  id: string;
  center_id: string;
  center_name?: string;
  region: string;
  title: string;
  description?: string;
  status: string;
  vote_count?: number;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap }> = {
  pending:  { label: 'Pending',  bg: '#FFF7ED', color: '#EA580C', icon: 'time-outline' },
  approved: { label: 'Approved', bg: '#F0FDF4', color: '#16A34A', icon: 'checkmark-circle-outline' },
  rejected: { label: 'Rejected', bg: '#FEE2E2', color: '#DC2626', icon: 'close-circle-outline' },
};

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

const voteForReq = async (id: string): Promise<void> => {
  await apiService.post(`/center-reqs/${id}/vote`);
};

const CenterReqScreen = () => {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<CenterReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleVote = async (item: CenterReq) => {
    Alert.alert(
      'Vote',
      `Vote for "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Vote',
          onPress: async () => {
            try {
              setVoting(item.id);
              await voteForReq(item.id);
              setItems((prev) =>
                prev.map((r) =>
                  r.id === item.id ? { ...r, vote_count: (r.vote_count ?? 0) + 1 } : r
                )
              );
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message || 'Vote failed. Please try again.');
            } finally {
              setVoting(null);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: CenterReq }) => {
    const sc = getStatusConfig(item.status);
    const isVoting = voting === item.id;

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.iconWrap}>
            <Ionicons name="business" size={20} color="#1E40AF" />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            {item.center_name && (
              <Text style={styles.cardSub}>{item.center_name}</Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Ionicons name={sc.icon} size={11} color={sc.color} />
            <Text style={[styles.statusBadgeText, { color: sc.color }]}>{sc.label}</Text>
          </View>
        </View>

        {/* Region */}
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color="#6B7280" />
          <Text style={styles.metaText}>{item.region}</Text>
        </View>

        {/* Description */}
        {!!item.description && (
          <Text style={styles.description} numberOfLines={3}>{item.description}</Text>
        )}

        {/* Footer: votes + vote button */}
        <View style={styles.cardFooter}>
          <View style={styles.voteCount}>
            <Ionicons name="thumbs-up-outline" size={14} color="#6B7280" />
            <Text style={styles.voteCountText}>
              {item.vote_count ?? 0} vote{(item.vote_count ?? 0) !== 1 ? 's' : ''}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.voteButton, isVoting && styles.voteButtonDisabled]}
            onPress={() => handleVote(item)}
            disabled={isVoting}
            activeOpacity={0.85}
          >
            {isVoting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="thumbs-up" size={15} color="#FFFFFF" />
                <Text style={styles.voteButtonText}>Vote</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Center Requests</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text style={styles.loadingText}>Loading requests…</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Center Requests</Text>
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={52} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadData()}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Center Requests</Text>
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
            <Text style={styles.emptyTitle}>No requests found</Text>
            <Text style={styles.emptySubtitle}>Pull down to refresh.</Text>
          </View>
        }
      />
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
  voteButtonDisabled: { opacity: 0.6 },
  voteButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});

export default CenterReqScreen;
