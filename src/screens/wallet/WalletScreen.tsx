import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../../store';
import {
  getPersonalWalletProfile,
  WalletProfile,
  TransactionRecord,
} from '../../services/profile.service';

const formatVND = (value: number) =>
  `${Math.round(value).toLocaleString('vi-VN')} ₫`;

// ── Badge data (static) ───────────────────────────────────────────────────────
const BADGES = [
  {
    id: '1',
    title: 'Seed Sower #42',
    tier: 'Gold Tier',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD2i2YL68NSk1J9vyAJywSPcCqgJdE-bcKRaBc_z0b-Zd7pMCzS7kXaj4QZrDF4a3IGpw3x_nAB_PGHzm3X-ptSc13pS031T2V4sS0Qr7I2oLCjDxip06Goz4BKjO4iGKI9FYAt5xiPcWHS73Wpo9Ua0vvR9VyvxNEFE1QP5iicmpv7ROqB1Bc5aAag5AE_K5ow-6UyCx5lYXjEvo6UYI_1STd8J0Rff-ekbr-CgzvtW0L39kfnJKirfVi5yHYS2w_1BzLihca6Ahlt',
  },
  {
    id: '2',
    title: 'Knowledge Keeper',
    tier: 'Rare',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDvVNzDrD7Npuzkca_2WOHC6gYDJ8gT0GsbbtHPwuR8cLBttJf-bhq0WL6ucdtE0ReK4qWOWHTb3LRYYnv046nveZp3OyafmhBzphgXcTc6E-doWQ1GvFkUnQi9hMZYsp4lrwziLqGUAgmnYPt9yBVbSDXUzFW0H0XwhyAaAAJdSIhueLg9YUr89nqBk0EFAzUUU73Rp0QcCmAG_VfF5xu_ZI1ccVIZRyOaICThR_VM0SZEv7BrzPFc_4kC4JDbr_GzEuyA2srRGeQ8',
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

const BadgeCard = ({ badge }: { badge: typeof BADGES[0] }) => (
  <View style={styles.badgeCard}>
    <Image source={{ uri: badge.image }} style={styles.badgeImage} resizeMode="cover" />
    <View style={styles.badgeOverlay}>
      <View style={styles.badgeInfo}>
        <Text style={styles.badgeTier}>{badge.tier}</Text>
        <Text style={styles.badgeTitle}>{badge.title}</Text>
      </View>
      <View style={styles.verifiedBadge}>
        <Ionicons name="checkmark-circle" size={16} color="#60A5FA" />
      </View>
    </View>
  </View>
);

const TransactionItem = ({ tx }: { tx: TransactionRecord }) => {
  const amount = tx.amount ?? 0;
  const date = tx.created_at ? new Date(tx.created_at).toLocaleDateString('vi-VN') : '';
  const statusColor =
    tx.status === 'SUCCESS' || tx.status === 'success'
      ? '#1E40AF'
      : tx.status === 'FAILED' || tx.status === 'failed'
      ? '#DC2626'
      : '#EA580C';

  return (
    <View style={styles.transactionCard}>
      <View style={styles.txLeft}>
        <View style={styles.txIcon}>
          <Ionicons name="heart" size={18} color="#1E40AF" />
        </View>
        <View style={styles.txDetails}>
          <Text style={styles.txTitle} numberOfLines={1}>
            {tx.description ?? tx.order_code ?? 'Giao dịch'}
          </Text>
          <View style={styles.txMeta}>
            {!!date && <Text style={styles.txDate}>{date}</Text>}
            {!!tx.status && (
              <>
                {!!date && <Text style={styles.metaDot}>•</Text>}
                <Text style={[styles.txStatus, { color: statusColor }]}>{tx.status}</Text>
              </>
            )}
          </View>
        </View>
      </View>
      <Text style={styles.txAmount}>{formatVND(Math.abs(amount))}</Text>
    </View>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const WalletScreen = () => {
  const navigation = useNavigation();
  const { user } = useAppSelector((state) => state.auth);
  const walletAddress = user?.walletAddress ?? '';

  const [profile, setProfile] = useState<WalletProfile | null>(null);
  const [records, setRecords] = useState<TransactionRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isFetching = useRef(false);

  const fetchPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      if (!walletAddress || isFetching.current) return;
      isFetching.current = true;
      try {
        const data = await getPersonalWalletProfile(walletAddress, pageNum);
        setProfile(data);
        setTotalPages(data.total_pages || 1);
        const incoming = data.transaction_records ?? [];
        setRecords((prev) => (replace ? incoming : [...prev, ...incoming]));
        setPage(pageNum);
      } catch {
        Alert.alert('Lỗi', 'Không thể tải dữ liệu ví. Vui lòng thử lại.');
      } finally {
        isFetching.current = false;
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [walletAddress]
  );

  useEffect(() => {
    setLoading(true);
    fetchPage(1, true);
  }, [walletAddress]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPage(1, true);
  };

  const loadMore = () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    fetchPage(page + 1, false);
  };

  const fullName =
    profile?.first_name || profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`.trim()
      : walletAddress
      ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
      : 'Ví của tôi';

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={[styles.container, { paddingTop: 20 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E40AF" />
      }
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ví</Text>
        <View style={styles.headerButton} />
      </View>

      {/* ── Balance Card ──────────────────────────────────────────────────── */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <View style={{ flex: 1 }}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" style={{ marginVertical: 8 }} />
            ) : (
              <>
                <Text style={styles.balanceLabel}>Tổng quyên góp</Text>
                <Text style={styles.balanceAmount}>
                  {formatVND(profile?.total_donation ?? 0)}
                </Text>
                <Text style={styles.balanceName}>{fullName}</Text>
                {!!walletAddress && (
                  <View style={styles.addressRow}>
                    <Text style={styles.addressText}>
                      {walletAddress.slice(0, 10)}…{walletAddress.slice(-6)}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
          <TouchableOpacity
            style={styles.qrButton}
            onPress={() => Alert.alert('Mã QR', 'Hiển thị mã QR ví')}
          >
            <Ionicons name="qr-code" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        {!loading && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.record_amount ?? 0}</Text>
              <Text style={styles.statLabel}>Giao dịch</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {profile?.supported_childs?.length ?? 0}
              </Text>
              <Text style={styles.statLabel}>Trẻ được hỗ trợ</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalPages}</Text>
              <Text style={styles.statLabel}>Trang</Text>
            </View>
          </View>
        )}

        {/* <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.addFundsButton}
            onPress={() => Alert.alert('Nạp tiền', 'Tính năng nạp tiền sắp ra mắt')}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Nạp tiền</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.donateButton}
            onPress={() => Alert.alert('Quyên góp', 'Tính năng quyên góp sắp ra mắt')}
          >
            <Ionicons name="heart" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Quyên góp</Text>
          </TouchableOpacity>
        </View> */}
      </View>

      {/* ── Badges ────────────────────────────────────────────────────────── */}
      {/* <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Huy hiệu Nhà từ thiện</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>5 Đã đạt</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.seeAll}>
            <Text style={styles.seeAllText}>Bộ sưu tập</Text>
            <Ionicons name="chevron-forward" size={16} color="#1E40AF" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={BADGES}
          renderItem={({ item }) => <BadgeCard badge={item} />}
          keyExtractor={(item) => item.id}
          horizontal
          scrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
        />
      </View> */}

      {/* ── Transaction Records ────────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lịch sử giao dịch</Text>
          {totalPages > 1 && (
            <Text style={styles.pageLabel}>Trang {page}/{totalPages}</Text>
          )}
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#1E40AF" style={{ marginVertical: 20 }} />
        ) : records.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
          </View>
        ) : (
          records.map((tx, i) => (
            <TransactionItem key={tx.id ?? tx.order_code ?? i} tx={tx} />
          ))
        )}

        {/* Load more */}
        {!loading && page < totalPages && (
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={loadMore}
            disabled={loadingMore}
            activeOpacity={0.8}
          >
            {loadingMore ? (
              <ActivityIndicator size="small" color="#1E40AF" />
            ) : (
              <>
                <Text style={styles.loadMoreText}>Tải thêm</Text>
                <Ionicons name="chevron-down" size={16} color="#1E40AF" />
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Info card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="shield-checkmark" size={20} color="#1E40AF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Minh bạch trên chuỗi</Text>
            <Text style={styles.infoText}>
              Mỗi khoản quyên góp tạo ra chứng chỉ tác động có thể xác minh trên blockchain SUI.
            </Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
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

  // Balance card
  balanceCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    backgroundColor: '#1E40AF',
    borderRadius: 24,
    padding: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  balanceName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  addressRow: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  addressText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    fontVariant: ['tabular-nums'],
  },
  qrButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    width: 48,
    height: 48,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 4,
  },
  actionButtons: { flexDirection: 'row', gap: 12 },
  addFundsButton: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  donateButton: {
    flex: 1,
    backgroundColor: '#F97316',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  // Sections
  section: { marginHorizontal: 16, marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  countBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1E40AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seeAllText: { fontSize: 13, fontWeight: '600', color: '#1E40AF' },
  pageLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280' },

  // Badges
  badgeCard: {
    width: 160,
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  badgeImage: { width: '100%', height: '100%' },
  badgeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(15,23,42,0.6)',
    justifyContent: 'space-between',
    padding: 12,
  },
  badgeInfo: { flex: 1, justifyContent: 'flex-end' },
  badgeTier: {
    fontSize: 9,
    fontWeight: '700',
    color: '#60A5FA',
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  badgeTitle: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  // Transactions
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  txDetails: { flex: 1 },
  txTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 4 },
  txMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  txDate: { fontSize: 10, color: '#6B7280' },
  metaDot: { color: '#9CA3AF', fontSize: 10 },
  txStatus: { fontSize: 9, fontWeight: '700' },
  txAmount: { fontSize: 13, fontWeight: '700', color: '#111827' },

  // Load more
  loadMoreButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#F8FAFF',
    marginBottom: 12,
  },
  loadMoreText: { fontSize: 14, fontWeight: '600', color: '#1E40AF' },

  // Empty / Info
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  infoTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 4 },
  infoText: { fontSize: 11, color: '#6B7280', lineHeight: 16 },
});

export default WalletScreen;
