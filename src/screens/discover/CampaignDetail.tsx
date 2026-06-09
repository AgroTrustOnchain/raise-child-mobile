import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getEstablishedRegion, RegionChild } from "../../services/campaign.service";
import { formatVNDLower } from "../../utils/currency";
import WalrusImage from "../../components/WalrusImage";

const PAGE_SIZE = 10;

const formatGender = (g?: string | null): string => {
  if (!g) return "—";
  const v = g.trim().toLowerCase();
  if (v === "male" || v === "m" || v === "nam") return "Nam";
  if (v === "female" || v === "f" || v === "nữ" || v === "nu") return "Nữ";
  return "Khác";
};

type RegionInfo = {
  pool_id: string;
  center_phone_number: string;
  center_address: string;
  center_image_blob_id: string;
  total_donated: number;
};

const CampaignDetail = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = route.params as { campaignId?: string; region?: string } | undefined;
  const region = params?.region || "AgroTrust";

  const [regionInfo, setRegionInfo] = useState<RegionInfo | null>(null);
  const [children, setChildren] = useState<RegionChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadPage = useCallback(
    async (pageNum: number, reset: boolean) => {
      try {
        const data = await getEstablishedRegion(region, pageNum, PAGE_SIZE);
        if (reset) {
          setRegionInfo({
            pool_id: data.pool_id,
            center_phone_number: data.center_phone_number,
            center_address: data.center_address,
            center_image_blob_id: data.center_image_blob_id,
            total_donated: data.total_donated,
          });
          setChildren(data.children?.data ?? []);
        } else {
          const incoming = data.children?.data ?? [];
          setChildren((prev) => {
            const seen = new Set(prev.map((c) => c.id));
            const next = [...prev];
            for (const c of incoming) {
              if (!seen.has(c.id)) {
                next.push(c);
                seen.add(c.id);
              }
            }
            return next;
          });
        }
        setTotalPages(data.children?.total_pages ?? 0);
        setPage(pageNum);
      } catch (e) {
        console.warn("Failed to load region data", e);
      }
    },
    [region]
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadPage(0, true);
      setLoading(false);
    })();
  }, [loadPage]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPage(0, true);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loadingMore || refreshing || page + 1 >= totalPages) return;
    setLoadingMore(true);
    await loadPage(page + 1, false);
    setLoadingMore(false);
  };

  const centerBlobId = regionInfo?.center_image_blob_id;

  const renderChild = useCallback(
    ({ item }: { item: RegionChild }) => {
      const isFemale = formatGender(item.gender) === "Nữ";
      const fullName = `${item.first_name || ""} ${item.last_name || ""}`.trim() || "Chưa có tên";
      return (
        <TouchableOpacity
          style={styles.childCard}
          onPress={() => navigation.navigate("ChildDetailScreen", { childId: item.id })}
          activeOpacity={0.85}
        >
          {item.avatar_blob_id ? (
            <WalrusImage
              blobId={item.avatar_blob_id}
              style={styles.childAvatar}
              resizeMode="cover"
              fallbackIconSize={28}
            />
          ) : (
            <View style={styles.childAvatarPlaceholder}>
              <Ionicons
                name={isFemale ? "person" : "person-outline"}
                size={28}
                color="#1E40AF"
              />
            </View>
          )}
          <View style={styles.childInfo}>
            <Text style={styles.childName} numberOfLines={1}>{fullName}</Text>
            <Text style={styles.childMeta}>
              {formatGender(item.gender)}
              {item.identity_code ? `  •  ID: ${item.identity_code}` : ""}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C7D2FE" />
        </TouchableOpacity>
      );
    },
    [navigation]
  );

  const ListHeader = (
    <View>
      {/* Center image / icon */}
      <View style={styles.heroContainer}>
        {centerBlobId ? (
          <WalrusImage
            blobId={centerBlobId}
            style={styles.heroImage}
            resizeMode="cover"
            fallbackIconSize={64}
          />
        ) : (
          <View style={styles.heroPlaceholder}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="business" size={56} color="#1E40AF" />
            </View>
          </View>
        )}
      </View>

      {/* Total raised + Donate */}
      <View style={styles.raisedSection}>
        <Text style={styles.raisedLabel}>TOTAL RAISED</Text>
        <Text style={styles.raisedAmount}>
          {formatVNDLower(regionInfo?.total_donated ?? 0)}{" "}

        </Text>
        <TouchableOpacity
          style={styles.donateButton}
          onPress={() =>
            navigation.navigate("DonateRegionScreen", {
              pool_id: regionInfo?.pool_id,
              region,
            })
          }
          activeOpacity={0.85}
        >
          <Ionicons name="heart" size={18} color="#fff" />
          <Text style={styles.donateButtonText}>Donate</Text>
        </TouchableOpacity>
      </View>

      {/* Details */}
      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <View style={styles.detailIconWrap}>
            <Ionicons name="location-outline" size={18} color="#1E40AF" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Headquarters</Text>
            <Text style={styles.detailValue} numberOfLines={2}>
              {regionInfo?.center_address || "—"}
            </Text>
          </View>
        </View>

        <View style={styles.detailDivider} />

        <View style={styles.detailRow}>
          <View style={styles.detailIconWrap}>
            <Ionicons name="call-outline" size={18} color="#1E40AF" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Verified Phone</Text>
            <Text style={styles.detailValue}>
              {regionInfo?.center_phone_number || "—"}
            </Text>
          </View>
        </View>
      </View>

      {/* Children section header */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Children</Text>
          <Text style={styles.sectionSubtitle}>Community Beneficiaries</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{children.length} profiles</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Nav */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {region}
        </Text>
        <View style={styles.verifiedBadge}>
          <View style={styles.verifiedDot} />
          <Text style={styles.verifiedText}>BLOCKCHAIN VERIFIED</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E40AF" />
        </View>
      ) : (
        <FlatList
          data={children}
          renderItem={renderChild}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E40AF" />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#1E40AF" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Không tìm thấy trẻ em nào</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4FF" },
  listContent: { paddingBottom: 40 },

  // Top nav
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2FF",
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  navTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  verifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#16A34A",
    letterSpacing: 0.5,
  },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Hero image / placeholder
  heroContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#E0E7FF",
  },
  heroImage: {
    width: "100%",
    height: 200,
  },
  heroPlaceholder: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E0E7FF",
  },
  heroIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: "#C7D2FE",
    justifyContent: "center",
    alignItems: "center",
  },

  // Total raised + donate
  raisedSection: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  raisedLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  raisedAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1E40AF",
    marginBottom: 18,
  },
  raisedCurrency: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6366F1",
  },
  donateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F97316",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
  },
  donateButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  // Details
  detailsSection: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  detailDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: 46,
  },
  detailIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  detailContent: { flex: 1 },
  detailLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 20,
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  countBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
  },

  // Child card
  childCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  childAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
    overflow: "hidden",
    backgroundColor: "#EEF2FF",
  },
  childAvatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  childInfo: { flex: 1 },
  childName: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 3 },
  childMeta: { fontSize: 12, color: "#9CA3AF", fontWeight: "500" },

  footerLoader: { paddingVertical: 16, alignItems: "center" },
  emptyContainer: { alignItems: "center", paddingVertical: 48 },
  emptyText: { fontSize: 15, color: "#9CA3AF", marginTop: 12 },
});

export default CampaignDetail;
