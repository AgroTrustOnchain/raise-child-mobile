import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/MainNavigator';
import { getTaskDetail, TaskItem } from '../../services/tasks.service';
import WalrusImage from '../../components/WalrusImage';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const formatDateTime = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const formatDate = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const shortenAddress = (a?: string): string => {
  if (!a) return '—';
  if (a.length <= 16) return a;
  return `${a.slice(0, 8)}…${a.slice(-6)}`;
};

const getStatusInfo = (task: TaskItem) => {
  if (task.is_submitted)
    return { label: 'Đã nộp', color: '#16A34A', bg: '#F0FDF4', icon: 'checkmark-done-circle' as const };
  if (task.assigned_profile_id)
    return { label: 'Đã nhận', color: '#1E40AF', bg: '#EFF6FF', icon: 'person-circle' as const };
  if (task.end_period) {
    const end = new Date(task.end_period).getTime();
    if (!isNaN(end) && end < Date.now())
      return { label: 'Quá hạn', color: '#DC2626', bg: '#FEE2E2', icon: 'alert-circle' as const };
  }
  return { label: 'Đang mở', color: '#EA580C', bg: '#FFF7ED', icon: 'time-outline' as const };
};

const TaskDetailScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const params = route.params as { taskId?: string } | undefined;
  const taskId = params?.taskId;

  const [task, setTask] = useState<TaskItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!taskId) {
      setError('Không có ID nhiệm vụ.');
      setLoading(false);
      return;
    }
    try {
      if (!silent) setLoading(true);
      setError(null);
      setTask(await getTaskDetail(taskId));
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Không thể tải chi tiết nhiệm vụ.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [taskId]);

  useEffect(() => { load(); }, [load]);

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={22} color="#111827" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Chi tiết nhiệm vụ</Text>
      <View style={styles.headerButton} />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text style={styles.loadingText}>Đang tải…</Text>
        </View>
      </View>
    );
  }

  if (error || !task) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={52} color="#DC2626" />
          <Text style={styles.errorText}>{error ?? 'Không có dữ liệu.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const status = getStatusInfo(task);

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }}
            tintColor="#1E40AF"
          />
        }
      >
        {task.image_blob_id && (
          <WalrusImage
            blobId={task.image_blob_id}
            style={styles.heroImage}
            resizeMode="cover"
            fallbackIconSize={48}
          />
        )}

        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={3}>
            {task.title || task.name || `Nhiệm vụ ${shortenAddress(task.id)}`}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon} size={12} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {!!task.region && (
          <View style={styles.regionPill}>
            <Ionicons name="location" size={13} color="#1E40AF" />
            <Text style={styles.regionText}>{task.region}</Text>
          </View>
        )}

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mô tả</Text>
          <Text style={styles.bodyText}>
            {task.description || 'Không có mô tả.'}
          </Text>
        </View>

        {/* Timeline */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thời gian</Text>
          <Row icon="play-circle-outline" label="Bắt đầu" value={formatDateTime(task.start_period)} />
          <Row icon="stop-circle-outline" label="Kết thúc" value={formatDateTime(task.end_period)} />
          <Row icon="time-outline" label="Tạo lúc" value={formatDateTime(task.created_at)} />
          <Row icon="refresh-outline" label="Cập nhật" value={formatDateTime(task.updated_at)} />
        </View>

        {/* People */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Người liên quan</Text>
          <Row icon="person-circle-outline" label="Tạo bởi" value={shortenAddress(task.created_by)} mono />
          <Row icon="person-add-outline" label="Đã giao cho" value={shortenAddress(task.assigned_profile_id ?? undefined)} mono />
          {task.assgined_staff && (
            <Row icon="people-outline" label="Nhân viên" value={shortenAddress(task.assgined_staff)} mono />
          )}
          {task.reviewed_by && (
            <Row icon="shield-checkmark-outline" label="Đã duyệt bởi" value={shortenAddress(task.reviewed_by)} mono />
          )}
        </View>

        {/* Submission */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tiến độ</Text>
          <Row
            icon={task.is_submitted ? 'checkmark-done-circle' : 'cloud-upload-outline'}
            label="Đã nộp"
            value={task.is_submitted ? 'Có' : 'Chưa'}
          />
          {!!task.review_profile_status && (
            <Row icon="document-text-outline" label="Trạng thái duyệt" value={task.review_profile_status} />
          )}
          {task.is_child_task !== undefined && (
            <Row
              icon="person-outline"
              label="Liên quan trẻ em"
              value={task.is_child_task ? 'Có' : 'Không'}
            />
          )}
          {!!task.child_task_detail_id && (
            <Row icon="link-outline" label="Mã trẻ em" value={shortenAddress(task.child_task_detail_id)} mono />
          )}
        </View>

        {/* Raw ID */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mã nhiệm vụ</Text>
          <Text style={styles.idText} selectable>
            {task.id}
          </Text>
          <Text style={styles.idHint}>Tạo {formatDate(task.created_at)}</Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

const Row = ({
  icon,
  label,
  value,
  mono,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <View style={styles.row}>
    <View style={styles.rowLeft}>
      <Ionicons name={icon} size={15} color="#6B7280" />
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <Text style={[styles.rowValue, mono && styles.rowValueMono]} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },
  loadingText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  errorText: { fontSize: 14, color: '#DC2626', fontWeight: '600', textAlign: 'center' },
  retryBtn: {
    backgroundColor: '#1E40AF', paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 10, marginTop: 4,
  },
  retryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },

  scrollContent: { padding: 16 },

  heroImage: {
    width: '100%', aspectRatio: 16 / 9, borderRadius: 14,
    backgroundColor: '#F1F5F9', marginBottom: 14,
  },

  titleRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 10, marginBottom: 10,
  },
  title: { flex: 1, fontSize: 18, fontWeight: '800', color: '#111827', lineHeight: 24 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16,
    flexShrink: 0,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  regionPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 14, borderWidth: 1, borderColor: '#DBEAFE',
    marginBottom: 14,
  },
  regionText: { fontSize: 12, fontWeight: '700', color: '#1E40AF' },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 10 },
  bodyText: { fontSize: 14, color: '#374151', lineHeight: 21 },

  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 7, gap: 12,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowLabel: { fontSize: 13, color: '#6B7280' },
  rowValue: { fontSize: 13, color: '#111827', fontWeight: '600', flex: 1, textAlign: 'right' },
  rowValueMono: { fontVariant: ['tabular-nums'] },

  idText: {
    fontSize: 12, color: '#374151', fontWeight: '500',
    fontVariant: ['tabular-nums'], lineHeight: 18,
  },
  idHint: { fontSize: 11, color: '#9CA3AF', marginTop: 6 },
});

export default TaskDetailScreen;
