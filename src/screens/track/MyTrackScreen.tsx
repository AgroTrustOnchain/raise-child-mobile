import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../../store';
import { getSupportedChildren } from '../../services/child.service';
import { API_BASE_URL } from '../../services/api.service';

const MyTrackScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAppSelector((state) => state.auth);
  const walletAddress = user?.walletAddress ?? '';

  const [children, setChildren] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const isFetching = useRef(false);

  const fetchPage = useCallback(async (pageNum: number, replace: boolean) => {
    if (!walletAddress || isFetching.current) return;
    isFetching.current = true;
    try {
      const res = await getSupportedChildren(walletAddress, pageNum);
      const incoming = res.data ?? [];
      setChildren((prev) => (replace ? incoming : [...prev, ...incoming]));
      setTotalPages(res.total_pages || 1);
      setTotalAmount(res.amount || 0);
      setPage(pageNum);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải danh sách trẻ em. Vui lòng thử lại.');
    } finally {
      isFetching.current = false;
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [walletAddress]);

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

  const getChildName = (c: any) =>
    `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Không có tên';

  const getAvatarUri = (c: any): string | undefined => {
    if (!c.avatar_blob_id || c.avatar_blob_id === 'AgroTrust') return undefined;
    return `${API_BASE_URL.replace(/\/+$/, '')}/blobs/${c.avatar_blob_id}`;
  };

  const getAge = (dob: string): number | undefined => {
    if (!dob || dob.startsWith('1970')) return undefined;
    const b = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
    return age;
  };

  const filtered = children.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      getChildName(c).toLowerCase().includes(q) ||
      (c.region || '').toLowerCase().includes(q) ||
      (c.home_address || '').toLowerCase().includes(q)
    );
  });

  const renderHeader = () => (
    <View>
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm trẻ em..."
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
        <Text style={styles.sectionTitle}>Hỗ trợ đang hoạt động</Text>
        {!loading && (
          <Text style={styles.totalCount}>{totalAmount} tổng cộng</Text>
        )}
      </View>
    </View>
  );

  const renderChildCard = ({ item: c }: { item: any }) => {
    const name = getChildName(c);
    const avatarUri = getAvatarUri(c);
    const age = getAge(c.date_of_birth);

    return (
      <TouchableOpacity
        style={styles.childCard}
        onPress={() => navigation.navigate('ProofScreen', { childId: c.id })}
        activeOpacity={0.9}
      >
        {/* Image */}
        <View style={styles.imageContainer}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.childImage} />
          ) : (
            <View style={[styles.childImage, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={48} color="#BFDBFE" />
            </View>
          )}
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
            <Text style={styles.verifiedText}>Đã xác minh Blockchain</Text>
          </View>
          {!!c.region && c.region !== 'AgroTrust' && (
            <View style={styles.regionBadge}>
              <Ionicons name="location" size={10} color="#FFFFFF" />
              <Text style={styles.regionText}>{c.region}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.childInfo}>
              <Text style={styles.childName}>{name}</Text>
              <Text style={styles.childMeta}>
                {age !== undefined ? `${age} tuổi` : ''}
                {age !== undefined && c.gender ? ' • ' : ''}
                {c.gender === 'male' ? 'Nam' : c.gender === 'female' ? 'Nữ' : ''}
              </Text>
            </View>
            <View style={styles.chevronButton}>
              <Ionicons name="chevron-forward" size={20} color="#1E40AF" />
            </View>
          </View>

          {/* Address */}
          {!!c.home_address && c.home_address !== 'AgroTrust' && (
            <View style={styles.infoRow}>
              <Ionicons name="home-outline" size={14} color="#6B7280" />
              <Text style={styles.infoText} numberOfLines={1}>{c.home_address}</Text>
            </View>
          )}

          {/* Needs summary */}
          <View style={styles.needsRow}>
            {c.books_needs?.length > 0 && (
              <View style={styles.needChip}>
                <Ionicons name="book-outline" size={12} color="#1E40AF" />
                <Text style={styles.needChipText}>Sách ({c.books_needs.length})</Text>
              </View>
            )}
            {!!c.meal_need && (
              <View style={styles.needChip}>
                <Ionicons name="restaurant-outline" size={12} color="#1E40AF" />
                <Text style={styles.needChipText}>Bữa ăn</Text>
              </View>
            )}
            {!!c.health_insurance_need && (
              <View style={styles.needChip}>
                <Ionicons name="medkit-outline" size={12} color="#1E40AF" />
                <Text style={styles.needChipText}>Sức khoẻ</Text>
              </View>
            )}
          </View>

          {/* Guardian */}
          {c.first_guardian?.guardian_full_name && c.first_guardian.guardian_full_name !== 'AgroTrust' && (
            <View style={styles.guardianRow}>
              <Ionicons name="person-outline" size={14} color="#6B7280" />
              <Text style={styles.guardianText}>
                {c.first_guardian.guardian_full_name}
                {c.first_guardian.guardian_relation ? ` (${c.first_guardian.guardian_relation})` : ''}
              </Text>
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
        <Ionicons name="people-outline" size={56} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>Chưa có trẻ em được hỗ trợ</Text>
        <Text style={styles.emptySubtitle}>
          {walletAddress
            ? 'Bạn chưa bảo trợ cho trẻ em nào. Hãy khám phá để bắt đầu.'
            : 'Vui lòng kết nối ví để xem danh sách.'}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <ActivityIndicator size="small" color="#1E40AF" style={{ marginVertical: 16 }} />;
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
          renderItem={renderChildCard}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
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
    paddingTop: 8,
    paddingBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  totalCount: { fontSize: 14, fontWeight: '700', color: '#1E40AF' },

  childCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: { width: '100%', height: 180, position: 'relative' },
  childImage: { width: '100%', height: '100%' },
  avatarPlaceholder: { backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  verifiedBadge: {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#1E40AF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  verifiedText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  regionBadge: {
    position: 'absolute', bottom: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  regionText: { fontSize: 10, fontWeight: '600', color: '#FFFFFF' },

  cardContent: { padding: 16, gap: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  childInfo: { flex: 1 },
  childName: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 2 },
  childMeta: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  chevronButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center',
  },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { flex: 1, fontSize: 12, color: '#6B7280' },

  needsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  needChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1, borderColor: '#DBEAFE',
  },
  needChipText: { fontSize: 11, fontWeight: '600', color: '#1E40AF' },

  guardianRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  guardianText: { fontSize: 12, color: '#6B7280', flex: 1 },

  emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
});

export default MyTrackScreen;
