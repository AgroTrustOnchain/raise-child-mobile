import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  ActivityIndicator,
} from "react-native";
import { useModal } from '../../context/ModalContext';
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  ChildDetail,
  SupportType,
  getChildById,
  submitSponsorship,
  getBookNeedDetails,
  getMealNeedDetails,
  getHealthInsuranceNeedDetails,
} from "../../services/sponsorship.service";
import { formatVND } from "../../utils/currency";
import WalrusImage from "../../components/WalrusImage";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const calcAge = (dob: string): number => {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

// ─── Component ────────────────────────────────────────────────────────────────

const SponsorshipScreen = () => {
  const route = useRoute<any>();
  const { childId } = route.params;
  const navigation = useNavigation();
  const modal = useModal();

  const [child, setChild] = useState<ChildDetail | null>(null);
  const [loadingChild, setLoadingChild] = useState(true);
  const [childError, setChildError] = useState<string | null>(null);

  const [bookValue, setBookValue] = useState<number>(350000); // VND
  const [mealValue, setMealValue] = useState<number>(100000); // VND per month
  const [healthValue, setHealthValue] = useState<number>(0); // VND

  const [selectedSupport, setSelectedSupport] = useState<SupportType>("books");
  const [mealMonths, setMealMonths] = useState("3");
  const [recurringEnabled, setRecurringEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Fetch child on mount ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchChild = async () => {
      try {
        setLoadingChild(true);
        setChildError(null);
        const data = await getChildById(childId);
        setChild(data);

        // Fetch sponsorship amounts for each support type
        if (data.books_needs.length > 0) {
          try {
            const bookNeed = await getBookNeedDetails(data.books_needs[0]);
            setBookValue(bookNeed.value);
          } catch (err) {
            console.log('Using default book value');
          }
        }

        if (data.meal_need) {
          try {
            const mealNeed = await getMealNeedDetails(data.meal_need);
            setMealValue(mealNeed.value);
          } catch (err) {
            console.log('Using default meal value');
          }
        }

        if (data.health_insurance_need) {
          try {
            const healthNeed = await getHealthInsuranceNeedDetails(data.health_insurance_need);
            setHealthValue(healthNeed.value);
          } catch (err) {
            console.log('Using default health value');
          }
        }
      } catch (err: any) {
        setChildError(err.message || 'Failed to load child details');
      } finally {
        setLoadingChild(false);
      }
    };
    fetchChild();
  }, [childId]);

  // ── Authorize handler ──────────────────────────────────────────────────────
  const handleAuthorize = async () => {
    if (!selectedSupport) {
      modal.warning("Lỗi", "Please select a support type");
      return;
    }
    if (!child) {
      modal.warning("Lỗi", "Child data not loaded yet");
      return;
    }

    const months = parseInt(mealMonths, 10);
    if (selectedSupport === 'meals' && (!months || months < 1)) {
      modal.warning("Lỗi", "Please enter a valid number of months");
      return;
    }

    try {
      setIsSubmitting(true);

      if (selectedSupport === 'books') {
        await submitSponsorship({ type: 'books', childId: child.books_needs[0] });
      } else if (selectedSupport === 'meals') {
        await submitSponsorship({ type: 'meals', childId: child.meal_need, months });
      } else if (selectedSupport === 'health') {
        await submitSponsorship({ type: 'health', childId: child.health_insurance_need });
      }

      modal.success(
        "Bảo trợ thành công!",
        `Your support for ${child.first_name} ${child.last_name} has been authorized on Sui Network.`,
        () => navigation.goBack(),
      );
    } catch (err: any) {
      modal.error("Xác nhận thất bại", err.message || "Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInfo = () => {
    modal.alert(
      "About Sponsorship",
      "Your contribution is secured and tracked on the Sui blockchain for full transparency.",
    );
  };

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loadingChild) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E40AF" />
        <Text style={styles.loadingText}>Loading child details…</Text>
      </View>
    );
  }

  if (childError || !child) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={52} color="#DC2626" />
        <Text style={styles.errorText}>{childError || 'Something went wrong'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.retryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fullName = `${child.first_name} ${child.last_name}`;
  const age = calcAge(child.date_of_birth);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sponsorship</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleInfo}>
          <Ionicons name="information-circle-outline" size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Profile Section ────────────────────────────────────────────── */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <WalrusImage blobId={child.avatar_blob_id} style={styles.avatar} resizeMode="cover" fallbackIconSize={32} />
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.sponsoringLabel}>Sponsoring</Text>
          <Text style={styles.beneficiaryName}>{fullName}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color="#6B7280" />
            <Text style={styles.locationText}>{child.region} · {age} years old</Text>
          </View>
          <View style={styles.chipsRow}>
            {child.books_needs.length > 0 && (
              <View style={styles.chip}>
                <Ionicons name="book-outline" size={11} color="#1E40AF" />
                <Text style={styles.chipText}>
                  {child.books_needs.length} book need{child.books_needs.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}
            {!!child.meal_need && (
              <View style={styles.chip}>
                <Ionicons name="restaurant-outline" size={11} color="#1E40AF" />
                <Text style={styles.chipText}>Meal need</Text>
              </View>
            )}
            {!!child.health_insurance_need && (
              <View style={[styles.chip, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="medkit-outline" size={11} color="#EA580C" />
                <Text style={[styles.chipText, { color: '#EA580C' }]}>Health insurance</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Support Type Section ───────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Select Support Type</Text>

          {/* Books */}
          {child.books_needs.length > 0 && (
            <TouchableOpacity
              style={[
                styles.supportOption,
                selectedSupport === "books" && styles.supportOptionSelected,
              ]}
              onPress={() => setSelectedSupport("books")}
              activeOpacity={0.8}
            >
              <View style={styles.supportOptionLeft}>
                <View style={[
                  styles.supportIconContainer,
                  selectedSupport === "books" && styles.supportIconContainerSelected,
                ]}>
                  <Ionicons
                    name="book-outline"
                    size={22}
                    color={selectedSupport === "books" ? "#FFFFFF" : "#1E40AF"}
                  />
                </View>
                <View style={styles.supportTextBlock}>
                  <Text style={styles.supportOptionTitle}>School Books Support</Text>
                  {/* <Text style={styles.supportOptionSubtitle} numberOfLines={1}>
                    {child.books_needs.slice(0, 2).join(', ')}
                    {child.books_needs.length > 2 ? ` +${child.books_needs.length - 2} more` : ''}
                  </Text> */}
                </View>
              </View>
              <View style={styles.supportOptionRight}>
                <Text style={styles.supportOptionPrice}>{formatVND(bookValue)}</Text>
                <Text style={styles.supportOptionFrequency}>Per Semester</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Meals */}
          {!!child.meal_need && (
            <TouchableOpacity
              style={[
                styles.supportOption,
                selectedSupport === "meals" && styles.supportOptionSelected,
              ]}
              onPress={() => setSelectedSupport("meals")}
              activeOpacity={0.8}
            >
              <View style={styles.supportOptionLeft}>
                <View style={[
                  styles.supportIconContainer,
                  selectedSupport === "meals" && styles.supportIconContainerSelected,
                ]}>
                  <Ionicons
                    name="restaurant-outline"
                    size={22}
                    color={selectedSupport === "meals" ? "#FFFFFF" : "#1E40AF"}
                  />
                </View>
                <View style={styles.supportTextBlock}>
                  <Text style={styles.supportOptionTitle}>Monthly Meals</Text>
                  {/* <Text style={styles.supportOptionSubtitle}>{child.meal_need}</Text> */}
                </View>
              </View>
              <View style={styles.supportOptionRight}>
                <Text style={styles.supportOptionPrice}>{formatVND(mealValue * parseInt(mealMonths || '1'))}</Text>
                <Text style={styles.supportOptionFrequency}>{formatVND(mealValue)}/month</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Months input — shown only when meals selected */}
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

          {/* Health Insurance */}
          {!!child.health_insurance_need && (
            <TouchableOpacity
              style={[
                styles.supportOption,
                styles.urgentOption,
                selectedSupport === "health" && styles.urgentOptionSelected,
              ]}
              onPress={() => setSelectedSupport("health")}
              activeOpacity={0.8}
            >
              <View style={styles.supportOptionLeft}>
                <View style={[
                  styles.supportIconContainer,
                  { backgroundColor: selectedSupport === 'health' ? '#EA580C' : '#FFEDD5' },
                ]}>
                  <Ionicons
                    name="medkit-outline"
                    size={22}
                    color={selectedSupport === "health" ? "#FFFFFF" : "#EA580C"}
                  />
                </View>
                <View style={styles.supportTextBlock}>
                  <Text style={styles.supportOptionTitle}>Health Insurance</Text>
                  {/* <Text style={styles.supportOptionSubtitle}>{child.health_insurance_need}</Text> */}
                </View>
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

        {/* ── Fund Breakdown Section ─────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Fund Breakdown</Text>
            <View style={styles.transparentBadge}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#1E40AF" />
              <Text style={styles.transparentBadgeText}>100% Transparent</Text>
            </View>
          </View>
          <View style={styles.breakdownGrid}>
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownIconContainer}>
                <Ionicons name="school-outline" size={20} color="#1E40AF" />
              </View>
              <Text style={styles.breakdownLabel}>Education</Text>
              <Text style={[styles.breakdownPercent, { color: "#1E40AF" }]}>80%</Text>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: "80%", backgroundColor: "#1E40AF" }]} />
              </View>
            </View>
            <View style={styles.breakdownCard}>
              <View style={[styles.breakdownIconContainer, { backgroundColor: "#FFF7ED" }]}>
                <Ionicons name="heart-outline" size={20} color="#F97316" />
              </View>
              <Text style={styles.breakdownLabel}>Health & Nutrition</Text>
              <Text style={[styles.breakdownPercent, { color: "#F97316" }]}>20%</Text>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: "20%", backgroundColor: "#F97316" }]} />
              </View>
            </View>
          </View>
          <View style={styles.impactContainer}>
            <View style={styles.impactIconContainer}>
              <Ionicons name="analytics-outline" size={20} color="#1E40AF" />
            </View>
            <View style={styles.impactTextContainer}>
              <Text style={styles.impactTitle}>Impact Forecast</Text>
              <Text style={styles.impactDescription}>
                Your selected contribution will be pooled to provide essential
                resources for {child.first_name} and other children in the {child.region} region.
              </Text>
            </View>
          </View>
        </View>

        {/* ── Recurring Support Toggle ───────────────────────────────────── */}
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
              trackColor={{ false: "#E5E7EB", true: "#1E40AF" }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E5E7EB"
            />
          </View>
        </View>

        <View style={styles.footerSpacer} />
      </ScrollView>

      {/* ── Fixed Footer ──────────────────────────────────────────────────── */}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },
  loadingText: { fontSize: 15, color: '#64748b', fontWeight: '500' },
  errorText: { fontSize: 15, color: '#DC2626', fontWeight: '600', textAlign: 'center' },
  retryBtn: {
    backgroundColor: '#1E40AF', paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: 10, marginTop: 4,
  },
  retryBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 16,
    backgroundColor: "rgba(248, 250, 252, 0.85)",
    borderBottomWidth: 1, borderBottomColor: "rgba(226, 232, 240, 0.5)",
  },
  headerButton: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  scrollContent: { padding: 16, paddingBottom: 0 },
  profileSection: { alignItems: "center", paddingVertical: 24 },
  avatarWrapper: { position: "relative", width: 96, height: 96 },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 4, borderColor: "#1E40AF" },
  verifiedBadge: {
    position: "absolute", bottom: -2, right: -2, width: 24, height: 24,
    borderRadius: 12, backgroundColor: "#1E40AF",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  sponsoringLabel: {
    fontSize: 10, fontWeight: "700", color: "#1E40AF",
    letterSpacing: 2, textTransform: "uppercase", marginTop: 12,
  },
  beneficiaryName: { fontSize: 24, fontWeight: "800", color: "#111827", marginTop: 4 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  locationText: { fontSize: 13, color: "#6B7280" },
  chipsRow: {
    flexDirection: 'row', gap: 8, marginTop: 10,
    flexWrap: 'wrap', justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#EFF6FF', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 20,
  },
  chipText: { fontSize: 11, fontWeight: '600', color: '#1E40AF' },
  card: {
    backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 12 },
  sectionTitleRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 12,
  },
  supportOption: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 14, borderRadius: 14, borderWidth: 1,
    borderColor: "#E5E7EB", marginBottom: 10, backgroundColor: "#FFFFFF",
  },
  urgentOption: { borderColor: '#FED7AA', backgroundColor: 'rgba(255,247,237,0.5)' },
  supportOptionSelected: { borderColor: "#1E40AF", borderWidth: 2 },
  urgentOptionSelected: { borderColor: "#EA580C", borderWidth: 2 },
  supportOptionLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  supportTextBlock: { flex: 1 },
  supportIconContainer: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center",
  },
  supportIconContainerSelected: { backgroundColor: "#1E40AF" },
  supportOptionTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  supportOptionSubtitle: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  supportOptionRight: { alignItems: "flex-end" },
  supportOptionPrice: { fontSize: 20, fontWeight: "800", color: "#1E40AF" },
  supportOptionFrequency: {
    fontSize: 10, fontWeight: "700", color: "#9CA3AF",
    textTransform: "uppercase", letterSpacing: 0.5,
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
  transparentBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  transparentBadgeText: {
    fontSize: 10, fontWeight: "700", color: "#1E40AF",
    textTransform: "uppercase", letterSpacing: 1,
  },
  breakdownGrid: { flexDirection: "row", gap: 12, marginBottom: 12 },
  breakdownCard: {
    flex: 1, backgroundColor: "#FFFFFF", borderRadius: 14,
    borderWidth: 1, borderColor: "#F1F5F9", padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  breakdownIconContainer: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#EFF6FF",
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  breakdownLabel: { fontSize: 11, fontWeight: "500", color: "#6B7280" },
  breakdownPercent: { fontSize: 24, fontWeight: "800", marginTop: 4 },
  progressBarTrack: {
    width: "100%", height: 6, backgroundColor: "#F1F5F9",
    borderRadius: 3, marginTop: 8, overflow: "hidden",
  },
  progressBarFill: { height: 6, borderRadius: 3 },
  impactContainer: {
    flexDirection: "row", alignItems: "flex-start", gap: 14,
    backgroundColor: "#FFFFFF", borderRadius: 14,
    borderWidth: 1, borderColor: "#DBEAFE", padding: 14,
  },
  impactIconContainer: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#EFF6FF",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  impactTextContainer: { flex: 1 },
  impactTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  impactDescription: { fontSize: 12, color: "#4B5563", lineHeight: 18, marginTop: 4 },
  recurringRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  recurringLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  recurringIconContainer: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center",
  },
  recurringTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  recurringSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  footerSpacer: { height: 120 },
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: "#E5E7EB",
  },
  authorizeButton: {
    backgroundColor: "#1E40AF", height: 60, borderRadius: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    shadowColor: "#1E40AF", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  authorizeButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  securedRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6, marginTop: 12,
  },
  securedText: {
    fontSize: 10, fontWeight: "700", color: "#9CA3AF",
    textTransform: "uppercase", letterSpacing: 1.5,
  },
});

export default SponsorshipScreen;