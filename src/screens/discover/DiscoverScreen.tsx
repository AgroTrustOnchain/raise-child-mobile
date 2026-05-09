// src/screens/discover/DiscoverScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCampaigns, CampaignItem } from '../../services/campaign.service';
import { useNavigation } from '@react-navigation/native';
import WalrusImage from '../../components/WalrusImage';

const PAGE_SIZE = 10;

const DiscoverScreen = () => {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [centers, setCenters] = useState<CampaignItem[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const onRefresh = async () => {
    await loadCenters();
  };

  const loadCenters = async () => {
    try {
      setRefreshing(true);
      const res = await getCampaigns(1, PAGE_SIZE);
      const list: CampaignItem[] = Array.isArray(res) ? res : res?.data ?? [];
      const totalPages = !Array.isArray(res) ? res?.total_pages : undefined;
      setCenters(list);
      setPage(1);
      setHasMore(
        typeof totalPages === 'number' ? 1 < totalPages : list.length >= PAGE_SIZE
      );
    } catch (e) {
      console.warn('Failed to load centers', e);
    } finally {
      setRefreshing(false);
    }
  };

  const loadMoreCenters = async () => {
    if (loadingMore || refreshing || !hasMore) return;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const res = await getCampaigns(nextPage, PAGE_SIZE);
      const list: CampaignItem[] = Array.isArray(res) ? res : res?.data ?? [];
      const totalPages = !Array.isArray(res) ? res?.total_pages : undefined;
      setCenters((prev) => {
        const seen = new Set(prev.map((c) => c.id));
        const merged = [...prev];
        for (const c of list) {
          if (!seen.has(c.id)) {
            merged.push(c);
            seen.add(c.id);
          }
        }
        return merged;
      });
      setPage(nextPage);
      setHasMore(
        typeof totalPages === 'number'
          ? nextPage < totalPages
          : list.length >= PAGE_SIZE
      );
    } catch (e) {
      console.warn('Failed to load more centers', e);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCenterPress = (center: CampaignItem) => {
    navigation.navigate('CampaignDetail', { campaignId: center.id, region: center.region });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm trung tâm..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    </View>
  );

  const renderCenterCard = ({ item }: { item: CampaignItem }) => {
    return (
      <TouchableOpacity
        style={styles.regionCard}
        onPress={() => handleCenterPress(item)}
        activeOpacity={0.95}
      >
        <View style={styles.regionCardContent}>
          {item.image_blob_id ? (
            <WalrusImage blobId={item.image_blob_id} style={styles.centerImage} resizeMode="cover" fallbackIconSize={32} />
          ) : (
            <View style={styles.regionIconContainer}>
              <Ionicons name="business" size={32} color="#1E40AF" />
            </View>
          )}
          <View style={styles.regionInfo}>
            <Text style={styles.regionName}>{item.region || 'Unknown Center'}</Text>
            <Text style={styles.regionSubtitle}>{item.address || 'Xem trẻ em'}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    loadCenters();
  }, []);

  if (refreshing && centers.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  const filteredCenters = centers.filter((center) => {
    if (searchQuery.trim() === '') return true;
    const query = searchQuery.toLowerCase();
    return (
      (center.region || '').toLowerCase().includes(query) ||
      (center.address || '').toLowerCase().includes(query)
    );
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredCenters}
        renderItem={renderCenterCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <>
            {renderHeader()}
            <Text style={styles.title}>Trung tâm</Text>
          </>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        onEndReached={loadMoreCenters}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#1E40AF" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Không tìm thấy trung tâm nào</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.5)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  regionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  regionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  centerImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  regionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  regionInfo: {
    flex: 1,
  },
  regionName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  regionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
});

export default DiscoverScreen;
