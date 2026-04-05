// src/screens/sponsorship/SponsorshipScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Switch,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

type SupportType = "books" | "meals" | null;

const SponsorshipScreen = () => {
  const route = useRoute<any>();
  const { childId } = route.params;
  const navigation = useNavigation();
  const [selectedSupport, setSelectedSupport] = useState<SupportType>("books");
  const [customAmount, setCustomAmount] = useState("");
  const [recurringEnabled, setRecurringEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthorize = async () => {
    if (!selectedSupport && !customAmount) {
      Alert.alert(
        "Error",
        "Please select a support type or enter a custom amount",
      );
      return;
    }

    try {
      setIsLoading(true);
      // Authorization logic here
      Alert.alert("Success", "Sponsorship authorized on Sui Network!");
    } catch (err: any) {
      Alert.alert("Authorization Failed", err.message || "Please try again");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleInfo = () => {
    Alert.alert(
      "About Sponsorship",
      "Your contribution is secured and tracked on the Sui blockchain for full transparency.",
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sponsorship</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleInfo}>
          <Ionicons
            name="information-circle-outline"
            size={22}
            color="#111827"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDTzF5Wt-ndY869yChzOBXLD08PLx2eOK--3rKxQjTxIaXpdP6sTDZzgjHxXPhoMIu6mj09uXvxnlABg49i23It_titqCNvwfSt8Gb1OrL8qqKqS1zLuKBs6o1lOAGDioKbeP51foSzZwFo75eBvVq0fqwb1gQaCVoZvLpG86jWKwRF99YHa7bm3jLky6pst_eUJYEEfwiVg7JQ8r5jCkVRd6kVrQHid7Rhai1JdHDx6ydOEjDqVVOty3OZjJb7-EBUaqjk1Cc5LAZj",
              }}
              style={styles.avatar}
            />
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.sponsoringLabel}>Sponsoring</Text>
          <Text style={styles.beneficiaryName}>Amina Cherono</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color="#6B7280" />
            <Text style={styles.locationText}>Bungoma County, Kenya</Text>
          </View>
        </View>

        {/* Support Type Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Select Support Type</Text>

          {/* School Books Option */}
          <TouchableOpacity
            style={[
              styles.supportOption,
              selectedSupport === "books" && styles.supportOptionSelected,
            ]}
            onPress={() => setSelectedSupport("books")}
            activeOpacity={0.8}
          >
            <View style={styles.supportOptionLeft}>
              <View
                style={[
                  styles.supportIconContainer,
                  selectedSupport === "books" &&
                    styles.supportIconContainerSelected,
                ]}
              >
                <Ionicons
                  name="book-outline"
                  size={22}
                  color={selectedSupport === "books" ? "#FFFFFF" : "#1E40AF"}
                />
              </View>
              <View>
                <Text style={styles.supportOptionTitle}>
                  School Books Support
                </Text>
                <Text style={styles.supportOptionSubtitle}>
                  Regional Educational Pool
                </Text>
              </View>
            </View>
            <View style={styles.supportOptionRight}>
              <Text style={styles.supportOptionPrice}>$35.00</Text>
              <Text style={styles.supportOptionFrequency}>Per Semester</Text>
            </View>
          </TouchableOpacity>

          {/* Monthly Meals Option */}
          <TouchableOpacity
            style={[
              styles.supportOption,
              selectedSupport === "meals" && styles.supportOptionSelected,
            ]}
            onPress={() => setSelectedSupport("meals")}
            activeOpacity={0.8}
          >
            <View style={styles.supportOptionLeft}>
              <View
                style={[
                  styles.supportIconContainer,
                  selectedSupport === "meals" &&
                    styles.supportIconContainerSelected,
                ]}
              >
                <Ionicons
                  name="restaurant-outline"
                  size={22}
                  color={selectedSupport === "meals" ? "#FFFFFF" : "#1E40AF"}
                />
              </View>
              <View>
                <Text style={styles.supportOptionTitle}>Monthly Meals</Text>
                <Text style={styles.supportOptionSubtitle}>
                  General Nutrition Pool
                </Text>
              </View>
            </View>
            <View style={styles.supportOptionRight}>
              <Text style={styles.supportOptionPrice}>$100.00</Text>
              <Text style={styles.supportOptionFrequency}>For 3 Months</Text>
            </View>
          </TouchableOpacity>

          {/* Urgent Medical Fund */}
          <View style={styles.urgentContainer}>
            <View style={styles.urgentHeader}>
              <View style={styles.urgentIconContainer}>
                <Ionicons name="medkit-outline" size={20} color="#EA580C" />
              </View>
              <View>
                <Text style={styles.urgentTitle}>Urgent Medical Fund</Text>
                <Text style={styles.urgentSubtitle}>Critical Assistance</Text>
              </View>
            </View>
            <View style={styles.customAmountWrapper}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.customAmountInput}
                placeholder="Enter custom amount"
                placeholderTextColor="#9CA3AF"
                value={customAmount}
                onChangeText={setCustomAmount}
                keyboardType="numeric"
              />
              <Text style={styles.flexibleLabel}>Flexible Donate</Text>
            </View>
          </View>
        </View>

        {/* Fund Breakdown Section */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Fund Breakdown</Text>
            <View style={styles.transparentBadge}>
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color="#1E40AF"
              />
              <Text style={styles.transparentBadgeText}>100% Transparent</Text>
            </View>
          </View>

          <View style={styles.breakdownGrid}>
            {/* Education */}
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownIconContainer}>
                <Ionicons name="school-outline" size={20} color="#1E40AF" />
              </View>
              <Text style={styles.breakdownLabel}>Education</Text>
              <Text style={[styles.breakdownPercent, { color: "#1E40AF" }]}>
                80%
              </Text>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: "80%", backgroundColor: "#1E40AF" },
                  ]}
                />
              </View>
            </View>

            {/* Health & Nutrition */}
            <View style={styles.breakdownCard}>
              <View
                style={[
                  styles.breakdownIconContainer,
                  { backgroundColor: "#FFF7ED" },
                ]}
              >
                <Ionicons name="heart-outline" size={20} color="#F97316" />
              </View>
              <Text style={styles.breakdownLabel}>Health & Nutrition</Text>
              <Text style={[styles.breakdownPercent, { color: "#F97316" }]}>
                20%
              </Text>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: "20%", backgroundColor: "#F97316" },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Impact Forecast */}
          <View style={styles.impactContainer}>
            <View style={styles.impactIconContainer}>
              <Ionicons name="analytics-outline" size={20} color="#1E40AF" />
            </View>
            <View style={styles.impactTextContainer}>
              <Text style={styles.impactTitle}>Impact Forecast</Text>
              <Text style={styles.impactDescription}>
                Your selected contribution will be pooled to provide essential
                resources for Amina and other students in the Bungoma region.
              </Text>
            </View>
          </View>
        </View>

        {/* Recurring Support Toggle */}
        <View style={styles.card}>
          <View style={styles.recurringRow}>
            <View style={styles.recurringLeft}>
              <View style={styles.recurringIconContainer}>
                <Ionicons name="calendar-outline" size={20} color="#1E40AF" />
              </View>
              <View>
                <Text style={styles.recurringTitle}>Recurring Support</Text>
                <Text style={styles.recurringSubtitle}>
                  Enable monthly sponsorship
                </Text>
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

        {/* Bottom spacer for fixed footer */}
        <View style={styles.footerSpacer} />
      </ScrollView>

      {/* Fixed Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.authorizeButton, isLoading && styles.buttonDisabled]}
          onPress={handleAuthorize}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          <Text style={styles.authorizeButtonText}>
            {isLoading ? "Authorizing..." : "Authorize on Sui"}
          </Text>
          <Ionicons name="flash" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.securedRow}>
          <Ionicons name="lock-closed" size={12} color="#9CA3AF" />
          <Text style={styles.securedText}>
            Secured by Sui Network Protocol
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "rgba(248, 250, 252, 0.85)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 232, 240, 0.5)",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  // Scroll
  scrollContent: {
    padding: 16,
    paddingBottom: 0,
  },

  // Profile
  profileSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  avatarWrapper: {
    position: "relative",
    width: 96,
    height: 96,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: "#1E40AF",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#1E40AF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  sponsoringLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1E40AF",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 12,
  },
  beneficiaryName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginTop: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 13,
    color: "#6B7280",
  },

  // Card wrapper
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  // Support Options
  supportOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
  },
  supportOptionSelected: {
    borderColor: "#1E40AF",
    borderWidth: 2,
  },
  supportOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  supportIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  supportIconContainerSelected: {
    backgroundColor: "#1E40AF",
  },
  supportOptionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  supportOptionSubtitle: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  supportOptionRight: {
    alignItems: "flex-end",
  },
  supportOptionPrice: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E40AF",
  },
  supportOptionFrequency: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Urgent / Custom Amount
  urgentContainer: {
    backgroundColor: "rgba(255, 247, 237, 0.5)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FED7AA",
    padding: 14,
    marginTop: 4,
  },
  urgentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  urgentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center",
  },
  urgentTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  urgentSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    color: "#EA580C",
    marginTop: 2,
  },
  customAmountWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FED7AA",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: "700",
    color: "#9CA3AF",
    marginRight: 6,
  },
  customAmountInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    paddingVertical: 0,
  },
  flexibleLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#EA580C",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: 8,
  },

  // Fund Breakdown
  transparentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  transparentBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1E40AF",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  breakdownGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  breakdownCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  breakdownIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  breakdownLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
  },
  breakdownPercent: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
  },
  progressBarTrack: {
    width: "100%",
    height: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 3,
    marginTop: 8,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },

  // Impact Forecast
  impactContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    padding: 14,
  },
  impactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  impactTextContainer: {
    flex: 1,
  },
  impactTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  impactDescription: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 18,
    marginTop: 4,
  },

  // Recurring
  recurringRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recurringLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  recurringIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  recurringTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  recurringSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  // Footer
  footerSpacer: {
    height: 120,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  authorizeButton: {
    backgroundColor: "#1E40AF",
    height: 60,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#1E40AF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  authorizeButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  securedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  securedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
});

export default SponsorshipScreen;
