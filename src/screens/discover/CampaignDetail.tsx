// src/screens/nft/NFTDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
// import { useNFT } from '../../hooks/useNFT';

interface Beneficiary {
  id: string;
  name: string;
  age: number;
  grade: number;
  image?: string;
  description: string;
  status: 'available' | 'sponsored';
}

const BENEFICIARIES: Beneficiary[] = [
  {
    id: '1',
    name: 'Amani K.',
    age: 8,
    grade: 3,
    image: 'https://i.pravatar.cc/150?img=1',
    description: 'Loves mathematics and dreams of becoming a pilot.',
    status: 'available',
  },
  {
    id: '2',
    name: 'David M.',
    age: 10,
    grade: 5,
    image: 'https://i.pravatar.cc/150?img=2',
    description: 'Aspiring doctor who enjoys playing soccer after school.',
    status: 'available',
  },
  {
    id: '3',
    name: 'Sarah J.',
    age: 7,
    grade: 2,
    image: 'https://i.pravatar.cc/150?img=3',
    description: 'Loves drawing animals and helping her mom cook.',
    status: 'sponsored',
  },
  {
    id: '4',
    name: 'Lucas P.',
    age: 6,
    grade: 1,
    description: 'Curious about nature and wants to be a scientist.',
    status: 'available',
  },
  {
    id: '5',
    name: 'Elena R.',
    age: 9,
    grade: 4,
    description: 'Enjoys reading stories and writing poems.',
    status: 'available',
  },
];

const CampaignDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
//   const { selectedNFT, loadNFTById } = useNFT();
  const [sortBy, setSortBy] = useState<'name' | 'age'>('name');

//   useEffect(() => {
//     const { nftId } = route.params as { nftId: string };
//     if (nftId) {
//       loadNFTById(nftId);
//     }
//   }, [route.params]);

  const handleSponsor = (beneficiary: Beneficiary) => {
    if (beneficiary.status === 'sponsored') {
      Alert.alert('Already Sponsored', 'This beneficiary is already sponsored.');
      return;
    }
    Alert.alert(
      'Sponsor Beneficiary',
      `Would you like to sponsor ${beneficiary.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sponsor', onPress: () => Alert.alert('Success', 'Sponsorship initiated!') },
      ]
    );
  };

  const handleSort = () => {
    setSortBy(prev => prev === 'name' ? 'age' : 'name');
  };

  const sortedBeneficiaries = [...BENEFICIARIES].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return a.age - b.age;
  });

  const renderHeader = () => (
    <View>
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          School Lunch Program
        </Text>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="information-circle-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* Campaign Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.cardHeader}>
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#13ec5b" />
            <Text style={styles.verifiedText}>BLOCKCHAIN VERIFIED</Text>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>Nutrition</Text>
          </View>
        </View>

        <Text style={styles.poolLabel}>Total Pool Balance</Text>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceAmount}>128,500</Text>
          <Text style={styles.balanceCurrency}>SUI</Text>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>PROGRESS</Text>
            <Text style={styles.progressPercentage}>85%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '85%' }]} />
          </View>
        </View>
      </View>

      {/* Beneficiaries Header */}
      <View style={styles.beneficiariesHeader}>
        <Text style={styles.beneficiariesTitle}>Beneficiaries</Text>
        <TouchableOpacity style={styles.sortButton} onPress={handleSort}>
          <Text style={styles.sortText}>SORT BY</Text>
          <Ionicons name="swap-vertical" size={18} color="#13ec5b" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBeneficiary = ({ item }: { item: Beneficiary }) => {
    const isSponsored = item.status === 'sponsored';
    
    return (
      <View style={[styles.beneficiaryCard, isSponsored && styles.beneficiaryCardSponsored]}>
        {/* Image */}
        <View style={styles.beneficiaryImageContainer}>
          {item.image ? (
            <>
              <Image 
                source={{ uri: item.image }} 
                style={[styles.beneficiaryImage, isSponsored && styles.imageSponsoredFilter]}
              />
              {isSponsored && (
                <View style={styles.sponsoredOverlay}>
                  <Ionicons name="checkmark-circle" size={48} color="#fff" />
                </View>
              )}
            </>
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="person" size={48} color="#9CA3AF" />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.beneficiaryInfo}>
          <View style={styles.beneficiaryHeader}>
            <View style={styles.beneficiaryNameSection}>
              <Text style={styles.beneficiaryName}>{item.name}</Text>
              <Text style={styles.beneficiaryMeta}>
                Age: {item.age} • Grade {item.grade}
              </Text>
            </View>
            <View style={[
              styles.statusBadge,
              isSponsored ? styles.statusBadgeSponsored : styles.statusBadgeAvailable
            ]}>
              <Text style={[
                styles.statusText,
                isSponsored ? styles.statusTextSponsored : styles.statusTextAvailable
              ]}>
                {isSponsored ? 'Sponsored' : 'Available'}
              </Text>
            </View>
          </View>

          <Text style={styles.beneficiaryDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.sponsorButton,
            isSponsored && styles.sponsorButtonDisabled
          ]}
          onPress={() => handleSponsor(item)}
          disabled={isSponsored}
        >
          <Ionicons 
            name={isSponsored ? 'lock-closed' : 'heart'} 
            size={20} 
            color={isSponsored ? '#9CA3AF' : '#fff'} 
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedBeneficiaries}
        renderItem={renderBeneficiary}
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
    paddingBottom: 24,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(246, 248, 246, 0.9)',
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
    color: '#1F2937',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  infoCard: {
    margin: 16,
    marginTop: 8,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(19, 236, 91, 0.2)',
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 0.5,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  poolLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1F2937',
  },
  balanceCurrency: {
    fontSize: 18,
    fontWeight: '500',
    color: '#0ea640',
  },
  progressSection: {
    marginTop: 16,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B7280',
    letterSpacing: 1,
  },
  progressPercentage: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B7280',
    letterSpacing: 1,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#13ec5b',
    borderRadius: 5,
  },
  beneficiariesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  beneficiariesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#13ec5b',
    letterSpacing: 0.5,
  },
  beneficiaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  beneficiaryCardSponsored: {
    opacity: 0.8,
  },
  beneficiaryImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  beneficiaryImage: {
    width: '100%',
    height: '100%',
  },
  imageSponsoredFilter: {
    opacity: 0.5,
  },
  sponsoredOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  beneficiaryInfo: {
    flex: 1,
    gap: 4,
  },
  beneficiaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  beneficiaryNameSection: {
    flex: 1,
  },
  beneficiaryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  beneficiaryMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeAvailable: {
    backgroundColor: 'rgba(19, 236, 91, 0.1)',
    borderColor: 'rgba(19, 236, 91, 0.2)',
  },
  statusBadgeSponsored: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusTextAvailable: {
    color: '#0ea640',
  },
  statusTextSponsored: {
    color: '#6B7280',
  },
  beneficiaryDescription: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
    marginTop: 4,
  },
  sponsorButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#13ec5b',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#13ec5b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sponsorButtonDisabled: {
    backgroundColor: '#F3F4F6',
    shadowOpacity: 0,
  },
});

export default CampaignDetail;