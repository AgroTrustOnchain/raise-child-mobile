// src/screens/discover/CampaignDetail.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getChildrenByCampaign, mapChildToBeneficiary } from '../../services/child.service';
import { getCenterDetail, CenterDetail } from '../../services/campaign.service';
import { API_BASE_URL } from '../../services/api.service';
// import { useNFT } from '../../hooks/useNFT';

interface Beneficiary {
  id: string;
  name: string;
  age: number;
  grade: number;
  image?: string;
  description: string;
  status: "available" | "sponsored";
}


// start with empty list; we'll load from API
// Beneficiary shape is defined above in this file

const CampaignDetail = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  //   const { selectedNFT, loadNFTById } = useNFT();
  const [sortBy, setSortBy] = useState<"name" | "age">("name");
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [centerDetail, setCenterDetail] = useState<CenterDetail | null>(null);
  const [loadingCenter, setLoadingCenter] = useState(false);
  const [region, setRegion] = useState<string | null>(null);

  useEffect(() => {
    const params = route.params as { nftId?: string; campaignId?: string; region?: string } | undefined;
    const id = params?.nftId || params?.campaignId || (params ? (params as any).id : undefined);
    const regionParam = params?.region as string | undefined;
    
    setRegion(regionParam || null);
    
    // If we have a campaignId, load center detail
    if (id) {
      loadCenterDetail(id);
    }
    
    // Load children either by campaignId or region
    if (id || regionParam) {
      loadChildren({ campaignId: id, region: regionParam });
    }
  }, [route.params]);

  const loadCenterDetail = async (centerId: string) => {
    try {
      setLoadingCenter(true);
      const detail = await getCenterDetail(centerId);
      setCenterDetail(detail);
    } catch (e) {
      console.warn('loadCenterDetail failed', e);
    } finally {
      setLoadingCenter(false);
    }
  };

  const loadChildren = async ({ campaignId, region }: { campaignId?: string; region?: string }) => {
    try {
      setLoadingChildren(true);
      const items = await getChildrenByCampaign({ campaignId, region });
      const mapped = (items?.length > 0 ? items : []).map((c: any) => mapChildToBeneficiary(c));
      setBeneficiaries(mapped as any);
    } catch (e) {
      console.warn('loadChildren failed', e);
    } finally {
      setLoadingChildren(false);
    }
  };

  const handleSponsor = (beneficiary: Beneficiary) => {
    if (beneficiary.status === "sponsored") {
      Alert.alert(
        "Already Sponsored",
        "This beneficiary is already sponsored.",
      );
      return;
    }
    Alert.alert(
      "Sponsor Beneficiary",
      `Would you like to sponsor ${beneficiary.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sponsor",
          onPress: () => Alert.alert("Success", "Sponsorship initiated!"),
        },
      ],
    );
  };

  const handleSort = () => {
    setSortBy((prev) => (prev === "name" ? "age" : "name"));
  };

  const sortedBeneficiaries = [...beneficiaries].sort((a, b) => {
    if (sortBy === "name") {
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
          {centerDetail?.region || region || "Loading..."}
        </Text>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons
            name="information-circle-outline"
            size={24}
            color="#1F2937"
          />
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {loadingCenter && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#13ec5b" />
        </View>
      )}

      {/* Campaign Info Card */}
      {centerDetail && (
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={16} color="#13ec5b" />
              <Text style={styles.verifiedText}>
                {centerDetail.status?.toUpperCase() || "VERIFIED"}
              </Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{centerDetail.region}</Text>
            </View>
          </View>

          {/* Center Image */}
          {centerDetail.image_blob_id && (
            <Image
              source={{ uri: `${API_BASE_URL}/blobs/${centerDetail.image_blob_id}` }}
              style={styles.centerImage}
            />
          )}

          {/* Center Details */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Ionicons name="location" size={20} color="#13ec5b" />
              <Text style={styles.detailText}>{centerDetail.address}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="call" size={20} color="#13ec5b" />
              <Text style={styles.detailText}>{centerDetail.phone_number}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="person" size={20} color="#13ec5b" />
              <Text style={styles.detailText}>{centerDetail.profile_id}</Text>
            </View>
          </View>

          <Text style={styles.poolLabel}>Center Status</Text>
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>
              Available to Confirm: {centerDetail.IsAvailableToConfirm ? "Yes" : "No"}
            </Text>
            <Text style={styles.statusLabel}>
              Confirmed Register: {centerDetail.is_confirm_register ? "Yes" : "No"}
            </Text>
          </View>
        </View>
      )}

      {/* Region Info Card - Show when viewing region without campaign */}
      {!centerDetail && region && (
        <View style={styles.regionInfoCard}>
          <View style={styles.regionCardHeader}>
            <Ionicons name="location" size={28} color="#2E7D32" />
            <View style={styles.regionTextWrapper}>
              <Text style={styles.regionTitle}>{region}</Text>
              <Text style={styles.regionSubtitle}>Children in this region</Text>
            </View>
          </View>
        </View>
      )}
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
    const isSponsored = item.status === "sponsored";
    const handleChildPress = (childId : any) => {
      navigation.navigate("ChildDetailScreen", { childId });
    };

    return (
      <TouchableOpacity
        onPress={() => handleChildPress(item.id)}
        style={[
          styles.beneficiaryCard,
          isSponsored && styles.beneficiaryCardSponsored,
        ]}
      >
        {/* Image */}
        <View style={styles.beneficiaryImageContainer}>
          {item.image ? (
            <>
              <Image
                source={{ uri: item.image }}
                style={[
                  styles.beneficiaryImage,
                  isSponsored && styles.imageSponsoredFilter,
                ]}
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
            <View
              style={[
                styles.statusBadge,
                isSponsored
                  ? styles.statusBadgeSponsored
                  : styles.statusBadgeAvailable,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  isSponsored
                    ? styles.statusTextSponsored
                    : styles.statusTextAvailable,
                ]}
              >
                {isSponsored ? "Sponsored" : "Available"}
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
            isSponsored && styles.sponsorButtonDisabled,
          ]}
          onPress={() => handleSponsor(item)}
          disabled={isSponsored}
        >
          <Ionicons
            name={isSponsored ? "lock-closed" : "heart"}
            size={20}
            color={isSponsored ? "#9CA3AF" : "#fff"}
          />
        </TouchableOpacity>
      </TouchableOpacity>
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
    backgroundColor: "#f6f8f6",
  },
  listContent: {
    paddingBottom: 24,
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(246, 248, 246, 0.9)",
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  navTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  infoCard: {
    margin: 16,
    marginTop: 8,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(19, 236, 91, 0.2)",
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#1F2937",
    letterSpacing: 0.5,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#16A34A",
  },
  poolLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "800",
    color: "#1F2937",
  },
  balanceCurrency: {
    fontSize: 18,
    fontWeight: "500",
    color: "#0ea640",
  },
  progressSection: {
    marginTop: 16,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#6B7280",
    letterSpacing: 1,
  },
  progressPercentage: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#6B7280",
    letterSpacing: 1,
  },
  progressBar: {
    height: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#13ec5b",
    borderRadius: 5,
  },
  beneficiariesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  beneficiariesTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sortText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#13ec5b",
    letterSpacing: 0.5,
  },
  regionInfoCard: {
    margin: 16,
    marginTop: 8,
    padding: 20,
    backgroundColor: "#F0F9FF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  regionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  regionTextWrapper: {
    flex: 1,
  },
  regionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  regionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  beneficiaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
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
    overflow: "hidden",
    position: "relative",
  },
  beneficiaryImage: {
    width: "100%",
    height: "100%",
  },
  imageSponsoredFilter: {
    opacity: 0.5,
  },
  sponsoredOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  beneficiaryInfo: {
    flex: 1,
    gap: 4,
  },
  beneficiaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  beneficiaryNameSection: {
    flex: 1,
  },
  beneficiaryName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
  },
  beneficiaryMeta: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeAvailable: {
    backgroundColor: "rgba(19, 236, 91, 0.1)",
    borderColor: "rgba(19, 236, 91, 0.2)",
  },
  statusBadgeSponsored: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  statusTextAvailable: {
    color: "#0ea640",
  },
  statusTextSponsored: {
    color: "#6B7280",
  },
  beneficiaryDescription: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 18,
    marginTop: 4,
  },
  sponsorButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#13ec5b",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#13ec5b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sponsorButtonDisabled: {
    backgroundColor: "#F3F4F6",
    shadowOpacity: 0,
  },
  loadingContainer: {
    paddingVertical: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  centerImage: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  detailsSection: {
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
  },
  statusInfo: {
    backgroundColor: "rgba(19, 236, 91, 0.05)",
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  statusLabel: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
});

export default CampaignDetail;
