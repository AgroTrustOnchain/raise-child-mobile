// src/screens/nft/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
// import { useNFT } from '../../hooks/useNFT';
// import type { NFT } from '../../services/nft.service';

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

const TRANSACTIONS = [
  { id: '1', address: '0xd4...9e1c', time: 'Just now', type: 'outflow', amount: '-5,000', description: 'Milestone Payment', icon: 'cart-outline', category: 'Disbursement' },
  { id: '2', address: '0x8a...7e2b', time: '2 mins ago', type: 'inflow', amount: '+50', description: '≈ $62.50', icon: 'school-outline', category: 'Literacy Kits', color: '#3B82F6' },
  { id: '3', address: '0xf2...b3a9', time: '4 mins ago', type: 'outflow', amount: '-1,200', description: 'Medical Supplies', icon: 'medical-outline', category: 'Aid Provider' },
  { id: '4', address: '0x1c...a29d', time: '5 mins ago', type: 'inflow', amount: '+120', description: '≈ $150.00', icon: 'restaurant-outline', category: 'Nutrition', color: '#10B981' },
  { id: '5', address: '0x4f...b13e', time: '12 mins ago', type: 'inflow', amount: '+10', description: '≈ $12.50', icon: 'medkit-outline', category: 'Medical Aid', color: '#EF4444' },
  { id: '6', address: '0xa9...2c44', time: '24 mins ago', type: 'inflow', amount: '+350', description: '≈ $437.50', icon: 'restaurant-outline', category: 'Nutrition', color: '#10B981' },
  { id: '7', address: '0x7b...f11a', time: '1 hour ago', type: 'inflow', amount: '+25', description: '≈ $31.25', icon: 'school-outline', category: 'Literacy Kits', color: '#3B82F6' },
];

const HomeScreen = () => {
  const navigation = useNavigation();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    // Pulse animation for live indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const filteredTransactions = TRANSACTIONS.filter(tx => {
    if (selectedFilter === 'all') return true;
    return tx.type === selectedFilter;
  });

  const renderHeader = () => (
    <View>
      {/* Top Navigation */}
      <View style={styles.topNav}>
        {/* <TouchableOpacity style={styles.navButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity> */}
        <Text style={styles.navTitle}>AgroTrust Transparency</Text>
        {/* <TouchableOpacity style={styles.navButton}>
          <Ionicons name="information-circle-outline" size={24} color="#1F2937" />
        </TouchableOpacity> */}
      </View>

      {/* Total Pool Card */}
      <View style={styles.poolCard}>
        <View style={styles.poolGradient} />
        <View style={styles.poolContent}>
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#0ea640" />
            <Text style={styles.verifiedText}>VERIFIED AGGREGATE POOL</Text>
          </View>
          
          <Text style={styles.poolAmount}>
            1,240,500 <Text style={styles.poolCurrency}>SUI</Text>
          </Text>
          
          <Text style={styles.poolUsd}>≈ $1,542,300 USD Secured</Text>

          <View style={styles.networkBadge}>
            <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
            <View style={styles.liveDotCore} />
            <Text style={styles.networkText}>Sui Mainnet Connected</Text>
          </View>
        </View>
      </View>

      {/* Sub-Campaign Pools */}
      <View style={styles.campaignsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sub-Campaign Pools</Text>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="arrow-forward" size={16} color="#0ea640" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.campaignsScroll}
          snapToInterval={268}
          decelerationRate="fast"
        >
          {CAMPAIGNS.map((campaign) => (
            <View key={campaign.id} style={styles.campaignCard}>
              <View style={styles.campaignImageContainer}>
                <Image 
                  source={{ uri: campaign.image }} 
                  style={styles.campaignImage}
                />
                {campaign.verified && (
                  <View style={styles.campaignVerifiedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#13ec5b" />
                    <Text style={styles.campaignVerifiedText}>VERIFIED</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.campaignInfo}>
                <Text style={styles.campaignTitle}>{campaign.title}</Text>
                <View style={styles.campaignAmount}>
                  <Text style={styles.campaignAmountText}>{campaign.amount}</Text>
                  <Text style={styles.campaignCurrency}>SUI</Text>
                </View>
                
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${campaign.progress}%` }]} />
                </View>
                
                <Text style={styles.progressText}>{campaign.progress}% Goal Reached</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Ledger Header */}
      <View style={styles.ledgerHeader}>
        <View style={styles.ledgerTitleRow}>
          <Text style={styles.ledgerTitle}>Global Ledger</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveBadgeDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, selectedFilter === 'inflow' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('inflow')}
          >
            <Ionicons name="arrow-down" size={14} color="#0ea640" />
            <Text style={styles.filterText}>Inflow</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, selectedFilter === 'outflow' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('outflow')}
          >
            <Ionicons name="arrow-up" size={14} color="#ff6b00" />
            <Text style={styles.filterText}>Outflow</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderTransaction = ({ item }: { item: typeof TRANSACTIONS[0] }) => (
    <TouchableOpacity 
      style={[
        styles.transactionItem,
        item.type === 'outflow' && styles.transactionOutflow
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.transactionLeft}>
        <View style={[
          styles.transactionIcon,
          item.type === 'outflow' 
            ? styles.transactionIconOutflow 
            : { backgroundColor: item.color ? `${item.color}20` : '#E0F2FE' }
        ]}>
          <Ionicons 
            name={item.icon as any} 
            size={20} 
            color={item.type === 'outflow' ? '#ff6b00' : (item.color || '#0ea640')} 
          />
        </View>
        
        <View style={styles.transactionDetails}>
          <View style={styles.transactionAddressRow}>
            <Text style={styles.transactionAddress}>{item.address}</Text>
            <Ionicons name="open-outline" size={14} color="#9CA3AF" />
          </View>
          
          <View style={styles.transactionMeta}>
            <Text style={styles.transactionTime}>{item.time}</Text>
            <View style={styles.metaDot} />
            <Text style={[
              styles.transactionCategory,
              item.type === 'outflow' && { color: '#ff6b00' },
              item.color && { color: item.color }
            ]}>
              {item.category}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          item.type === 'outflow' ? styles.amountOutflow : styles.amountInflow
        ]}>
          {item.amount} SUI
        </Text>
        <Text style={styles.transactionDescription}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
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
    backgroundColor: '#f6f8f6',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  poolCard: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(19, 236, 91, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  poolGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(19, 236, 91, 0.05)',
  },
  poolContent: {
    padding: 24,
    alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0ea640',
    letterSpacing: 1,
  },
  poolAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1F2937',
  },
  poolCurrency: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
  },
  poolUsd: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(19, 236, 91, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(19, 236, 91, 0.2)',
  },
  liveDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(19, 236, 91, 0.3)',
  },
  liveDotCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#13ec5b',
  },
  networkText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0ea640',
    marginLeft: 8,
  },
  campaignsSection: {
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0ea640',
  },
  campaignsScroll: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 16,
  },
  campaignCard: {
    width: 260,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  campaignImageContainer: {
    width: '100%',
    height: 128,
    position: 'relative',
  },
  campaignImage: {
    width: '100%',
    height: '100%',
  },
  campaignVerifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  campaignVerifiedText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  campaignInfo: {
    padding: 12,
  },
  campaignTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  campaignAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 4,
  },
  campaignAmountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0ea640',
  },
  campaignCurrency: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#13ec5b',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  ledgerHeader: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
  ledgerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  ledgerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(19, 236, 91, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  liveBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#13ec5b',
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0ea640',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#1F2937',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  transactionOutflow: {
    backgroundColor: 'rgba(255, 107, 0, 0.02)',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionIconOutflow: {
    backgroundColor: '#fff0e6',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  transactionAddress: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  transactionTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  transactionCategory: {
    fontSize: 12,
    fontWeight: '500',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  amountInflow: {
    color: '#0ea640',
  },
  amountOutflow: {
    color: '#ff6b00',
  },
  transactionDescription: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
});

export default HomeScreen;