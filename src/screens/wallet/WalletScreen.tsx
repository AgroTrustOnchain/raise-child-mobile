import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Badge {
  id: string;
  title: string;
  tier: string;
  image: string;
  verified: boolean;
}

interface Transaction {
  id: string;
  title: string;
  amount: string;
  amountCrypto: string;
  date: string;
  icon: keyof typeof Ionicons.glyphMap;
  isIncoming: boolean;
  hasExplorer: boolean;
}

const WalletScreen = () => {
  const insets = useSafeAreaInsets();

  const [balance] = useState({
    usd: '$1,248.50',
    crypto: '845.20 SUI',
    network: 'SUI',
  });

  const badges: Badge[] = [
    {
      id: '1',
      title: 'Seed Sower #42',
      tier: 'Gold Tier',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2i2YL68NSk1J9vyAJywSPcCqgJdE-bcKRaBc_z0b-Zd7pMCzS7kXaj4QZrDF4a3IGpw3x_nAB_PGHzm3X-ptSc13pS031T2V4sS0Qr7I2oLCjDxip06Goz4BKjO4iGKI9FYAt5xiPcWHS73Wpo9Ua0vvR9VyvxNEFE1QP5iicmpv7ROqB1Bc5aAag5AE_K5ow-6UyCx5lYXjEvo6UYI_1STd8J0Rff-ekbr-CgzvtW0L39kfnJKirfVi5yHYS2w_1BzLihca6Ahlt',
      verified: true,
    },
    {
      id: '2',
      title: 'Knowledge Keeper',
      tier: 'Rare',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvVNzDrD7Npuzkca_2WOHC6gYDJ8gT0GsbbtHPwuR8cLBttJf-bhq0WL6ucdtE0ReK4qWOWHTb3LRYYnr046nveZp3OyafmhBzphgXcTc6E-doWQ1GvFkUnQi9hMZYsp4lrwziLqGUAgmnYPt9yBVbSDXUzFW0H0XwhyAaAAJdSIhueLg9YUr89nqBk0EFAzUUU73Rp0QcCmAG_VfF5xu_ZI1ccVIZRyOaICThR_VM0SZEv7BrzPFc_4kC4JDbr_GzEuyA2srRGeQ8',
      verified: true,
    },
  ];

  const transactions: Transaction[] = [
    {
      id: '1',
      title: 'Child Welfare Fund',
      amount: '- $50.00',
      amountCrypto: '34.2 SUI',
      date: 'Today, 10:23 AM',
      icon: 'heart',
      isIncoming: false,
      hasExplorer: true,
    },
    {
      id: '2',
      title: 'Wallet Deposit',
      amount: '+ $200.00',
      amountCrypto: '',
      date: 'Yesterday, 4:15 PM',
      icon: 'wallet',
      isIncoming: true,
      hasExplorer: false,
    },
    {
      id: '3',
      title: 'Rural Edu. Support',
      amount: '- $120.00',
      amountCrypto: '82.1 SUI',
      date: 'May 12, 09:00 AM',
      icon: 'school',
      isIncoming: false,
      hasExplorer: true,
    },
  ];

  const handleAddFunds = () => {
    Alert.alert('Add Funds', 'Add funds feature coming soon');
  };

  const handleDonate = () => {
    Alert.alert('Donate', 'Donate feature coming soon');
  };

  const handleQRCode = () => {
    Alert.alert('QR Code', 'Show wallet QR code');
  };

  const BadgeCard = ({ badge }: { badge: Badge }) => (
    <View style={styles.badgeCard}>
      <Image
        source={{ uri: badge.image }}
        style={styles.badgeImage}
        resizeMode="cover"
      />
      <View style={styles.badgeGradientOverlay}>
        <View style={styles.badgeInfo}>
          <Text style={styles.badgeTier}>{badge.tier}</Text>
          <Text style={styles.badgeTitle}>{badge.title}</Text>
        </View>
        {badge.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#60A5FA" />
          </View>
        )}
      </View>
    </View>
  );

  const TransactionItem = ({ transaction }: { transaction: Transaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionLeft}>
        <View style={styles.transactionIcon}>
          <Ionicons
            name={transaction.icon}
            size={20}
            color="#1E40AF"
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionTitle}>{transaction.title}</Text>
          <View style={styles.transactionMeta}>
            <Text style={styles.transactionDate}>{transaction.date}</Text>
            {transaction.hasExplorer && (
              <>
                <Text style={styles.metaDot}>•</Text>
                <TouchableOpacity>
                  <Text style={styles.explorerLink}>SUI Explorer</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
      <View style={styles.transactionAmount}>
        <Text
          style={[
            styles.amount,
            { color: transaction.isIncoming ? '#1E40AF' : '#111827' },
          ]}
        >
          {transaction.amount}
        </Text>
        {transaction.amountCrypto ? (
          <Text style={styles.amountCrypto}>{transaction.amountCrypto}</Text>
        ) : (
          <Text style={styles.bankTransfer}>Bank Transfer</Text>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container]}
      showsVerticalScrollIndicator={false}
    >
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <View>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>{balance.usd}</Text>
            <View style={styles.balanceMeta}>
              <Text style={styles.cryptoAmount}>≈ {balance.crypto}</Text>
              <View style={styles.networkBadge}>
                <Text style={styles.networkLabel}>NETWORK: {balance.network}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.qrButton}
            onPress={handleQRCode}
          >
            <Ionicons name="qr-code" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.addFundsButton}
            onPress={handleAddFunds}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Add Funds</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.donateButton}
            onPress={handleDonate}
          >
            <Ionicons name="heart" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Donate</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Philanthropist Badges Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Philanthropist Badges</Text>
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>5 Earned</Text>
            </View>
          </View>
          <TouchableOpacity>
            <View style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>Gallery</Text>
              <Ionicons name="chevron-forward" size={16} color="#1E40AF" />
            </View>
          </TouchableOpacity>
        </View>

        <FlatList
          data={badges}
          renderItem={({ item }) => <BadgeCard badge={item} />}
          keyExtractor={(item) => item.id}
          horizontal
          scrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.badgesList}
        />
      </View>

      {/* Donation Transactions Section */}
      <View style={styles.section}>
        <View style={styles.transactionHeader}>
          <Text style={styles.sectionTitle}>Donation Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {transactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
          />
        ))}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="shield-checkmark" size={20} color="#1E40AF" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>On-Chain Transparency</Text>
            <Text style={styles.infoText}>
              Every donation generates a verifiable impact certificate on the SUI blockchain.
              Impact NFTs represent your real-world contributions to rural welfare.
            </Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  balanceCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    backgroundColor: '#1E40AF',
    borderRadius: 24,
    padding: 28,
    overflow: 'hidden',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  balanceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cryptoAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  networkBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  networkLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  qrButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: 48,
    height: 48,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addFundsButton: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  badgeCount: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeCountText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1E40AF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  badgesList: {
    gap: 12,
  },
  badgeCard: {
    width: 160,
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  badgeImage: {
    width: '100%',
    height: '100%',
  },
  badgeGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'space-between',
    padding: 12,
  },
  badgeInfo: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  badgeTier: {
    fontSize: 9,
    fontWeight: '700',
    color: '#60A5FA',
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
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
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  transactionDate: {
    fontSize: 10,
    color: '#6B7280',
  },
  metaDot: {
    color: '#9CA3AF',
  },
  explorerLink: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1E40AF',
  },
  bankTransfer: {
    fontSize: 9,
    fontWeight: '500',
    color: '#6B7280',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  amountCrypto: {
    fontSize: 9,
    color: '#6B7280',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
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
    marginTop: 4,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
  },
});

export default WalletScreen;
