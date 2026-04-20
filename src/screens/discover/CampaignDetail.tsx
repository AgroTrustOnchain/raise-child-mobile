import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getEstablishedRegion, RegionChild } from "../../services/campaign.service";
import { API_BASE_URL } from "../../services/api.service";

const PAGE_SIZE = 10;

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
          setChildren(data.children.data);
        } else {
          setChildren((prev) => {
            const seen = new Set(prev.map((c) => c.id));
            const next = [...prev];
            for (const c of data.children.data) {
              if (!seen.has(c.id)) {
                next.push(c);
                seen.add(c.id);
              }
            }
            return next;
          });
        }
        setTotalPages(data.children.total_pages);
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

  const imageUri = regionInfo?.center_image_blob_id
    ? `${API_BASE_URL}/blobs/${regionInfo.center_image_blob_id}`
    : undefined;

  const renderChild = useCallback(
    ({ item }: { item: RegionChild }) => (
      <TouchableOpacity
        style={styles.childCard}
        onPress={() => navigation.navigate("ChildDetailScreen", { childId: item.id })}
        activeOpacity={0.9}
      >
        <View style={styles.childAvatar}>
          <Ionicons
            name={item.gender === "female" ? "person" : "person-outline"}
            size={28}
            color="#13ec5b"
          />
        </View>
        <View style={styles.childInfo}>
          <Text style={styles.childName}>
            {`${item.first_name || ""} ${item.last_name || ""}`.trim() || "Unknown"}
          </Text>
          <Text style={styles.childMeta}>
            {item.gender
              ? item.gender.charAt(0).toUpperCase() + item.gender.slice(1)
              : "—"}
            {item.identity_code ? `  •  ${item.identity_code}` : ""}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    ),
    [navigation]
  );

  const ListHeader = (
    <View>
      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={18} color="#13ec5b" />
          <Text style={styles.detailText}>{regionInfo?.center_address || "—"}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="call" size={18} color="#13ec5b" />
          <Text style={styles.detailText}>{regionInfo?.center_phone_number || "—"}</Text>
        </View>
      </View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Children</Text>
        <Text style={styles.sectionCount}>{children.length} found</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Nav */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {region}
        </Text>
        <View style={styles.navButton} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#13ec5b" />
        </View>
      ) : (
        <>
          {regionInfo && (
            <View style={styles.infoCard}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.centerImage} />
              ) : (
                <View style={styles.centerImagePlaceholder}>
                  <Ionicons name="business" size={48} color="#2E7D32" />
                </View>
              )}

              <View style={styles.donatedCard}>
                <View style={styles.donatedTextWrap}>
                  <Text style={styles.donatedLabel}>Total Donated</Text>
                  <Text style={styles.donatedAmount}>
                    {regionInfo.total_donated.toLocaleString()} SUI
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.donateButton}
                  onPress={() =>
                    navigation.navigate("DonateRegionScreen", {
                      pool_id: regionInfo.pool_id,
                      region,
                    })
                  }
                  activeOpacity={0.85}
                >
                  <Ionicons name="heart" size={16} color="#fff" />
                  <Text style={styles.donateButtonText}>Donate</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <FlatList
            data={children}
            renderItem={renderChild}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={ListHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#13ec5b" />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No children found</Text>
              </View>
            }
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8f6" },
  listContent: { paddingBottom: 40 },

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

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  infoCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
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
  centerImage: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    marginBottom: 16,
  },
  centerImagePlaceholder: {
    width: "100%",
    height: 120,
    borderRadius: 16,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  detailsSection: { gap: 10, marginBottom: 16, paddingHorizontal: 16, paddingTop: 12 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailText: { flex: 1, fontSize: 14, color: "#4B5563", fontWeight: "500" },

  donatedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(19, 236, 91, 0.07)",
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  donatedTextWrap: { flex: 1 },
  donatedLabel: { fontSize: 12, color: "#6B7280", fontWeight: "500" },
  donatedAmount: { fontSize: 20, fontWeight: "800", color: "#1F2937", marginTop: 2 },
  donateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#13ec5b",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#13ec5b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  donateButtonText: { fontSize: 14, fontWeight: "700", color: "#fff" },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1F2937" },
  sectionCount: { fontSize: 13, color: "#9CA3AF" },

  childCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  childAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(19, 236, 91, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  childInfo: { flex: 1 },
  childName: { fontSize: 15, fontWeight: "600", color: "#1F2937", marginBottom: 3 },
  childMeta: { fontSize: 12, color: "#9CA3AF" },

  footerLoader: { paddingVertical: 16, alignItems: "center" },
  emptyContainer: { alignItems: "center", paddingVertical: 48 },
  emptyText: { fontSize: 15, color: "#9CA3AF", marginTop: 12 },
});

export default CampaignDetail;
