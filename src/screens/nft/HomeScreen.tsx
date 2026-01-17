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
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
// import { useNFT } from '../../hooks/useNFT';
// import type { NFT } from '../../services/nft.service';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

const HomeScreen = () => {
  const navigation = useNavigation();
  const [ isLoading, setIsLoading ] = useState(false);
//   const { myNFTs, isLoading, loadMyNFTs } = useNFT();
  const loadMyNFTs = async () => {};
    const myNFTs: any[] = [];

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMyNFTs();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyNFTs();
    setRefreshing(false);
  };

  const handleNFTPress = (nftId: string) => {
    // navigation.navigate('NFTDetail' as never, { nftId } as never);
  };

  const renderNFTCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.nftCard}
      onPress={() => handleNFTPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item.image }} 
          style={styles.nftImage}
          resizeMode="cover"
        />
        {item.price && (
          <View style={styles.priceTag}>
            {/* <Ionicons name="logo-ethereum" size={12} color="#fff" /> */}
            <Text style={styles.priceText}>{item.price}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.nftInfo}>
        <Text style={styles.nftName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.creatorRow}>
          <Ionicons name="person-circle-outline" size={14} color="#999" />
          <Text style={styles.creatorText} numberOfLines={1}>
            {item.creator}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="images-outline" size={80} color="#e0e0e0" />
      </View>
      <Text style={styles.emptyTitle}>No NFTs Yet</Text>
      <Text style={styles.emptySubtext}>
        Start your collection by creating your first NFT
      </Text>
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => navigation.navigate('Create' as never)}
      >
        <Ionicons name="add-circle" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Create NFT</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.greeting}>My Collection</Text>
        <Text style={styles.subGreeting}>
          {myNFTs.length} {myNFTs.length === 1 ? 'NFT' : 'NFTs'}
        </Text>
      </View>
      <TouchableOpacity style={styles.filterButton}>
        <Ionicons name="filter" size={24} color="#6366f1" />
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!isLoading || myNFTs.length > 0) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#6366f1" />
      </View>
    );
  };

  if (isLoading && myNFTs.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading your collection...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={myNFTs}
        renderItem={renderNFTCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.listContent,
          myNFTs.length === 0 && styles.emptyListContent
        ]}
        ListHeaderComponent={myNFTs.length > 0 ? renderHeader : null}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#6366f1"
            colors={['#6366f1']}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subGreeting: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  nftCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  nftImage: {
    width: '100%',
    height: '100%',
  },
  priceTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  priceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  nftInfo: {
    padding: 12,
  },
  nftName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  creatorText: {
    fontSize: 12,
    color: '#999',
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default HomeScreen;