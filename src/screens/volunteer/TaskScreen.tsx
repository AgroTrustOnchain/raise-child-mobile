import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getTasks,
  assignTask,
  TaskItem,
  extractTasksFromResponse,
} from '../../services/tasks.service';

const PAGE_SIZE = 10;

function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getTaskStatus(task: TaskItem): { label: string; type: 'overdue' | 'today' | 'upcoming' | 'assigned' } {
  if (task.assigned_profile_id) {
    return { label: 'Assigned', type: 'assigned' };
  }
  if (!task.end_period) return { label: 'Open', type: 'upcoming' };
  const end = new Date(task.end_period);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `Overdue: ${Math.abs(diffDays)}d`, type: 'overdue' };
  if (diffDays === 0) return { label: 'Due Today', type: 'today' };
  return { label: `Due in ${diffDays}d`, type: 'upcoming' };
}

export default function TaskScreen() {
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  // Debounce search keyword
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedKeyword(keyword.trim()), 400);
    return () => clearTimeout(handle);
  }, [keyword]);

  const fetchPage = useCallback(
    async (pageToFetch: number, kw: string, append: boolean) => {
      if (append) setLoadingMore(true);
      else if (!refreshing) setLoading(true);
      try {
        const res = await getTasks({
          keyword: kw,
          page: pageToFetch,
          pageSize: PAGE_SIZE,
        });
        const list = extractTasksFromResponse(res);
        const tp = typeof res.total_pages === 'number' ? res.total_pages : 1;
        setTotalPages(tp);
        setPage(pageToFetch);
        setTasks((prev) => {
          if (!append) return list;
          const seen = new Set(prev.map((t) => t.id));
          const merged = [...prev];
          for (const t of list) {
            if (!seen.has(t.id)) {
              merged.push(t);
              seen.add(t.id);
            }
          }
          return merged;
        });
      } catch (e) {
        console.warn('Failed to load tasks', e);
        if (!append) setTasks([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [refreshing]
  );

  // Reset + fetch when keyword changes
  useEffect(() => {
    fetchPage(0, debouncedKeyword, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeyword]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPage(0, debouncedKeyword, false);
    setRefreshing(false);
  }, [debouncedKeyword, fetchPage]);

  const onEndReached = useCallback(() => {
    if (loadingMore || loading || refreshing) return;
    const nextPage = page + 1;
    if (nextPage >= totalPages) return;
    fetchPage(nextPage, debouncedKeyword, true);
  }, [loadingMore, loading, refreshing, page, totalPages, debouncedKeyword, fetchPage]);

  const handleAssign = useCallback(async (task: TaskItem) => {
    if (task.assigned_profile_id) {
      Alert.alert('Already assigned', 'This task is already assigned.');
      return;
    }
    Alert.alert(
      'Assign task',
      'Do you want to take on this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Assign to me',
          onPress: async () => {
            try {
              setAssigningId(task.id);
              await assignTask(task.id);
              setTasks((prev) =>
                prev.map((t) =>
                  t.id === task.id ? { ...t, assigned_profile_id: 'me' } : t
                )
              );
              Alert.alert('Success', 'Task assigned to you.');
            } catch (e: any) {
              const msg =
                e?.response?.data?.message ||
                e?.message ||
                'Failed to assign task';
              Alert.alert('Error', msg);
            } finally {
              setAssigningId(null);
            }
          },
        },
      ]
    );
  }, []);

  const renderItem = ({ item }: { item: TaskItem }) => {
    const status = getTaskStatus(item);
    const isAssigning = assigningId === item.id;
    const isAssigned = !!item.assigned_profile_id;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.regionPill}>
            <Ionicons name="location-outline" size={12} color="#00288e" />
            <Text style={styles.regionPillText}>{item.region || 'Unknown'}</Text>
          </View>
          <View
            style={[
              styles.badge,
              status.type === 'overdue' && styles.badgeOverdue,
              status.type === 'today' && styles.badgeToday,
              status.type === 'upcoming' && styles.badgeUpcoming,
              status.type === 'assigned' && styles.badgeAssigned,
            ]}
          >
            <Text style={styles.badgeText}>{status.label}</Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={3}>
          {item.description || 'No description provided.'}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color="#6b7280" />
            <Text style={styles.metaText}>
              {formatDate(item.start_period)} — {formatDate(item.end_period)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (isAssigned || isAssigning) && styles.buttonDisabled,
          ]}
          onPress={() => handleAssign(item)}
          disabled={isAssigned || isAssigning}
        >
          {isAssigning ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons
                name={isAssigned ? 'checkmark-circle' : 'person-add-outline'}
                size={16}
                color="#fff"
              />
              <Text style={styles.buttonText}>
                {isAssigned ? 'Assigned' : 'Assign to me'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>Welfare Tasks</Text>
        <Text style={styles.subtitle}>
          Browse open tasks and assign them to yourself.
        </Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search by keyword or region..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={keyword}
            onChangeText={setKeyword}
            returnKeyType="search"
          />
          {keyword.length > 0 && (
            <TouchableOpacity onPress={() => setKeyword('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyContainer}>
              <Ionicons name="clipboard-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No tasks found</Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#00288e" />
            </View>
          ) : null
        }
      />

      {loading && tasks.length === 0 && (
        <View style={styles.centerLoader} pointerEvents="none">
          <ActivityIndicator size="large" color="#00288e" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#00288e',
  },
  subtitle: {
    color: '#666',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 8,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  regionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6eeff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  regionPillText: {
    fontSize: 12,
    color: '#00288e',
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#6b7280',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeOverdue: { backgroundColor: '#fd761a' },
  badgeToday: { backgroundColor: '#00288e' },
  badgeUpcoming: { backgroundColor: '#10b981' },
  badgeAssigned: { backgroundColor: '#6366f1' },
  description: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00288e',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  centerLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
