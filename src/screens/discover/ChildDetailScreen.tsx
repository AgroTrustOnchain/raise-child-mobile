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
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getChildById } from '../../services/child.service';
import { API_BASE_URL } from '../../services/api.service';
import {
  SupportType,
  submitSponsorship,
  getBookNeedDetails,
  getMealNeedDetails,
  getHealthInsuranceNeedDetails,
} from '../../services/sponsorship.service';

const { width } = Dimensions.get('window');

const formatVND = (value: number): string =>
  `${Math.round(value).toLocaleString('vi-VN')} ₫`;

const ChildDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();

  const [beneficiary, setBeneficiary] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const [bookValue, setBookValue] = useState(350000);
  const [mealValue, setMealValue] = useState(100000);
  const [healthValue, setHealthValue] = useState(0);
  const [selectedSupport, setSelectedSupport] = useState<SupportType>('books');
  const [mealMonths, setMealMonths] = useState('3');
  const [recurringEnabled, setRecurringEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = route.params as { childId?: string } | undefined;
    const id = params?.childId as string | undefined;
    if (id) loadChild(id);
  }, [route.params]);

  const loadChild = async (id: string) => {
    try {
      setLoading(true);
      const c = await getChildById(id);
      // console.log(c)
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
        raw: c,
      };
      setBeneficiary(mapped);

      // Default selected support to first available need
      if (c.books_needs?.length > 0) setSelectedSupport('books');
      else if (c.meal_need) setSelectedSupport('meals');
      else if (c.health_insurance_need) setSelectedSupport('health');

      // Fetch need values in parallel
      const [bookRes, mealRes, healthRes] = await Promise.allSettled([
        c.books_needs?.length > 0 ? getBookNeedDetails(c.books_needs[0]) : Promise.reject(),
        c.meal_need ? getMealNeedDetails(c.meal_need) : Promise.reject(),
        c.health_insurance_need ? getHealthInsuranceNeedDetails(c.health_insurance_need) : Promise.reject(),
      ]);
      if (bookRes.status === 'fulfilled') setBookValue(bookRes.value.value);
      if (mealRes.status === 'fulfilled') setMealValue(mealRes.value.value);
      if (healthRes.status === 'fulfilled') setHealthValue(healthRes.value.value);
    } catch (e) {
      console.warn('loadChild failed', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async () => {
    if (!selectedSupport) {
      Alert.alert('Error', 'Please select a support type');
      return;
    }
    if (!beneficiary) return;
    const { raw } = beneficiary;
    const months = parseInt(mealMonths, 10);
    if (selectedSupport === 'meals' && (!months || months < 1)) {
      Alert.alert('Error', 'Please enter a valid number of months');
      return;
    }
    try {
      setIsSubmitting(true);
      let res;
      if (selectedSupport === 'books') {
        res = await submitSponsorship({ type: 'books', childId: raw.books_needs[0] });
      } else if (selectedSupport === 'meals') {
        res = await submitSponsorship({ type: 'meals', childId: raw.meal_need, months });
      } else if (selectedSupport === 'health') {
        res = await submitSponsorship({ type: 'health', childId: raw.health_insurance_need });
      }
      if (res?.url) {
        navigation.navigate('PaymentQrScreen', {
          paymentUrl: res.url,
          title: `Sponsor ${beneficiary.name}`,
        });
      } else {
        Alert.alert(
          'Sponsorship Submitted!',
          `Your support for ${beneficiary.name} has been authorized.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      }
    } catch (err: any) {
      Alert.alert('Authorization Failed', err.message || 'Please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProof = () => {
    navigation.navigate('ChildProofScreen', { childId: beneficiary.id, childName: beneficiary.name });
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

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1E40AF" />
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

  const { raw } = beneficiary;
  const hasBooks = raw.books_needs?.length > 0;
  const hasMeals = !!raw.meal_need;
  const hasHealth = !!raw.health_insurance_need;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{beneficiary.name}</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: beneficiary.image }} style={styles.heroImage} />
        </View>

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

          {/* Story & Needs Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Story & Needs</Text>

            {beneficiary.story && (
              <View style={styles.storySection}>
                <Text style={styles.storyLabel}>Story</Text>
                <Text style={styles.storyText}>{beneficiary.story}</Text>
              </View>
            )}

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
          </View>

          {/* Transparency Card */}
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

          {/* Impact Proof */}
          <TouchableOpacity style={styles.proofCard} onPress={handleProof} activeOpacity={0.8}>
            <View style={styles.proofCardLeft}>
              <View style={styles.proofIconContainer}>
                <Ionicons name="receipt-outline" size={22} color="#1E40AF" />
              </View>
              <View>
                <Text style={styles.proofCardTitle}>Impact Proof</Text>
                <Text style={styles.proofCardSubtitle}>View verified blockchain timeline</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#1E40AF" />
          </TouchableOpacity>

          {/* ── Support Type Selection ───────────────────────────────────────── */}
          {(hasBooks || hasMeals || hasHealth) && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Select Support Type</Text>

              {hasBooks && (
                <TouchableOpacity
                  style={[styles.supportOption, selectedSupport === 'books' && styles.supportOptionSelected]}
                  onPress={() => setSelectedSupport('books')}
                  activeOpacity={0.8}
                >
                  <View style={styles.supportOptionLeft}>
                    <View style={[styles.supportIconContainer, selectedSupport === 'books' && styles.supportIconContainerSelected]}>
                      <Ionicons name="book-outline" size={22} color={selectedSupport === 'books' ? '#FFFFFF' : '#1E40AF'} />
                    </View>
                    <Text style={styles.supportOptionTitle}>School Books Support</Text>
                  </View>
                  <View style={styles.supportOptionRight}>
                    <Text style={styles.supportOptionPrice}>{formatVND(bookValue)}</Text>
                    <Text style={styles.supportOptionFrequency}>Per Semester</Text>
                  </View>
                </TouchableOpacity>
              )}

              {hasMeals && (
                <>
                  <TouchableOpacity
                    style={[styles.supportOption, selectedSupport === 'meals' && styles.supportOptionSelected]}
                    onPress={() => setSelectedSupport('meals')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.supportOptionLeft}>
                      <View style={[styles.supportIconContainer, selectedSupport === 'meals' && styles.supportIconContainerSelected]}>
                        <Ionicons name="restaurant-outline" size={22} color={selectedSupport === 'meals' ? '#FFFFFF' : '#1E40AF'} />
                      </View>
                      <Text style={styles.supportOptionTitle}>Monthly Meals</Text>
                    </View>
                    <View style={styles.supportOptionRight}>
                      <Text style={styles.supportOptionPrice}>{formatVND(mealValue * parseInt(mealMonths || '1'))}</Text>
                      <Text style={styles.supportOptionFrequency}>{formatVND(mealValue)}/month</Text>
                    </View>
                  </TouchableOpacity>
                  {selectedSupport === 'meals' && (
                    <View style={styles.monthsInputContainer}>
                      <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                      <Text style={styles.monthsLabel}>Number of months</Text>
                      <TextInput
                        style={styles.monthsInput}
                        value={mealMonths}
                        onChangeText={setMealMonths}
                        keyboardType="numeric"
                        maxLength={2}
                        placeholder="3"
                        placeholderTextColor="#9CA3AF"
                      />
                      <Text style={styles.monthsUnit}>months</Text>
                    </View>
                  )}
                </>
              )}

              {hasHealth && (
                <TouchableOpacity
                  style={[
                    styles.supportOption,
                    styles.urgentOption,
                    selectedSupport === 'health' && styles.urgentOptionSelected,
                  ]}
                  onPress={() => setSelectedSupport('health')}
                  activeOpacity={0.8}
                >
                  <View style={styles.supportOptionLeft}>
                    <View style={[
                      styles.supportIconContainer,
                      { backgroundColor: selectedSupport === 'health' ? '#EA580C' : '#FFEDD5' },
                    ]}>
                      <Ionicons name="medkit-outline" size={22} color={selectedSupport === 'health' ? '#FFFFFF' : '#EA580C'} />
                    </View>
                    <Text style={styles.supportOptionTitle}>Health Insurance</Text>
                  </View>
                  <View style={styles.supportOptionRight}>
                    <Text style={[styles.supportOptionPrice, { color: '#EA580C' }]}>
                      {healthValue > 0 ? formatVND(healthValue) : 'Custom'}
                    </Text>
                    <Text style={styles.supportOptionFrequency}>{healthValue > 0 ? 'Required' : 'Amount'}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── Recurring Support Toggle ─────────────────────────────────────── */}
          {(hasBooks || hasMeals || hasHealth) && (
            <View style={styles.card}>
              <View style={styles.recurringRow}>
                <View style={styles.recurringLeft}>
                  <View style={styles.recurringIconContainer}>
                    <Ionicons name="calendar-outline" size={20} color="#1E40AF" />
                  </View>
                  <View>
                    <Text style={styles.recurringTitle}>Recurring Support</Text>
                    <Text style={styles.recurringSubtitle}>Enable monthly sponsorship</Text>
                  </View>
                </View>
                <Switch
                  value={recurringEnabled}
                  onValueChange={setRecurringEnabled}
                  trackColor={{ false: '#E5E7EB', true: '#1E40AF' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E5E7EB"
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.authorizeButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleAuthorize}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.authorizeButtonText}>Authorize on Sui</Text>
              <Ionicons name="flash" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
        <View style={styles.securedRow}>
          <Ionicons name="lock-closed" size={12} color="#9CA3AF" />
          <Text style={styles.securedText}>Secured by Sui Network Protocol</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
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
  headerButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  heroContainer: { height: 300 },
  heroImage: { width: '100%', height: '100%' },
  content: { padding: 16 },
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
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  regionCardContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  regionIconContainer: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  regionInfo: { flex: 1 },
  regionLabel: { fontSize: 10, fontWeight: '700', color: '#1E40AF', letterSpacing: 2, textTransform: 'uppercase' },
  regionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1F2937', marginTop: 2 },
  storySection: { marginTop: 12 },
  storyLabel: {
    fontSize: 12, fontWeight: '600', color: '#6B7280',
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  storyText: { fontSize: 14, color: '#4B5563', lineHeight: 22 },
  infoCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1,
    borderColor: '#F1F5F9', padding: 14, marginTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoIconContainer: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 13, fontWeight: '500', color: '#1F2937', lineHeight: 20 },
  guardianCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1,
    borderColor: '#F1F5F9', padding: 14, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  guardianHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  guardianIconContainer: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  guardianHeaderContent: { flex: 1 },
  guardianRelation: {
    fontSize: 11, fontWeight: '600', color: '#1E40AF',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2,
  },
  guardianName: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
  guardianDetails: { paddingLeft: 52, gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailIcon: { marginTop: 2 },
  detailValue: { fontSize: 13, color: '#4B5563', fontWeight: '500' },
  blockchainCard: {
    backgroundColor: '#1F2937', borderRadius: 16, padding: 20,
    position: 'relative', overflow: 'hidden', marginTop: 12,
  },
  blockchainIcon: { position: 'absolute', right: -16, top: -16, transform: [{ rotate: '12deg' }] },
  blockchainContent: { position: 'relative', zIndex: 10 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  verifiedText: { fontSize: 12, fontWeight: 'bold', color: '#1E40AF', letterSpacing: 0.5 },
  blockchainDescription: { fontSize: 12, color: '#D1D5DB', lineHeight: 18 },
  // Support options
  supportOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: 14, borderWidth: 1,
    borderColor: '#E5E7EB', marginBottom: 10, backgroundColor: '#FFFFFF',
  },
  urgentOption: { borderColor: '#FED7AA', backgroundColor: 'rgba(255,247,237,0.5)' },
  supportOptionSelected: { borderColor: '#1E40AF', borderWidth: 2 },
  urgentOptionSelected: { borderColor: '#EA580C', borderWidth: 2 },
  supportOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  supportIconContainer: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  supportIconContainerSelected: { backgroundColor: '#1E40AF' },
  supportOptionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1 },
  supportOptionRight: { alignItems: 'flex-end' },
  supportOptionPrice: { fontSize: 18, fontWeight: '800', color: '#1E40AF' },
  supportOptionFrequency: {
    fontSize: 10, fontWeight: '700', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  monthsInputContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F8FAFF', borderRadius: 12,
    borderWidth: 1, borderColor: '#DBEAFE',
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10,
  },
  monthsLabel: { fontSize: 13, fontWeight: '500', color: '#374151', flex: 1 },
  monthsInput: {
    width: 48, textAlign: 'center', fontSize: 16, fontWeight: '700',
    color: '#1E40AF', backgroundColor: '#EFF6FF', borderRadius: 8, paddingVertical: 4,
  },
  monthsUnit: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  recurringRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recurringLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recurringIconContainer: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  recurringTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  recurringSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  authorizeButton: {
    backgroundColor: '#1E40AF', height: 60, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#1E40AF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  authorizeButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  securedRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, marginTop: 12,
  },
  securedText: {
    fontSize: 10, fontWeight: '700', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 1.5,
  },
  proofCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: '#DBEAFE',
  },
  proofCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  proofIconContainer: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  proofCardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  proofCardSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});

export default ChildDetailScreen;
