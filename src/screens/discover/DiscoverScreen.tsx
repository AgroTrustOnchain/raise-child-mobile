// src/screens/nft/ExploreScreen.tsx (Renamed to match Discover functionality)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCampaigns, mapBackendToCampaign } from '../../services/campaign.service';
import { API_BASE_URL } from '../../services/api.service';
import { useNavigation } from '@react-navigation/native';
// import { useNFT } from '../../hooks/useNFT';
// import type { NFT } from '../../services/nft.service';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'grid-outline', color: '#2E7D32', active: true },
  { id: 'nutrition', label: 'Nutrition', icon: 'restaurant-outline', color: '#F97316' },
  { id: 'education', label: 'Education', icon: 'school-outline', color: '#3B82F6' },
  { id: 'health', label: 'heart-outline', color: '#EF4444' },
];

const DiscoverScreen = () => {
  const navigation = useNavigation<any>();
//   const { nfts, loadNFTs, isLoading } = useNFT();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     loadNFTs();
//   }, []);

  const onRefresh = async () => {
    await loadCampaigns();
  };

  const loadCampaigns = async () => {
    try {
      setRefreshing(true);
      setLoading(true);
      const res = await getCampaigns(1, 20);
      const items = Array.isArray(res.data) ? res.data : res.data || res;
      const mapped = items.map((it: any) => mapBackendToCampaign(it, API_BASE_URL) );
      setCampaigns(mapped);
    } catch (e) {
      console.warn('Failed to load campaigns', e);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const handleProjectPress = (nftId: string, region?: string) => {
    navigation.navigate('CampaignDetail', { campaignId: nftId, region });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Top Bar */}
      {/* <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="leaf" size={20} color="#fff" />
          </View>
          <Text style={styles.logoText}>AgroTrust</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View> */}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search projects, regions, or needs..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    </View>
  );

  const renderCategories = () => (
    <View style={styles.categoriesSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllText}>View all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.categoryChipActive,
              selectedCategory === category.id && { backgroundColor: category.color }
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons 
              name={category.icon as any} 
              size={16} 
              color={selectedCategory === category.id ? '#fff' : category.color}
            />
            <Text style={[
              styles.categoryText,
              selectedCategory === category.id && styles.categoryTextActive
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderProjectCard = ({ item }: { item: any }) => {
    const raised = 1240;
    const goal = 2000;
    const percentage = (raised / goal) * 100;
    const donors = 26;

    return (
      <TouchableOpacity
        style={styles.projectCard}
        onPress={() => handleProjectPress(item.id, item.raw?.region || item.region)}
        activeOpacity={0.95}
      >
        {/* Project Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: item.image }} 
            style={styles.projectImage}
            resizeMode="cover"
          />
          
          {/* Verified Badge */}
          <View style={styles.verifiedBadge}>
            <View style={styles.suiDot} />
            <Text style={styles.verifiedText}>VERIFIED ON SUI</Text>
          </View>

          {/* Category Badge */}
          <View style={[styles.categoryBadge, { backgroundColor: '#DBEAFE' }]}>
            <Text style={[styles.categoryBadgeText, { color: '#1E40AF' }]}>
              Education
            </Text>
          </View>
        </View>

        {/* Project Info */}
        <View style={styles.projectInfo}>
          <Text style={styles.projectTitle} numberOfLines={1}>
            {item.name}
          </Text>
          
          <Text style={styles.projectDescription} numberOfLines={2}>
            {item.description}
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Text style={styles.raisedText}>${raised} raised</Text>
              <Text style={styles.goalText}>Goal: ${goal}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${percentage}%` }]} />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.projectFooter}>
            <View style={styles.donorsContainer}>
              {/* Mock donor avatars */}
              <Image 
                source={{ uri: 'https://i.pravatar.cc/150?img=1' }}
                style={styles.donorAvatar}
              />
              <Image 
                source={{ uri: 'https://i.pravatar.cc/150?img=2' }}
                style={[styles.donorAvatar, { marginLeft: -8 }]}
              />
              <View style={[styles.donorAvatar, styles.donorCount, { marginLeft: -8 }]}>
                <Text style={styles.donorCountText}>+{donors - 2}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.donateButton}>
              <Text style={styles.donateButtonText}>Donate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={campaigns.length > 0 ? campaigns : MOCK_NFTS}
        renderItem={renderProjectCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <>
            {renderHeader()}
            {renderCategories()}
            <Text style={styles.urgentTitle}>Urgent Needs</Text>
          </>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  listContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
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
  categoriesSection: {
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2E7D32',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  categoryChipActive: {
    borderColor: 'transparent',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryTextActive: {
    color: '#fff',
  },
  urgentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: 192,
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  projectImage: {
    width: '100%',
    height: '100%',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  suiDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3E90F0',
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  projectInfo: {
    padding: 16,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  projectDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  raisedText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2E7D32',
  },
  goalText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 4,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  donorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  donorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
  },
  donorCount: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  donorCountText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
  },
  donateButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  donateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DiscoverScreen;

export const MOCK_NFTS = [
  {
    id: '1',
    name: 'Build Schools for Rural Children',
    description:
      'Help provide access to quality education for children in remote rural areas.',
    image:
      'https://images.unsplash.com/photo-1604881988768-9752b8db3c8f',
    category: 'education',
  },
  {
    id: '2',
    name: 'Emergency Food Aid Program',
    description:
      'Providing nutritious meals to families affected by natural disasters.',
    image:
      'https://images.unsplash.com/photo-1593113598332-cd288d649433',
    category: 'nutrition',
  },
  {
    id: '3',
    name: 'Clean Water for Villages',
    description:
      'Building clean water systems to prevent disease and improve health.',
    image:
      'https://images.unsplash.com/photo-1509099836639-18ba02c7d3a5',
    category: 'health',
  },
  {
    id: '4',
    name: 'School Supplies for Kids',
    description:
      'Supplying books, backpacks, and essential tools for underprivileged students.',
    image:
      'https://images.unsplash.com/photo-1588072432836-e10032774350',
    category: 'education',
  },
  {
    id: '5',
    name: 'Nutrition for Pregnant Mothers',
    description:
      'Supporting maternal health with proper nutrition and care programs.',
    image:
      'https://images.unsplash.com/photo-1544025162-d76694265947',
    category: 'nutrition',
  },
];
