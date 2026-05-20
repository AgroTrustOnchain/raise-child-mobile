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
          activeOpacity={0.9}
        >
          {item.avatar_blob_id ? (
            <WalrusImage
              blobId={item.avatar_blob_id}
              style={styles.childAvatar}
              resizeMode="cover"
              fallbackIconSize={32}
            />
          ) : (
            <View style={styles.childAvatarPlaceholder}>
              <Ionicons
                name={isFemale ? "person" : "person-outline"}
                size={32}
                color="#1E40AF"
              />
            </View>
          )}
          <View style={styles.childInfo}>
            <Text style={styles.childName} numberOfLines={1}>{fullName}</Text>
            <Text style={styles.childMeta}>
              {formatGender(item.gender)}
              {item.identity_code ? `  •  ${item.identity_code}` : ""}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      );
    },
    [navigation]
  );

  const ListHeader = (
    <View>
      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={18} color="#1E40AF" />
          <Text style={styles.detailText}>{regionInfo?.center_address || "—"}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="call" size={18} color="#1E40AF" />
          <Text style={styles.detailText}>{regionInfo?.center_phone_number || "—"}</Text>
        </View>
      </View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Trẻ em</Text>
        <Text style={styles.sectionCount}>{children.length} hồ sơ</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Nav */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {region}
        </Text>
        <View style={styles.navButton} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E40AF" />
        </View>
      ) : (
        <>
          {regionInfo && (
            <View style={styles.infoCard}>
              {centerBlobId ? (
                <WalrusImage blobId={centerBlobId} style={styles.centerImage} resizeMode="cover" fallbackIconSize={48} />
              ) : (
                <View style={styles.centerImagePlaceholder}>
                  <Ionicons name="business" size={48} color="#1E40AF" />
                </View>
              )}

              <View style={styles.donatedCard}>
                <View style={styles.donatedTextWrap}>
                  <Text style={styles.donatedLabel}>Tổng đã quyên góp</Text>
                  <Text style={styles.donatedAmount}>
                    {formatVNDLower(regionInfo.total_donated)}
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
                  <Text style={styles.donateButtonText}>Quyên góp</Text>
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
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  listContent: { paddingBottom: 40 },

  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "rgba(248, 250, 252, 0.85)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 232, 240, 0.5)",
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  navTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    paddingHorizontal: 8,
  },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  infoCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
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
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  detailsSection: { gap: 10, marginBottom: 16, paddingHorizontal: 16, paddingTop: 12 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailText: { flex: 1, fontSize: 14, color: "#6B7280", fontWeight: "500" },

  donatedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  donatedTextWrap: { flex: 1 },
  donatedLabel: { fontSize: 12, color: "#6B7280", fontWeight: "500" },
  donatedAmount: { fontSize: 20, fontWeight: "800", color: "#111827", marginTop: 2 },
  donateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1E40AF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#1E40AF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  donateButtonText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  sectionCount: { fontSize: 13, color: "#9CA3AF" },

  childCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  childAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
    overflow: "hidden",
    backgroundColor: "#EFF6FF",
  },
  childAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  childInfo: { flex: 1 },
  childName: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 3 },
  childMeta: { fontSize: 12, color: "#9CA3AF" },

  footerLoader: { paddingVertical: 16, alignItems: "center" },
  emptyContainer: { alignItems: "center", paddingVertical: 48 },
  emptyText: { fontSize: 15, color: "#9CA3AF", marginTop: 12 },
});

export default CampaignDetail;
