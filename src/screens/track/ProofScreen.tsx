// src/screens/profile/ImpactProofGalleryScreen.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

interface ImpactEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  amount: string;
  walletAddress: string;
  image: string;
  verified: boolean;
  isRecent: boolean;
}

const IMPACT_EVENTS: ImpactEvent[] = [
  {
    id: '1',
    date: 'Jan 12, 2024',
    title: 'Weekly Meal',
    description: 'Nutritional support for education',
    amount: '2.4',
    walletAddress: '0x74a2...d4',
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400',
    verified: true,
    isRecent: true,
  },
  {
    id: '2',
    date: 'Dec 28, 2023',
    title: 'Health Check',
    description: 'Quarterly pediatric screening',
    amount: '12.0',
    walletAddress: '0x3b2a...e1',
    image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=400',
    verified: true,
    isRecent: false,
  },
  {
    id: '3',
    date: 'Nov 15, 2023',
    title: 'School Supplies',
    description: 'Annual book and uniform kit',
    amount: '25.0',
    walletAddress: '0x88f2...9c',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400',
    verified: true,
    isRecent: false,
  },
];

const ProofScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const handleFilter = () => {
    Alert.alert('Filter Options', 'Filter functionality coming soon');
  };

  const handleViewProof = (event: ImpactEvent) => {
    Alert.alert(
      'Blockchain Proof',
      `Transaction: ${event.walletAddress}\nAmount: ${event.amount} SUI\nEvent: ${event.title}`,
      [
        { text: 'Close', style: 'cancel' },
        { text: 'View on Explorer', onPress: () => handleViewExplorer() },
      ]
    );
  };

  const handleViewExplorer = () => {
    // Example blockchain explorer URL
    const explorerUrl = 'https://explorer.sui.io';
    Linking.openURL(explorerUrl).catch(() => {
      Alert.alert('Error', 'Could not open blockchain explorer');
    });
  };

  return (
    <View style={styles.container}>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Malati's Journey</Text>
          <Text style={styles.subtitle}>
            A historical timeline of verifiable impact events.
          </Text>
        </View>

        {/* Timeline */}
        <View style={styles.timeline}>
          {/* Timeline Line */}
          <View style={styles.timelineLine} />

          {/* Events */}
          {IMPACT_EVENTS.map((event, index) => (
            <View key={event.id} style={styles.timelineItem}>
              {/* Date Header */}
              <View style={styles.dateHeader}>
                <View style={[
                  styles.timelineDot,
                  event.isRecent && styles.timelineDotActive
                ]} />
                <Text style={[
                  styles.dateText,
                  event.isRecent && styles.dateTextActive
                ]}>
                  {event.date}
                </Text>
              </View>

              {/* Event Card */}
              <TouchableOpacity
                style={[
                  styles.eventCard,
                  !event.isRecent && { opacity: index === 1 ? 0.9 : 0.8 }
                ]}
                onPress={() => handleViewProof(event)}
                activeOpacity={0.9}
              >
                {/* Event Image */}
                <View style={styles.eventImageContainer}>
                  <Image 
                    source={{ uri: event.image }} 
                    style={[
                      styles.eventImage,
                      !event.isRecent && { opacity: 0.95 }
                    ]}
                  />
                  {event.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="shield-checkmark" size={14} color="#1E40AF" />
                      <Text style={styles.verifiedText}>AI VERIFIED</Text>
                    </View>
                  )}
                </View>

                {/* Event Content */}
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventDescription}>{event.description}</Text>
                    </View>
                    <View style={styles.eventAmount}>
                      <Text style={styles.amountText}>{event.amount} SUI</Text>
                    </View>
                  </View>

                  {/* Event Footer */}
                  <View style={styles.eventFooter}>
                    <View style={styles.walletInfo}>
                      <Ionicons name="wallet" size={16} color="#1E40AF" />
                      <Text style={styles.walletAddress}>{event.walletAddress}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.viewProofButton}
                      onPress={() => handleViewProof(event)}
                    >
                      <Text style={styles.viewProofText}>VIEW PROOF</Text>
                      <Ionicons name="chevron-forward" size={12} color="#1E40AF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.explorerButton}
          onPress={handleViewExplorer}
          activeOpacity={0.95}
        >
          <Ionicons name="globe-outline" size={24} color="#FFFFFF" />
          <Text style={styles.explorerButtonText}>View on Blockchain Explorer</Text>
        </TouchableOpacity>
        <Text style={styles.protocolText}>
          VERIFIED BY AGROTRUST PROTOCOL V2.4
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: 'rgba(248,250,252,0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.5)',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  titleSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  timeline: {
    position: 'relative',
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  timelineLine: {
    position: 'absolute',
    left: 36,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#DBEAFE',
  },
  timelineItem: {
    position: 'relative',
    marginBottom: 32,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    marginLeft: 4,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DBEAFE',
    borderWidth: 2,
    borderColor: '#F8FAFC',
  },
  timelineDotActive: {
    backgroundColor: '#1E40AF',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  dateTextActive: {
    color: '#1E40AF',
  },
  eventCard: {
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
  eventImageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.5,
  },
  eventContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  eventAmount: {
    marginLeft: 12,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletAddress: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#9CA3AF',
  },
  viewProofButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewProofText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
    letterSpacing: 0.8,
  },
  bottomSpacing: {
    height: 120,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(248,250,252,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  explorerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#1E40AF',
    height: 60,
    borderRadius: 16,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  explorerButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  protocolText: {
    textAlign: 'center',
    fontSize: 10,
    color: '#9CA3AF',
    letterSpacing: 2,
    marginTop: 12,
  },
});

export default ProofScreen;