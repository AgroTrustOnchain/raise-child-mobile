import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../../store';
import { getStaffTasks, TaskItem } from '../../services/tasks.service';

const formatDate = (raw?: string) => {
  if (!raw || raw.startsWith('1970')) return null;
  return new Date(raw).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const statusColor = (status?: string) => {
  if (!status) return '#9CA3AF';
  const s = status.toLowerCase();
  if (s === 'completed' || s === 'done') return '#059669';
  if (s === 'in_progress' || s === 'inprogress' || s === 'active') return '#1E40AF';
  if (s === 'cancelled' || s === 'canceled' || s === 'failed') return '#DC2626';
  return '#D97706';
};

const statusLabel = (status?: string) => {
  if (!status) return 'Chờ xử lý';
  const s = status.toLowerCase();
  if (s === 'completed' || s === 'done') return 'Hoàn thành';
  if (s === 'in_progress' || s === 'inprogress' || s === 'active') return 'Đang thực hiện';
  if (s === 'cancelled' || s === 'canceled') return 'Đã huỷ';
  if (s === 'failed') return 'Thất bại';
  return status;
};

const MyTrackScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAppSelector((state) => state.auth);
  const walletAddress = user?.walletAddress ?? '';

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }
    try {
      const data = await getStaffTasks(walletAddress);
      setTasks(data);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải danh sách nhiệm vụ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    setLoading(true);
    fetchTasks();
  }, [walletAddress]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const filtered = tasks.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      (t.description || '').toLowerCase().includes(q) ||
      (t.region || '').toLowerCase().includes(q) ||
      (t.title || '').toLowerCase().includes(q) ||
      (t.keyword || '').toLowerCase().includes(q)
    );
  });

  const renderHeader = () => (
    <View>
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm nhiệm vụ..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Nhiệm vụ của tôi</Text>
        {!loading && (
          <Text style={styles.totalCount}>{tasks.length} nhiệm vụ</Text>
        )}
      </View>
    </View>
  );

  const renderTaskCard = ({ item: t }: { item: TaskItem }) => {
    const color = statusColor(t.review_profile_status ?? t.status);
    const label = statusLabel(t.review_profile_status ?? t.status);
    const start = formatDate(t.start_period);
    const end = formatDate(t.end_period);

    return (
      <TouchableOpacity
        style={styles.taskCard}
        onPress={() => navigation.navigate('ProofScreen', { childId: t.child_task_detail_id ?? t.id })}
        activeOpacity={0.9}
      >
        {/* Left accent bar */}
        <View style={[styles.accentBar, { backgroundColor: color }]} />

        <View style={styles.cardBody}>
          {/* Header row */}
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons
                name={t.is_child_task ? 'person' : 'clipboard-outline'}
                size={18}
                color="#1E40AF"
              />
            </View>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle} numberOfLines={2}>
                {t.description || t.title || 'Nhiệm vụ'}
              </Text>
              {!!t.region && (
                <View style={styles.regionRow}>
                  <Ionicons name="location-outline" size={12} color="#6B7280" />
                  <Text style={styles.regionText}>{t.region}</Text>
                </View>
              )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}>
              <Text style={[styles.statusText, { color }]}>{label}</Text>
            </View>
          </View>

          {/* Date range */}
          {(start || end) && (
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={13} color="#6B7280" />
              <Text style={styles.dateText}>
                {start ?? '—'} {end ? `→ ${end}` : ''}
              </Text>
            </View>
          )}

          {/* Child task indicator */}
          {t.is_child_task && (
            <View style={styles.childChip}>
              <Ionicons name="happy-outline" size={12} color="#1E40AF" />
              <Text style={styles.childChipText}>Nhiệm vụ cho trẻ em</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Ionicons name="clipboard-outline" size={56} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>
          {walletAddress ? 'Chưa có nhiệm vụ nào' : 'Vui lòng kết nối ví'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {walletAddress
            ? 'Bạn chưa được giao nhiệm vụ nào.'
            : 'Kết nối ví để xem danh sách nhiệm vụ.'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <>
          {renderHeader()}
          <ActivityIndicator size="large" color="#1E40AF" style={{ marginTop: 48 }} />
        </>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderTaskCard}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E40AF" />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  listContent: { paddingBottom: 100 },

  searchContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    gap: 8,
  },
  searchIcon: {},
  searchInput: { flex: 1, fontSize: 16, color: '#111827' },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  totalCount: { fontSize: 14, fontWeight: '700', color: '#1E40AF' },

  taskCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  accentBar: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 8 },

  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconCircle: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: '700', color: '#111827', lineHeight: 20 },

  regionRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  regionText: { fontSize: 11, color: '#6B7280' },

  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1, flexShrink: 0,
  },
  statusText: { fontSize: 10, fontWeight: '700' },

  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 12, color: '#6B7280' },

  childChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#EFF6FF', alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    borderWidth: 1, borderColor: '#DBEAFE',
  },
  childChipText: { fontSize: 11, fontWeight: '600', color: '#1E40AF' },

  emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
});

export default MyTrackScreen;
