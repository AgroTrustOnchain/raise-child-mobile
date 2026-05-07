import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getProvinces,
  getWardsByProvince,
  Province,
  Ward,
} from "../services/location.service";

type Props = {
  value: string;
  onChange: (ward: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: any;
};

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const RegionPicker: React.FC<Props> = ({
  value,
  onChange,
  placeholder = "Chọn khu vực",
  disabled,
  style,
}) => {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<"province" | "ward">("province");

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [provinceQuery, setProvinceQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);

  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingWards, setLoadingWards] = useState(false);
  const [wardQuery, setWardQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    if (provinces.length > 0) return;
    (async () => {
      try {
        setLoadingProvinces(true);
        setProvinces(await getProvinces());
      } catch {
        setProvinces([]);
      } finally {
        setLoadingProvinces(false);
      }
    })();
  }, [open]);

  const filteredProvinces = useMemo(() => {
    if (!provinceQuery.trim()) return provinces;
    const q = norm(provinceQuery);
    return provinces.filter((p) => norm(p.name).includes(q));
  }, [provinces, provinceQuery]);

  const filteredWards = useMemo(() => {
    if (!wardQuery.trim()) return wards;
    const q = norm(wardQuery);
    return wards.filter((w) => norm(w.name).includes(q));
  }, [wards, wardQuery]);

  const pickProvince = async (p: Province) => {
    setSelectedProvince(p);
    setStage("ward");
    setWardQuery("");
    try {
      setLoadingWards(true);
      setWards(await getWardsByProvince(p.code));
    } catch {
      setWards([]);
    } finally {
      setLoadingWards(false);
    }
  };

  const pickWard = (w: Ward) => {
    onChange(w.name);
    setOpen(false);
    setStage("province");
    setProvinceQuery("");
    setWardQuery("");
  };

  const handleClose = () => {
    setOpen(false);
    setStage("province");
    setProvinceQuery("");
    setWardQuery("");
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, style, disabled && styles.disabled]}
        onPress={() => !disabled && setOpen(true)}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <Ionicons name="location-outline" size={18} color="#1E40AF" />
        <Text style={[styles.triggerText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#6B7280" />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              {stage === "ward" ? (
                <TouchableOpacity
                  onPress={() => {
                    setStage("province");
                    setWardQuery("");
                  }}
                  style={styles.headerBtn}
                >
                  <Ionicons name="chevron-back" size={22} color="#111827" />
                </TouchableOpacity>
              ) : (
                <View style={styles.headerBtn} />
              )}
              <Text style={styles.headerTitle}>
                {stage === "province"
                  ? "Chọn Tỉnh/Thành phố"
                  : `Chọn Xã/Phường${selectedProvince ? ` - ${selectedProvince.name}` : ""}`}
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.headerBtn}>
                <Ionicons name="close" size={22} color="#111827" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchWrap}>
              <Ionicons name="search" size={16} color="#9CA3AF" />
              <TextInput
                style={styles.search}
                placeholder={
                  stage === "province" ? "Tìm tỉnh/thành phố…" : "Tìm xã/phường…"
                }
                placeholderTextColor="#9CA3AF"
                value={stage === "province" ? provinceQuery : wardQuery}
                onChangeText={
                  stage === "province" ? setProvinceQuery : setWardQuery
                }
                autoCorrect={false}
              />
            </View>

            {stage === "province" ? (
              loadingProvinces ? (
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color="#1E40AF" />
                </View>
              ) : (
                <FlatList
                  data={filteredProvinces}
                  keyExtractor={(item) => String(item.code)}
                  keyboardShouldPersistTaps="handled"
                  ListEmptyComponent={
                    <Text style={styles.empty}>Không tìm thấy</Text>
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.row}
                      onPress={() => pickProvince(item)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="map-outline" size={18} color="#1E40AF" />
                      <Text style={styles.rowText}>{item.name}</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  )}
                />
              )
            ) : loadingWards ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color="#1E40AF" />
              </View>
            ) : (
              <FlatList
                data={filteredWards}
                keyExtractor={(item) => String(item.code)}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Text style={styles.empty}>Không tìm thấy</Text>
                }
                renderItem={({ item }) => {
                  const selected = value === item.name;
                  return (
                    <TouchableOpacity
                      style={[styles.row, selected && styles.rowSelected]}
                      onPress={() => pickWard(item)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="location-outline"
                        size={18}
                        color="#1E40AF"
                      />
                      <Text style={styles.rowText}>{item.name}</Text>
                      {selected && (
                        <Ionicons name="checkmark" size={18} color="#1E40AF" />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    height: 50,
  },
  disabled: { opacity: 0.5 },
  triggerText: { flex: 1, fontSize: 14, color: "#111827", fontWeight: "500" },
  placeholder: { color: "#9CA3AF", fontWeight: "400" },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
    height: "82%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: "#111827", textAlign: "center" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    margin: 12,
  },
  search: { flex: 1, fontSize: 14, color: "#111827" },

  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  empty: { textAlign: "center", color: "#9CA3AF", fontSize: 13, padding: 24 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  rowSelected: { backgroundColor: "#EFF6FF" },
  rowText: { flex: 1, fontSize: 14, color: "#111827", fontWeight: "500" },
});

export default RegionPicker;
