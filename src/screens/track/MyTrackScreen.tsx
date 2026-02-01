// src/screens/profile/MySponsoredChildrenScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface SponsoredChild {
  id: string;
  name: string;
  campaign: string;
  image: string;
  latestUpdate: string;
  updateIcon: string;
  daysProgress: number;
  totalDays: number;
}

const SPONSORED_CHILDREN: SponsoredChild[] = [
  {
    id: '1',
    name: 'Amara K.',
    campaign: 'Rural Education Initiative',
    image: 'https://i.pravatar.cc/300?img=1',
    latestUpdate: 'School supplies delivered today',
    updateIcon: 'checkmark-circle',
    daysProgress: 24,
    totalDays: 30,
  },
  {
    id: '2',
    name: 'Samuel O.',
    campaign: 'Clean Water Access Fund',
    image: 'https://i.pravatar.cc/300?img=2',
    latestUpdate: 'Weekly health check verified',
    updateIcon: 'checkmark-circle',
    daysProgress: 12,
    totalDays: 30,
  },
  {
    id: '3',
    name: 'Elena M.',
    campaign: 'Nutrition & Growth Program',
    image: 'https://i.pravatar.cc/300?img=3',
    latestUpdate: 'Lunch verified today',
    updateIcon: 'restaurant',
    daysProgress: 30,
    totalDays: 30,
  },
];

const MyTrackScreen = () => {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChildren = SPONSORED_CHILDREN.filter(child =>
    child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    child.campaign.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChildPress = (child: SponsoredChild) => {
    // Navigate to child detail screen
    navigation.navigate('ProofScreen' as never, { childId: child.id } as never);
  };

  const renderHeader = () => (
    <View>
      {/* Top Navigation */}
      {/* <View style={styles.topNav}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#111813" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>My Sponsored Children</Text>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="notifications-outline" size={24} color="#111813" />
        </TouchableOpacity>
      </View> */}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color="#61896f" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search children..."
            placeholderTextColor="#61896f"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Sponsorships</Text>
        <Text style={styles.totalCount}>{SPONSORED_CHILDREN.length} Total</Text>
      </View>
    </View>
  );

  const renderChildCard = ({ item }: { item: SponsoredChild }) => {
    const progressPercentage = (item.daysProgress / item.totalDays) * 100;

    return (
      <TouchableOpacity
        style={styles.childCard}
        onPress={() => handleChildPress(item)}
        activeOpacity={0.9}
      >
        {/* Child Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.childImage} />
          
          {/* Verified Badge */}
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#000" />
            <Text style={styles.verifiedText}>Blockchain Verified</Text>
          </View>
        </View>

        {/* Card Content */}
        <View style={styles.cardContent}>
          {/* Header Row */}
          <View style={styles.cardHeader}>
            <View style={styles.childInfo}>
              <Text style={styles.childName}>{item.name}</Text>
              <Text style={styles.campaignName}>{item.campaign}</Text>
            </View>
            <TouchableOpacity style={styles.chevronButton}>
              <Ionicons name="chevron-forward" size={24} color="#13ec5b" />
            </TouchableOpacity>
          </View>

          {/* Latest Update */}
          <View style={styles.updateBox}>
            <Ionicons 
              name={item.updateIcon as any} 
              size={20} 
              color="#13ec5b" 
            />
            <Text style={styles.updateText}>
              Latest Update: <Text style={styles.updateBold}>{item.latestUpdate}</Text>
            </Text>
          </View>

          {/* Progress Section */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>MONTHLY SUPPORT STATUS</Text>
              <Text style={styles.progressDays}>
                {item.daysProgress}/{item.totalDays} days
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredChildren}
        renderItem={renderChildCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8f6',
  },
  listContent: {
    paddingBottom: 100,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: 'rgba(246, 248, 246, 0.8)',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  navTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111813',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111813',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111813',
  },
  totalCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#13ec5b',
  },
  childCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: 192,
    position: 'relative',
  },
  childImage: {
    width: '100%',
    height: '100%',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#13ec5b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  cardContent: {
    padding: 20,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111813',
    marginBottom: 4,
  },
  campaignName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#61896f',
  },
  chevronButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(19, 236, 91, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f6f8f6',
    padding: 12,
    borderRadius: 12,
  },
  updateText: {
    flex: 1,
    fontSize: 14,
    color: '#111813',
  },
  updateBold: {
    fontWeight: 'bold',
  },
  progressSection: {
    marginTop: 8,
    gap: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#61896f',
    letterSpacing: 0.5,
  },
  progressDays: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111813',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#dbe6df',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#13ec5b',
    borderRadius: 4,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#e2e8e4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    paddingBottom: 24,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#61896f',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  navLabelActive: {
    fontWeight: 'bold',
    color: '#13ec5b',
  },
});

export default MyTrackScreen;