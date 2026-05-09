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
  getRegionStaffTasks,
  assignTask,
  TaskItem,
} from '../../services/tasks.service';
import { useAuth } from '../../hooks/useAuth';

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
  const { user } = useAuth();
  const walletAddress = user?.walletAddress ?? '';

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  // Debounce search keyword
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedKeyword(keyword.trim()), 400);
    return () => clearTimeout(handle);
  }, [keyword]);

  const fetchTasks = useCallback(async () => {
    if (!walletAddress) {
      setTasks([]);
      return;
    }
    if (!refreshing) setLoading(true);
    try {
      const list = await getRegionStaffTasks(walletAddress);
      setTasks(list);
    } catch (e) {
      console.warn('Failed to load tasks', e);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, refreshing]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  }, [fetchTasks]);

  // Client-side keyword filter (endpoint returns full region/staff list).
  const visibleTasks = debouncedKeyword
    ? tasks.filter((t) => {
        const hay = `${t.title ?? ''} ${t.description ?? ''} ${t.region ?? ''}`.toLowerCase();
        return hay.includes(debouncedKeyword.toLowerCase());
      })
    : tasks;

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
            <Ionicons name="location-outline" size={12} color="#1E40AF" />
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
        data={visibleTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyContainer}>
              <Ionicons name="clipboard-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No tasks found</Text>
            </View>
          )
        }
      />

      {loading && tasks.length === 0 && (
        <View style={styles.centerLoader} pointerEvents="none">
          <ActivityIndicator size="large" color="#1E40AF" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    color: '#6B7280',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#DBEAFE',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
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
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  regionPillText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#6B7280',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  badgeOverdue: { backgroundColor: '#EA580C' },
  badgeToday: { backgroundColor: '#1E40AF' },
  badgeUpcoming: { backgroundColor: '#1E40AF' },
  badgeAssigned: { backgroundColor: '#9CA3AF' },
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
    color: '#6B7280',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    height: 60,
    borderRadius: 16,
    gap: 6,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 17,
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
