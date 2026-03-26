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
  const navigation = useNavigation();
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
        story: JSON.stringify({
          home_address: c.home_address,
          books_needs: c.books_needs,
          health_insurance_need: c.health_insurance_need,
          meal_need: c.meal_need,
          special_need_proposals: c.special_need_proposals,
          gifts: c.gifts,
        }, null, 2),
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
    Alert.alert(
      'Sponsor Child',
      `Would you like to sponsor ${beneficiary.name} for ${beneficiary.monthlyAmount} SUI/month?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sponsor Now', 
          onPress: () => Alert.alert('Success!', 'Sponsorship process initiated') 
        },
      ]
    );
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
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image Section */}
        <View style={styles.heroContainer}>
          <Image 
            source={{ uri: beneficiary.image }} 
            style={styles.heroImage}
          />
          {/* <LinearGradient
            colors={['transparent', 'rgba(16, 34, 22, 0.8)']}
            style={styles.gradient}
          /> */}
          
          {/* Overlay Content */}
          <View style={styles.heroOverlay}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{beneficiary.status}</Text>
            </View>
            <Text style={styles.heroName}>{beneficiary.name}</Text>
            <View style={styles.heroMeta}>
              <View style={styles.metaItem}>
                <Ionicons size={18} color="#fff" />
                <Text style={styles.metaText}>{beneficiary.age} Years Old</Text>
              </View>
              <View style={styles.metaDot} />
              <View style={styles.metaItem}>
                <Ionicons name="school-outline" size={18} color="#fff" />
                <Text style={styles.metaText}>Grade {beneficiary.grade}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          {/* Campaign Card */}
          <TouchableOpacity 
            style={styles.campaignCard}
            onPress={handleCampaignPress}
            activeOpacity={0.7}
          >
            <View style={styles.campaignLeft}>
              <View style={styles.campaignIcon}>
                <Ionicons name="restaurant" size={20} color="#0ea640" />
              </View>
              <View style={styles.campaignInfo}>
                <Text style={styles.campaignLabel}>BENEFICIARY OF</Text>
                <Text style={styles.campaignTitle}>{beneficiary.campaign}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Story Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Story & Needs</Text>
            <Text style={styles.storyText}>{beneficiary.story}</Text>

            {/* Benefits Grid */}
            <View style={styles.benefitsGrid}>
              {beneficiary.benefits.map((benefit : any, index : number) => (
                <View key={index} style={styles.benefitCard}>
                  <Ionicons 
                    name={benefit.icon as any} 
                    size={24} 
                    color="#13ec5b" 
                    style={styles.benefitIcon}
                  />
                  <View style={styles.benefitText}>
                    <Text style={styles.benefitTitle}>{benefit.title}</Text>
                    <Text style={styles.benefitSubtitle}>{benefit.subtitle}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Transparency Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transparency</Text>
            <View style={styles.blockchainCard}>
              <View style={styles.blockchainIcon}>
                <Ionicons name="shield-checkmark" size={80} color="rgba(19, 236, 91, 0.1)" />
              </View>
              
              <View style={styles.blockchainContent}>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="shield-checkmark" size={16} color="#13ec5b" />
                  <Text style={styles.verifiedText}>BLOCKCHAIN VERIFIED</Text>
                </View>
                
                <Text style={styles.blockchainDescription}>
                  Your donation triggers a smart contract directly allocating funds to the school's verified wallet for Amani's meals.
                </Text>

                <View style={styles.walletBadge}>
                  <Ionicons name="link" size={12} color="#9CA3AF" />
                  <Text style={styles.walletAddress}>{beneficiary.walletAddress}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Header */}
      <View style={styles.floatingHeader}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleMore}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Sponsorship Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Monthly Sponsorship</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceAmount}>{beneficiary.monthlyAmount}</Text>
              <Text style={styles.priceCurrency}>SUI</Text>
            </View>
          </View>

          <View style={styles.sponsorsAvatars}>
            <Image 
              source={{ uri: 'https://i.pravatar.cc/150?img=10' }} 
              style={styles.sponsorAvatar}
            />
            <Image 
              source={{ uri: 'https://i.pravatar.cc/150?img=11' }} 
              style={[styles.sponsorAvatar, { marginLeft: -8 }]}
            />
            <View style={[styles.sponsorAvatar, styles.sponsorCount, { marginLeft: -8 }]}>
              <Text style={styles.sponsorCountText}>+{beneficiary.sponsors - 2}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.sponsorButton}
          onPress={handleSponsor}
          activeOpacity={0.9}
        >
          <Ionicons name="heart" size={20} color="#1F2937" />
          <Text style={styles.sponsorButtonText}>Sponsor This Child</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8f6',
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    height: 400,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#13ec5b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  content: {
    marginTop: -24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: '#f6f8f6',
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 180,
  },
  campaignCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 24,
  },
  campaignLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  campaignIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  campaignInfo: {
    flex: 1,
  },
  campaignLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  campaignTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  storyText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 16,
  },
  benefitsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  benefitCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  benefitIcon: {
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  benefitSubtitle: {
    fontSize: 10,
    color: '#6B7280',
  },
  blockchainCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
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
    color: '#13ec5b',
    letterSpacing: 0.5,
  },
  blockchainDescription: {
    fontSize: 12,
    color: '#D1D5DB',
    lineHeight: 18,
    marginBottom: 16,
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 8,
  },
  walletAddress: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#9CA3AF',
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(246, 248, 246, 0.8)',
    // backdropFilter: 'blur(10px)',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
  },
  bottomBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  priceSection: {
    gap: 4,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
  },
  priceCurrency: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0ea640',
  },
  sponsorsAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sponsorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
  },
  sponsorCount: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sponsorCountText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  sponsorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#13ec5b',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#13ec5b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  sponsorButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
});

export default ChildDetailScreen;