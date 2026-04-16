// src/screens/nft/BeneficiaryDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getChildById } from '../../services/child.service';
import { API_BASE_URL } from '../../services/api.service';
import { ActivityIndicator } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const ChildDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();

  const [beneficiary, setBeneficiary] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = route.params as { childId?: string } | undefined;
    const id = params?.childId as string | undefined;
    if (id) loadChild(id);
  }, [route.params]);

  const loadChild = async (id: string) => {
    try {
      setLoading(true);
      const c = await getChildById(id);
      // map backend fields to UI model expected by this screen
      const mapped = {
        id: c.id,
        name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
        age: (() => {
          if (!c.date_of_birth) return undefined;
          const b = new Date(c.date_of_birth);
          const now = new Date();
          let age = now.getFullYear() - b.getFullYear();
          const m = now.getMonth() - b.getMonth();
          if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
          return age;
        })(),
        grade: 0,
        image: c.avatar_blob_id ? `${API_BASE_URL.replace(/\/+$/, '')}/blobs/${c.avatar_blob_id}` : undefined,
        campaign: c.region || c.uploaded_by || '',
        status: 'Awaiting Sponsor',
        address: c.home_address || 'Not provided',
        firstGuardian: c.first_guardian ? {
          name: c.first_guardian.guardian_full_name || 'Not provided',
          phone: c.first_guardian.guardian_phone_number || 'Not provided',
          relation: c.first_guardian.guardian_relation || 'Not provided',
          identityCard: c.first_guardian.identity_card_blob_id ? `${API_BASE_URL.replace(/\/+$/, '')}/blobs/${c.first_guardian.identity_card_blob_id}` : undefined,
        } : null,
        secondGuardian: c.second_guardian ? {
          name: c.second_guardian.guardian_full_name || 'Not provided',
          phone: c.second_guardian.guardian_phone_number || 'Not provided',
          relation: c.second_guardian.guardian_relation || 'Not provided',
          identityCard: c.second_guardian.identity_card_blob_id ? `${API_BASE_URL.replace(/\/+$/, '')}/blobs/${c.second_guardian.identity_card_blob_id}` : undefined,
        } : null,
        story: c.story || 'No story provided',
        needs: {
          books: c.books_needs || false,
          healthInsurance: c.health_insurance_need || false,
          meals: c.meal_need || false,
          specialNeeds: c.special_need_proposals || 'None',
          gifts: c.gifts || false,
        },
        benefits: [],
        walletAddress: undefined,
        monthlyAmount: 0,
        sponsors: 0,
        raw: c,
      };
      // nothing additional
      setBeneficiary(mapped);
    } catch (e) {
      console.warn('loadChild failed', e);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Help sponsor ${beneficiary.name} - ${beneficiary.campaign}`,
        title: 'AgroTrust Sponsorship',
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleMore = () => {
    Alert.alert('More Options', 'Additional options coming soon');
  };

  const handleCampaignPress = () => {
    Alert.alert('Campaign', 'Navigate to School Lunch Program details');
  };

  const handleSponsor = () => {
    navigation.navigate("SponsorshipScreen", { childId: beneficiary.id });
    // Alert.alert(
    //   'Sponsor Child',
    //   `Would you like to sponsor ${beneficiary.name} for ${beneficiary.monthlyAmount} SUI/month?`,
    //   [
    //     { text: 'Cancel', style: 'cancel' },
    //     { 
    //       text: 'Sponsor Now', 
    //       onPress: () => Alert.alert('Success!', 'Sponsorship process initiated') 
    //     },
    //   ]
    // );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!beneficiary) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>No child data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{beneficiary.name}</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleMore}>
          <Ionicons name="ellipsis-horizontal" size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image Section */}
        <View style={styles.heroContainer}>
          <Image 
            source={{ uri: beneficiary.image }} 
            style={styles.heroImage}
          />
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          {/* Region Card */}
          <View style={styles.card}>
            <View style={styles.regionCardContent}>
              <View style={styles.regionIconContainer}>
                <Ionicons name="location" size={20} color="#1E40AF" />
              </View>
              <View style={styles.regionInfo}>
                <Text style={styles.regionLabel}>Region</Text>
                <Text style={styles.regionTitle}>{beneficiary.campaign}</Text>
              </View>
            </View>
          </View>

          {/* Story Section */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Story & Needs</Text>
            
            {/* Story */}
            {beneficiary.story && (
              <View style={styles.storySection}>
                <Text style={styles.storyLabel}>Story</Text>
                <Text style={styles.storyText}>{beneficiary.story}</Text>
              </View>
            )}

            {/* Guardians Information */}
            {(beneficiary.firstGuardian || beneficiary.secondGuardian) && (
              <View>
                <Text style={[styles.sectionTitle, { fontSize: 14, marginBottom: 12, marginTop: 16 }]}>Guardians</Text>
                
                {beneficiary.firstGuardian && (
                  <View style={styles.guardianCard}>
                    <View style={styles.guardianHeader}>
                      <View style={styles.guardianIconContainer}>
                        <Ionicons name="people" size={20} color="#1E40AF" />
                      </View>
                      <View style={styles.guardianHeaderContent}>
                        <Text style={styles.guardianRelation}>{beneficiary.firstGuardian.relation}</Text>
                        <Text style={styles.guardianName}>{beneficiary.firstGuardian.name}</Text>
                      </View>
                    </View>
                    <View style={styles.guardianDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons name="call" size={16} color="#6B7280" style={styles.detailIcon} />
                        <Text style={styles.detailValue}>{beneficiary.firstGuardian.phone}</Text>
                      </View>
                    </View>
                  </View>
                )}
                
                {beneficiary.secondGuardian && (
                  <View style={styles.guardianCard}>
                    <View style={styles.guardianHeader}>
                      <View style={styles.guardianIconContainer}>
                        <Ionicons name="people" size={20} color="#1E40AF" />
                      </View>
                      <View style={styles.guardianHeaderContent}>
                        <Text style={styles.guardianRelation}>{beneficiary.secondGuardian.relation}</Text>
                        <Text style={styles.guardianName}>{beneficiary.secondGuardian.name}</Text>
                      </View>
                    </View>
                    <View style={styles.guardianDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons name="call" size={16} color="#6B7280" style={styles.detailIcon} />
                        <Text style={styles.detailValue}>{beneficiary.secondGuardian.phone}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Address Information */}
            {beneficiary.address && (
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="location" size={18} color="#1E40AF" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Address</Text>
                    <Text style={styles.infoValue}>{beneficiary.address}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Needs Section */}
            {beneficiary.needs && (
              <View>
                <Text style={[styles.sectionTitle, { fontSize: 14, marginBottom: 12, marginTop: 16 }]}>Needs</Text>
                <View style={styles.needsGrid}>
                  {beneficiary.needs.meals && (
                    <View style={styles.needCard}>
                      <View style={styles.needIconContainer}>
                        <Ionicons name="restaurant" size={20} color="#1E40AF" />
                      </View>
                      <Text style={styles.needText}>Meals</Text>
                    </View>
                  )}
                  {beneficiary.needs.books && (
                    <View style={styles.needCard}>
                      <View style={styles.needIconContainer}>
                        <Ionicons name="book" size={20} color="#1E40AF" />
                      </View>
                      <Text style={styles.needText}>Books</Text>
                    </View>
                  )}
                  {beneficiary.needs.healthInsurance && (
                    <View style={styles.needCard}>
                      <View style={styles.needIconContainer}>
                        <Ionicons name="bandage" size={20} color="#1E40AF" />
                      </View>
                      <Text style={styles.needText}>Health Insurance</Text>
                    </View>
                  )}
                  {beneficiary.needs.gifts && (
                    <View style={styles.needCard}>
                      <View style={styles.needIconContainer}>
                        <Ionicons name="gift" size={20} color="#1E40AF" />
                      </View>
                      <Text style={styles.needText}>Gifts</Text>
                    </View>
                  )}
                </View>
                {beneficiary.needs.specialNeeds && beneficiary.needs.specialNeeds !== 'None' && (
                  <View style={styles.specialNeedsCard}>
                    <Text style={styles.specialNeedsTitle}>Special Needs</Text>
                    <Text style={styles.specialNeedsText}>{beneficiary.needs.specialNeeds}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Transparency Section */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Transparency</Text>
            <View style={styles.blockchainCard}>
              <View style={styles.blockchainIcon}>
                <Ionicons name="shield-checkmark" size={80} color="rgba(30, 64, 175, 0.1)" />
              </View>
              
              <View style={styles.blockchainContent}>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="shield-checkmark" size={16} color="#1E40AF" />
                  <Text style={styles.verifiedText}>BLOCKCHAIN VERIFIED</Text>
                </View>
                
                <Text style={styles.blockchainDescription}>
                  Your contribution is secured and tracked on the Sui blockchain for full transparency.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.sponsorButton}
          onPress={handleSponsor}
          activeOpacity={0.85}
        >
          <Text style={styles.sponsorButtonText}>Sponsor This Child</Text>
          <Ionicons name="heart" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.securedRow}>
          <Ionicons name="lock-closed" size={12} color="#9CA3AF" />
          <Text style={styles.securedText}>Secured by Sui Network Protocol</Text>
        </View>
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
    paddingVertical: 16,
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.5)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  heroContainer: {
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  regionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  regionIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  regionInfo: {
    flex: 1,
  },
  regionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E40AF',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  regionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 2,
  },
  storySection: {
    marginTop: 12,
  },
  storyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  storyText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 14,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
    lineHeight: 20,
  },
  guardianCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  guardianHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  guardianIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guardianHeaderContent: {
    flex: 1,
  },
  guardianRelation: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E40AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  guardianName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  guardianDetails: {
    paddingLeft: 52,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIcon: {
    marginTop: 2,
  },
  detailValue: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  needsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  needCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  needIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  needText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  specialNeedsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    padding: 14,
    marginTop: 12,
  },
  specialNeedsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  specialNeedsText: {
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 20,
  },
  blockchainCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    marginTop: 12,
  },
  blockchainIcon: {
    position: 'absolute',
    right: -16,
    top: -16,
    transform: [{ rotate: '12deg' }],
  },
  blockchainContent: {
    position: 'relative',
    zIndex: 10,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E40AF',
    letterSpacing: 0.5,
  },
  blockchainDescription: {
    fontSize: 12,
    color: '#D1D5DB',
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sponsorButton: {
    backgroundColor: '#1E40AF',
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sponsorButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  securedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  securedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});

export default ChildDetailScreen;