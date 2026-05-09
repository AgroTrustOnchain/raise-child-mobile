// src/screens/nft/HomeScreen.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MappedTransaction,
  getTxRecords,
  mapTxRecord,
} from '../../services/transaction.service';
import { formatVNDNumber } from '../../utils/currency';

// ─── Static data (campaigns stay static until a campaign API is added) ────────

const CAMPAIGNS = [
  {
    id: '1',
    title: 'School Nutrition',
    amount: '500,000',
    progress: 75,
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400',
    verified: true,
  },
  {
    id: '2',
    title: 'Literacy Kits',
    amount: '200,000',
    progress: 45,
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400',
    verified: true,
  },
  {
    id: '3',
    title: 'Medical Aid',
    amount: '150,000',
    progress: 30,
    image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=400',
    verified: true,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

type FilterType = 'all' | 'inflow' | 'outflow';

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── Transaction state ──────────────────────────────────────────────────────
  const [transactions, setTransactions] = useState<MappedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ── Filter state ───────────────────────────────────────────────────────────
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  // ── Pulse animation ────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Guard so FlatList's onEndReached can't trigger overlapping fetches
  const isFetchingRef = useRef(false);

  // ── Fetch transactions ─────────────────────────────────────────────────────
  const fetchTransactions = useCallback(async (pageNum: number, append = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      append ? setLoadingMore(true) : setLoading(true);
      setError(null);

      const response = await getTxRecords(pageNum, 10);
      const mapped = response?.data?.length > 0 ? response.data.map(mapTxRecord) : [];

      setTransactions(prev => (append ? [...prev, ...mapped] : mapped));
      setTotalPages(response.total_pages);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.message || 'Không thể tải giao dịch');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchTransactions(1);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = useCallback(() => {
    if (loading || refreshing || loadingMore) return;
    if (page >= totalPages) return;
    fetchTransactions(page + 1, true);
  }, [loading, refreshing, loadingMore, page, totalPages, fetchTransactions]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filteredTransactions =
    selectedFilter === 'all'
      ? transactions
      : transactions.filter(tx => tx.type === selectedFilter);

  // ── Summary stats from live data ───────────────────────────────────────────
  const totalVND = transactions
    .filter(tx => tx.type === 'inflow')
    .reduce((sum, tx) => sum + tx.rawAmount, 0);

  // ─── Sub-header (everything above the transaction list) ───────────────────

  const renderHeader = () => (
    <View>
      {/* Top Navigation */}
      {/* <View style={[styles.topNav, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.navTitle}>AgroTrust Transparency</Text>
      </View> */}

      {/* Total Pool Card */}
      <View style={styles.poolCard}>
        <View style={styles.poolGradient} />
        <View style={styles.poolContent}>
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#1E40AF" />
            <Text style={styles.verifiedText}>QUỸ TỔNG HỢP ĐÃ XÁC MINH</Text>
          </View>

          <Text style={styles.poolAmount}>
            {formatVNDNumber(totalVND > 0 ? totalVND : 1240500)}{' '}
            <Text style={styles.poolCurrency}>VND</Text>
          </Text>

          <View style={styles.networkBadge}>
            <Animated.View style={[styles.liveDotRing, { transform: [{ scale: pulseAnim }] }]} />
            {/* <View style={styles.liveDotCore} /> */}
            <Text style={styles.networkText}>Đã kết nối Sui Mainnet</Text>
          </View>
        </View>
      </View>

      {/* Sub-Campaign Pools */}
      <View style={styles.campaignsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quỹ phụ chiến dịch</Text>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>Xem tất cả</Text>
            <Ionicons name="arrow-forward" size={16} color="#1E40AF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.campaignsScroll}
          snapToInterval={276}
          decelerationRate="fast"
        >
          {CAMPAIGNS.map(campaign => (
            <View key={campaign.id} style={styles.campaignCard}>
              <View style={styles.campaignImageContainer}>
                <Image source={{ uri: campaign.image }} style={styles.campaignImage} />
                {campaign.verified && (
                  <View style={styles.campaignVerifiedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#1E40AF" />
                    <Text style={styles.campaignVerifiedText}>ĐÃ XÁC MINH</Text>
                  </View>
                )}
              </View>
              <View style={styles.campaignInfo}>
                <Text style={styles.campaignTitle}>{campaign.title}</Text>
                <View style={styles.campaignAmount}>
                  <Text style={styles.campaignAmountText}>{campaign.amount}</Text>
                  <Text style={styles.campaignCurrency}>VND</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${campaign.progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{campaign.progress}% mục tiêu đạt được</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Ledger Header */}
      <View style={styles.ledgerHeader}>
        <View style={styles.ledgerTitleRow}>
          <Text style={styles.ledgerTitle}>Sổ cái toàn cầu</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveBadgeDot} />
            <Text style={styles.liveBadgeText}>TRỰC TIẾP</Text>
          </View>
          {loading && <ActivityIndicator size="small" color="#1E40AF" style={{ marginLeft: 8 }} />}
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          {(['all', 'inflow', 'outflow'] as FilterType[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterButton, selectedFilter === f && styles.filterButtonActive]}
              onPress={() => setSelectedFilter(f)}
            >
              {f === 'inflow' && <Ionicons name="arrow-down" size={13} color="#1E40AF" />}
              {f === 'outflow' && <Ionicons name="arrow-up" size={13} color="#EA580C" />}
              <Text style={[styles.filterText, selectedFilter === f && styles.filterTextActive]}>
                {f === 'all' ? 'Tất cả' : f === 'inflow' ? 'Vào' : 'Ra'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Error state */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchTransactions(1)}>
            <Text style={styles.errorRetryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty state */}
      {!loading && !error && filteredTransactions.length === 0 && (
        <View style={styles.emptyBox}>
          <Ionicons name="receipt-outline" size={40} color="#D1D5DB" />
          <Text style={styles.emptyText}>Không có giao dịch nào</Text>
        </View>
      )}
    </View>
  );

  // ─── Transaction row ───────────────────────────────────────────────────────

  const renderTransaction = ({ item }: { item: MappedTransaction }) => {
    const showPool = !!item.poolName && item.poolName !== 'Quỹ chung';
    const showTime = item.time !== '—';

    return (
      <TouchableOpacity
        style={[
          styles.transactionItem,
          item.type === 'outflow' && styles.transactionOutflow,
        ]}
        activeOpacity={0.7}
      >
        <View style={styles.transactionLeft}>
          <View
            style={[
              styles.transactionIcon,
              item.type === 'outflow' ? styles.iconOutflow : styles.iconInflow,
            ]}
          >
            <Ionicons
              name={item.type === 'inflow' ? 'arrow-down' : 'arrow-up'}
              size={18}
              color={item.type === 'inflow' ? '#1E40AF' : '#EA580C'}
            />
          </View>

          <View style={styles.transactionDetails}>
            <Text style={styles.transactionMessage} numberOfLines={1}>
              {item.description}
            </Text>
            <View style={styles.addressRow}>
              <Text style={styles.transactionAddress}>{item.address}</Text>
              <Ionicons name="open-outline" size={12} color="#9CA3AF" />
            </View>
            <View style={styles.transactionMeta}>
              {showTime && (
                <>
                  <Text style={styles.transactionTime}>{item.time}</Text>
                  <View style={styles.metaDot} />
                </>
              )}
              <Text
                style={[
                  styles.transactionCategory,
                  item.type === 'outflow'
                    ? { color: '#EA580C' }
                    : { color: '#1E40AF' },
                ]}
              >
                {item.coinType}
              </Text>
              {showPool && (
                <>
                  <View style={styles.metaDot} />
                  <Text style={styles.transactionPoolName} numberOfLines={1}>
                    {item.poolName}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.transactionRight}>
          <Text
            style={[
              styles.transactionAmount,
              item.type === 'inflow' ? styles.amountInflow : styles.amountOutflow,
            ]}
          >
            {item.amount}
          </Text>
          <Text style={styles.transactionCoinSuffix}>{item.coinType}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Load more footer ──────────────────────────────────────────────────────

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoading}>
          <ActivityIndicator size="small" color="#1E40AF" />
          <Text style={styles.footerLoadingText}>Đang tải thêm…</Text>
        </View>
      );
    }
    if (transactions.length > 0 && page >= totalPages) {
      return (
        <View style={styles.footerEnd}>
          <Text style={styles.footerEndText}>— Đã xem hết giao dịch —</Text>
        </View>
      );
    }
    return null;
  };

  // ─── Root render ──────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1E40AF"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Top nav
  topNav: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.5)',
  },
  navTitle: { fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center' },

  // Pool card
  poolCard: {
    margin: 16,
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  poolGradient: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#EFF6FF',
  },
  poolContent: { padding: 24, alignItems: 'center' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  verifiedText: { fontSize: 10, fontWeight: '700', color: '#1E40AF', letterSpacing: 1 },
  poolAmount: { fontSize: 36, fontWeight: '800', color: '#111827' },
  poolCurrency: { fontSize: 16, fontWeight: '500', color: '#6B7280' },
  poolUsd: { fontSize: 13, fontWeight: '500', color: '#6B7280', marginTop: 4 },
  networkBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#EFF6FF', borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  liveDotRing: {
    position: 'absolute', width: 10, height: 10, borderRadius: 5,
    backgroundColor: 'rgba(30, 64, 175, 0.3)',
  },
  liveDotCore: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1E40AF' },
  networkText: { fontSize: 12, fontWeight: '700', color: '#1E40AF', marginLeft: 10 },

  // Campaigns
  campaignsSection: { marginTop: 8 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  viewAllButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAllText: { fontSize: 13, fontWeight: '700', color: '#1E40AF' },
  campaignsScroll: { paddingHorizontal: 16, gap: 14, paddingBottom: 16 },
  campaignCard: {
    width: 260, backgroundColor: '#FFFFFF', borderRadius: 16,
    overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  campaignImageContainer: { width: '100%', height: 128, position: 'relative' },
  campaignImage: { width: '100%', height: '100%' },
  campaignVerifiedBadge: {
    position: 'absolute', top: 8, right: 8, flexDirection: 'row',
    alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
  },
  campaignVerifiedText: { fontSize: 10, fontWeight: '700', color: '#111827' },
  campaignInfo: { padding: 12 },
  campaignTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  campaignAmount: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 },
  campaignAmountText: { fontSize: 17, fontWeight: '700', color: '#1E40AF' },
  campaignCurrency: { fontSize: 11, fontWeight: '500', color: '#6B7280' },
  progressBar: {
    width: '100%', height: 6, backgroundColor: '#F1F5F9',
    borderRadius: 3, marginTop: 10, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#1E40AF', borderRadius: 3 },
  progressText: { fontSize: 10, color: '#9CA3AF', textAlign: 'right', marginTop: 4 },

  // Ledger
  ledgerHeader: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 20, paddingHorizontal: 20, paddingBottom: 10,
    marginTop: 12, borderTopWidth: 1, borderColor: '#F1F5F9',
  },
  ledgerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  ledgerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#EFF6FF', paddingHorizontal: 8,
    paddingVertical: 2, borderRadius: 10,
  },
  liveBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1E40AF' },
  liveBadgeText: { fontSize: 10, fontWeight: '700', color: '#1E40AF' },

  // Filters
  filterContainer: {
    flexDirection: 'row', backgroundColor: '#F1F5F9',
    borderRadius: 12, padding: 4, gap: 4,
  },
  filterButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 8,
  },
  filterButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 2, elevation: 1,
  },
  filterText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  filterTextActive: { color: '#111827' },

  // Error / empty
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEE2E2', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#FECACA',
  },
  errorBannerText: { flex: 1, fontSize: 13, color: '#DC2626' },
  errorRetryText: { fontSize: 13, fontWeight: '700', color: '#1E40AF' },
  emptyBox: {
    alignItems: 'center', gap: 8, paddingVertical: 40,
    backgroundColor: '#FFFFFF',
  },
  emptyText: { fontSize: 14, color: '#9CA3AF' },

  // Transaction row
  transactionItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  transactionOutflow: { backgroundColor: '#FFF7ED' },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  transactionIcon: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  iconInflow: { backgroundColor: '#EFF6FF' },
  iconOutflow: { backgroundColor: '#FFEDD5' },
  transactionDetails: { flex: 1 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  transactionAddress: { fontSize: 14, fontWeight: '700', color: '#111827' },
  transactionMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  transactionTime: { fontSize: 11, color: '#6B7280' },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#D1D5DB' },
  transactionCategory: { fontSize: 11, fontWeight: '600' },
  transactionPoolName: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  transactionRight: { alignItems: 'flex-end', minWidth: 90 },
  transactionAmount: { fontSize: 14, fontWeight: '700' },
  amountInflow: { color: '#1E40AF' },
  amountOutflow: { color: '#EA580C' },
  transactionDescription: { fontSize: 10, color: '#9CA3AF', marginTop: 2, maxWidth: 100 },
  transactionMessage: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  transactionCoinSuffix: { fontSize: 11, color: '#9CA3AF', marginTop: 2, fontWeight: '600' },

  // Load more
  loadMoreBtn: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  loadMoreText: { fontSize: 13, fontWeight: '600', color: '#1E40AF' },

  footerLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerLoadingText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  footerEnd: {
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerEndText: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
});

export default HomeScreen;