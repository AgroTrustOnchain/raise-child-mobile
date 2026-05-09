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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/MainNavigator';
import {
  getMySupportedRegionSuggestions,
  SupportedRegionSuggestion,
} from '../../services/registration.service';
import { useAuth } from '../../hooks/useAuth';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; color: string; icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap }
> = {
  pending:  { label: 'Đang chờ',  bg: '#FFF7ED', color: '#EA580C', icon: 'time-outline' },
  approved: { label: 'Đã duyệt',  bg: '#F0FDF4', color: '#16A34A', icon: 'checkmark-circle-outline' },
  refused: { label: 'Từ chối',   bg: '#FEE2E2', color: '#DC2626', icon: 'close-circle-outline' },
};

const getStatus = (s: string) => STATUS_CONFIG[s.toLowerCase()] ?? STATUS_CONFIG['pending'];

const formatDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const MySupportedRegionsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const [items, setItems] = useState<SupportedRegionSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!user?.walletAddress) {
      setError('Chưa kết nối ví.');
      setLoading(false);
      return;
    }
    try {
      if (!silent) setLoading(true);
      setError(null);
      setItems(await getMySupportedRegionSuggestions(user.walletAddress));
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Không thể tải đề xuất.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.walletAddress]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đề xuất của tôi</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('CreateSupportedRegion')}
        >
          <Ionicons name="add" size={24} color="#1E40AF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text style={styles.loadingText}>Đang tải…</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={52} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData()}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchData(true); }}
              tintColor="#1E40AF"
            />
          }
        >
          {items.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="document-outline" size={52} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Chưa có đề xuất nào</Text>
              <Text style={styles.emptySubtitle}>
                Bạn chưa gửi đề xuất vùng cần hỗ trợ. Hãy tạo đề xuất đầu tiên.
              </Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => navigation.navigate('CreateSupportedRegion')}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Tạo đề xuất</Text>
              </TouchableOpacity>
            </View>
          ) : (
            items.map((item) => {
              const sc = getStatus(item.status);
              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.regionIconContainer}>
                      <Ionicons name="location" size={20} color="#1E40AF" />
                    </View>
                    <View style={styles.cardHeaderText}>
                      <Text style={styles.regionName}>{item.region}</Text>
                      <Text style={styles.dateText}>Gửi ngày {formatDate(item.created_at)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                      <Ionicons name={sc.icon} size={11} color={sc.color} />
                      <Text style={[styles.statusBadgeText, { color: sc.color }]}>{sc.label}</Text>
                    </View>
                  </View>

                  <Text style={styles.contentText}>{item.content}</Text>

                  {item.status.toLowerCase() === 'refused' && item.reason ? (
                    <View style={styles.reasonCard}>
                      <View style={styles.reasonHeader}>
                        <Ionicons name="alert-circle-outline" size={14} color="#DC2626" />
                        <Text style={styles.reasonLabel}>Lý do từ chối</Text>
                      </View>
                      <Text style={styles.reasonText}>{item.reason}</Text>
                    </View>
                  ) : null}

                  {item.reviewed_by ? (
                    <View style={styles.reviewedRow}>
                      <Ionicons name="shield-checkmark-outline" size={13} color="#16A34A" />
                      <Text style={styles.reviewedText}>Đã được xem xét</Text>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
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

  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 4 },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 24 },
  createButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1E40AF', paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 12, marginTop: 16,
  },
  createButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  regionIconContainer: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cardHeaderText: { flex: 1 },
  regionName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  dateText: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  contentText: { fontSize: 13, color: '#4B5563', lineHeight: 20 },
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
  reviewedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  reviewedText: { fontSize: 12, color: '#16A34A', fontWeight: '600' },
});

export default MySupportedRegionsScreen;
