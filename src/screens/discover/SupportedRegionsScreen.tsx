import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useModal } from '../../context/ModalContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/MainNavigator';
import {
  getSupportedRegionSuggestions,
  getUserRegistrations,
  confirmRegistration,
  SupportedRegionSuggestion,
  UserRegistration,
} from '../../services/registration.service';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../hooks/useAuth';
import { executeTransaction } from '../../services/payment.service';
import { fromBase64 } from '@mysten/sui/utils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Tab = 'regions' | 'registrations';

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap }> = {
  pending:  { label: 'Needs Support', bg: '#FFF7ED', color: '#EA580C', icon: 'time-outline' },
  approved: { label: 'Active',        bg: '#EFF6FF', color: '#1E40AF', icon: 'checkmark-circle-outline' },
  rejected: { label: 'Closed',        bg: '#FEE2E2', color: '#DC2626', icon: 'close-circle-outline' },
};

const REG_STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap }> = {
  pending:  { label: 'Pending',  bg: '#FFF7ED', color: '#EA580C', icon: 'time-outline' },
  approved: { label: 'Approved', bg: '#F0FDF4', color: '#16A34A', icon: 'checkmark-circle-outline' },
  rejected: { label: 'Rejected', bg: '#FEE2E2', color: '#DC2626', icon: 'close-circle-outline' },
};

const getStatusConfig = (map: typeof STATUS_CONFIG, status: string) =>
  map[status.toLowerCase()] ?? map['pending'];

// ── Regions Tab ───────────────────────────────────────────────────────────────

const RegionsTab = () => {
  const navigation = useNavigation<NavigationProp>();
  const [suggestions, setSuggestions] = useState<SupportedRegionSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      setSuggestions(await getSupportedRegionSuggestions());
    } catch (err: any) {
      setError(err.message || 'Failed to load regions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E40AF" />
        <Text style={styles.loadingText}>Đang tải vùng…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={52} color="#DC2626" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData()}>
          <Text style={styles.retryBtnText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchData(true); }}
          tintColor="#1E40AF"
        />
      }
    >
      <View style={styles.bannerCard}>
        <View style={styles.bannerIconContainer}>
          <Ionicons name="people" size={24} color="#1E40AF" />
        </View>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>Tham gia cộng đồng của bạn</Text>
          <Text style={styles.bannerSubtitle}>
            Các vùng này cần Tình nguyện viên và Lãnh đạo địa phương để hỗ trợ các chương trình phúc lợi trẻ em.
          </Text>
        </View>
      </View>

      <View style={styles.suggestionRow}>
        <TouchableOpacity
          style={[styles.createSuggestionButton, { flex: 1 }]}
          onPress={() => navigation.navigate('CreateSupportedRegion')}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={18} color="#1E40AF" />
          <Text style={styles.createSuggestionText}>Đề xuất vùng</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.createSuggestionButton, { flex: 1 }]}
          onPress={() => navigation.navigate('MySupportedRegions')}
          activeOpacity={0.85}
        >
          <Ionicons name="document-text-outline" size={18} color="#1E40AF" />
          <Text style={styles.createSuggestionText}>Đề xuất của tôi</Text>
        </TouchableOpacity>
      </View>

      {suggestions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={52} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Hiện chưa có vùng nào</Text>
          <Text style={styles.emptySubtitle}>Hãy quay lại sau để xem cơ hội mới.</Text>
        </View>
      ) : (
        suggestions.map((item) => {
          const sc = getStatusConfig(STATUS_CONFIG, item.status);
          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.regionIconContainer}>
                  <Ionicons name="location" size={20} color="#1E40AF" />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.regionName}>{item.region}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                  <Ionicons name={sc.icon} size={11} color={sc.color} />
                  <Text style={[styles.statusBadgeText, { color: sc.color }]}>{sc.label}</Text>
                </View>
              </View>

              <Text style={styles.contentText}>{item.content}</Text>

              <View style={styles.rolesNeededRow}>
                <View style={styles.roleNeededChip}>
                  <Ionicons name="shield-checkmark-outline" size={12} color="#1E40AF" />
                  <Text style={styles.roleNeededText}>Lãnh đạo địa phương</Text>
                </View>
                <View style={styles.roleNeededChip}>
                  <Ionicons name="hand-left-outline" size={12} color="#1E40AF" />
                  <Text style={styles.roleNeededText}>Tình nguyện viên</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.registerButton}
                onPress={() => navigation.navigate('RegistrationForm', { region: item.region })}
                activeOpacity={0.85}
              >
                <Text style={styles.registerButtonText}>Đăng ký vùng này</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          );
        })
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

// ── My Registrations Tab ──────────────────────────────────────────────────────

const RegistrationsTab = () => {
  const { wallet } = useWallet();
  const modal = useModal();
  const [registrations, setRegistrations] = useState<UserRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {user} = useAuth();

  const fetchData = useCallback(async (silent = false) => {
    if (!user?.walletAddress) {
      setError('No wallet connected.');
      setLoading(false);
      return;
    }
    try {
      if (!silent) setLoading(true);
      setError(null);
      setRegistrations(await getUserRegistrations(user?.walletAddress));
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load registrations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.walletAddress]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleConfirm = async (reg: UserRegistration) => {
    modal.confirm(
      'Xác nhận đăng ký',
      `Xác nhận đăng ký của bạn cho ${reg.region} với vai trò ${reg.register_role}?`,
      async () => {
        try {
          setConfirming(reg.id);
          const res = await confirmRegistration(reg.id)

          if (res?.tx_bytes) {
            if (!wallet) throw new Error('Wallet not connected. Please log in again.');

            const { signature } = await wallet.ephemeralKeyPair.signTransaction(fromBase64(res.tx_bytes));

            await executeTransaction({
              tx_bytes: res.tx_bytes,
              signature,
              proposal_id: res.proposal_id ?? '',
              center_req: res.center_req ?? '',
              registration_req: res.registration_req ?? '',
              upload_child_req: res.upload_child_req ?? '',
            });
          }

          setRegistrations((prev) =>
            prev.map((r) => (r.id === reg.id ? { ...r, status: 'confirmed' } : r))
          );
          modal.success('Thành công', 'Đã xác nhận đăng ký thành công!');
        } catch (e: any) {
          console.log(e)
          modal.error('Lỗi', e?.response?.data?.message || 'Confirmation failed.');
        } finally {
          setConfirming(null);
        }
      },
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E40AF" />
        <Text style={styles.loadingText}>Đang tải đăng ký…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={52} color="#DC2626" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData()}>
          <Text style={styles.retryBtnText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchData(true); }}
          tintColor="#1E40AF"
        />
      }
    >
      {registrations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={52} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Chưa có đăng ký nào</Text>
          <Text style={styles.emptySubtitle}>
            Đăng ký một vùng ở tab Vùng để bắt đầu.
          </Text>
        </View>
      ) : (
        registrations.map((reg) => {
          const sc = getStatusConfig(REG_STATUS_CONFIG, reg.status);
          const canConfirm = reg.approvers != null;
          const isConfirming = confirming === reg.id;
          return (
            <View key={reg.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.regionIconContainer}>
                  <Ionicons name="location" size={20} color="#1E40AF" />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.regionName}>{reg.region}</Text>
                  <Text style={styles.roleLabel}>{reg.register_role}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                  <Ionicons name={sc.icon} size={11} color={sc.color} />
                  <Text style={[styles.statusBadgeText, { color: sc.color }]}>{sc.label}</Text>
                </View>
              </View>

              {/* {canConfirm && (
                <TouchableOpacity
                  style={[styles.confirmButton, isConfirming && styles.confirmButtonDisabled]}
                  onPress={() => handleConfirm(reg)}
                  disabled={isConfirming}
                  activeOpacity={0.85}
                >
                  {isConfirming ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                      <Text style={styles.confirmButtonText}>Xác nhận</Text>
                    </>
                  )}
                </TouchableOpacity>
              )} */}
            </View>
          );
        })
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────

const SupportedRegionsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const [activeTab, setActiveTab] = useState<Tab>('regions');

  // 'SupportedRegions' = pushed from root stack (no external header)
  // 'Regions' = rendered as bottom tab (AppHeader already shown above)
  const isStackScreen = route.name === 'SupportedRegions';

  return (
    <View style={[styles.container, isStackScreen && { paddingTop: insets.top }]}>
      {/* Header — only shown when accessed as a stack screen, not as a bottom tab */}
      {isStackScreen && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vùng cần hỗ trợ</Text>
          <View style={styles.headerButton} />
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'regions' && styles.tabItemActive]}
          onPress={() => setActiveTab('regions')}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeTab === 'regions' ? 'map' : 'map-outline'}
            size={16}
            color={activeTab === 'regions' ? '#1E40AF' : '#6B7280'}
          />
          <Text style={[styles.tabLabel, activeTab === 'regions' && styles.tabLabelActive]}>
            Vùng
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'registrations' && styles.tabItemActive]}
          onPress={() => setActiveTab('registrations')}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeTab === 'registrations' ? 'document-text' : 'document-text-outline'}
            size={16}
            color={activeTab === 'registrations' ? '#1E40AF' : '#6B7280'}
          />
          <Text style={[styles.tabLabel, activeTab === 'registrations' && styles.tabLabelActive]}>
            Đăng ký của tôi
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'regions' ? <RegionsTab /> : <RegistrationsTab />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },
  loadingText: { fontSize: 15, color: '#64748B', fontWeight: '500' },
  errorText: { fontSize: 15, color: '#DC2626', fontWeight: '600', textAlign: 'center' },
  retryBtn: {
    backgroundColor: '#1E40AF', paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: 10, marginTop: 4,
  },
  retryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.5)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: '#1E40AF' },
  tabLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  tabLabelActive: { color: '#1E40AF' },

  scrollContent: { padding: 16 },

  bannerCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#DBEAFE', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  bannerIconContainer: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  bannerTextContainer: { flex: 1 },
  bannerTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  bannerSubtitle: { fontSize: 13, color: '#6B7280', lineHeight: 19 },

  suggestionRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  createSuggestionButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#DBEAFE',
  },
  createSuggestionText: { fontSize: 13, fontWeight: '700', color: '#1E40AF' },

  emptyContainer: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },

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
  regionName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  roleLabel: { fontSize: 12, color: '#6B7280', marginTop: 2, textTransform: 'capitalize' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  contentText: { fontSize: 13, color: '#4B5563', lineHeight: 20, marginBottom: 12 },
  rolesNeededRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  roleNeededChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F8FAFF', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: '#DBEAFE',
  },
  roleNeededText: { fontSize: 11, fontWeight: '600', color: '#1E40AF' },
  registerButton: {
    backgroundColor: '#1E40AF', height: 50, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#1E40AF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 3,
  },
  registerButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  confirmButton: {
    backgroundColor: '#1E40AF', height: 50, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 4,
    shadowColor: '#1E40AF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 3,
  },
  confirmButtonDisabled: { opacity: 0.6 },
  confirmButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});

export default SupportedRegionsScreen;
