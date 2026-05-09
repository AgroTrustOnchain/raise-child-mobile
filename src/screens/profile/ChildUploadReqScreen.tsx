import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { uploadImageToWalrus } from "../../services/walrus.service";
import {
  submitChildUploadRequest,
  ChildUploadReqPayload,
} from "../../services/child-upload.service";
import { getEstablishedRegions } from "../../services/registration.service";

type Gender = "Male" | "Female" | "Other" | "";
type ImageSlot = "avatar" | "birthCertificate" | "home" | "firstGuardianId" | "secondGuardianId";

interface GuardianForm {
  fullName: string;
  phoneNumber: string;
  relation: string;
  idCardBlobId?: string;
  idCardPreview?: string;
}

const emptyGuardian = (): GuardianForm => ({
  fullName: "",
  phoneNumber: "",
  relation: "",
  idCardBlobId: undefined,
  idCardPreview: undefined,
});

const GENDERS: Gender[] = ["Male", "Female", "Other"];

type RelationValue = "father" | "mother" | "guardian";
const RELATION_OPTIONS: { value: RelationValue; label: string }[] = [
  { value: "father", label: "Cha" },
  { value: "mother", label: "Mẹ" },
  { value: "guardian", label: "Người giám hộ" },
];
const relationLabel = (value: string) =>
  RELATION_OPTIONS.find((o) => o.value === value)?.label || "";

const ChildUploadReqScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  // Image fields
  const [avatarBlobId, setAvatarBlobId] = useState<string | undefined>();
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>();
  const [birthCertBlobId, setBirthCertBlobId] = useState<string | undefined>();
  const [birthCertPreview, setBirthCertPreview] = useState<string | undefined>();
  const [homeBlobId, setHomeBlobId] = useState<string | undefined>();
  const [homePreview, setHomePreview] = useState<string | undefined>();

  // Text fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<Gender>("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [identityCode, setIdentityCode] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [region, setRegion] = useState("");

  // Guardians
  const [firstGuardian, setFirstGuardian] = useState<GuardianForm>(emptyGuardian());
  const [hasSecondGuardian, setHasSecondGuardian] = useState(false);
  const [secondGuardian, setSecondGuardian] = useState<GuardianForm>(emptyGuardian());

  // UI state
  const [uploadingSlot, setUploadingSlot] = useState<ImageSlot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [establishedRegions, setEstablishedRegions] = useState<string[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [regionQuery, setRegionQuery] = useState("");

  // Modals
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [openRelationPicker, setOpenRelationPicker] = useState<
    "first" | "second" | null
  >(null);

  // Date picker state — child must be under 16
  const today = new Date();
  const MAX_YEAR = today.getFullYear();
  const [pickerDay, setPickerDay] = useState(1);
  const [pickerMonth, setPickerMonth] = useState(1);
  const [pickerYear, setPickerYear] = useState(today.getFullYear() - 5);

  const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const daysInMonth = (m: number, y: number) => new Date(y, m, 0).getDate();
  const dayOptions = Array.from(
    { length: daysInMonth(pickerMonth, pickerYear) },
    (_, i) => i + 1,
  );
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  // Only years that keep the child under 16 (16 youngest birth years inclusive)
  const yearOptions = Array.from({ length: 16 }, (_, i) => MAX_YEAR - i);

  const isUnder16 = (dob: string) => {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dob);
    if (!m) return false;
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);
    const birth = new Date(year, month - 1, day);
    if (isNaN(birth.getTime())) return false;
    const sixteenAgo = new Date(
      today.getFullYear() - 16,
      today.getMonth(),
      today.getDate(),
    );
    // Strictly under 16: birth must be after the date 16 years ago
    return birth > sixteenAgo && birth <= today;
  };

  useEffect(() => {
    (async () => {
      try {
        setLoadingRegions(true);
        setEstablishedRegions(await getEstablishedRegions());
      } catch (e) {
        console.warn("Failed to load established regions", e);
        setEstablishedRegions([]);
      } finally {
        setLoadingRegions(false);
      }
    })();
  }, []);

  const filteredRegions = useMemo(() => {
    const q = regionQuery.trim().toLowerCase();
    if (!q) return establishedRegions;
    return establishedRegions.filter((r) => r.toLowerCase().includes(q));
  }, [establishedRegions, regionQuery]);

  const pickImage = async (slot: ImageSlot) => {
    try {
      const aspect: [number, number] = slot === "avatar" ? [1, 1] : [4, 3];
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect,
        quality: 0.8,
      });
      if (result.canceled) return;

      const uri = result.assets[0].uri;
      setUploadingSlot(slot);
      const blob = await uploadImageToWalrus(uri);

      switch (slot) {
        case "avatar":
          setAvatarBlobId(blob.blobId);
          setAvatarPreview(uri);
          break;
        case "birthCertificate":
          setBirthCertBlobId(blob.blobId);
          setBirthCertPreview(uri);
          break;
        case "home":
          setHomeBlobId(blob.blobId);
          setHomePreview(uri);
          break;
        case "firstGuardianId":
          setFirstGuardian((g) => ({ ...g, idCardBlobId: blob.blobId, idCardPreview: uri }));
          break;
        case "secondGuardianId":
          setSecondGuardian((g) => ({ ...g, idCardBlobId: blob.blobId, idCardPreview: uri }));
          break;
      }
    } catch (e: any) {
      Alert.alert("Lỗi", e?.message || "Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setUploadingSlot(null);
    }
  };

  const openDatePicker = () => {
    const m = dateOfBirth.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      setPickerDay(Number(m[1]));
      setPickerMonth(Number(m[2]));
      setPickerYear(Number(m[3]));
    }
    setShowDatePicker(true);
  };

  const confirmDate = () => {
    const maxDay = daysInMonth(pickerMonth, pickerYear);
    const day = Math.min(pickerDay, maxDay);
    setDateOfBirth(`${pad2(day)}/${pad2(pickerMonth)}/${pickerYear}`);
    setShowDatePicker(false);
  };

  const isGuardianValid = (g: GuardianForm) =>
    g.fullName.trim().length > 0 &&
    /^\d{10}$/.test(g.phoneNumber.trim()) &&
    g.relation.trim().length > 0 &&
    !!g.idCardBlobId;

  const isFormValid =
    !!avatarBlobId &&
    !!birthCertBlobId &&
    !!homeBlobId &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    gender !== "" &&
    isUnder16(dateOfBirth) &&
    /^\d{12}$/.test(identityCode.trim()) &&
    homeAddress.trim().length > 0 &&
    region.trim().length > 0 &&
    isGuardianValid(firstGuardian) &&
    (!hasSecondGuardian || isGuardianValid(secondGuardian));

  const buildPayload = (): ChildUploadReqPayload => ({
    avatar_blob_id: avatarBlobId!,
    birth_certificate_blob_id: birthCertBlobId!,
    date_of_birth: dateOfBirth,
    first_guardian: {
      guardian_full_name: firstGuardian.fullName,
      guardian_phone_number: firstGuardian.phoneNumber,
      guardian_relation: firstGuardian.relation,
      identity_card_blob_id: firstGuardian.idCardBlobId!,
    },
    first_name: firstName,
    gender,
    home_address: homeAddress,
    home_blob_id: homeBlobId!,
    identity_code: identityCode,
    last_name: lastName,
    region,
    ...(hasSecondGuardian && {
      second_guardian: {
        guardian_full_name: secondGuardian.fullName,
        guardian_phone_number: secondGuardian.phoneNumber,
        guardian_relation: secondGuardian.relation,
        identity_card_blob_id: secondGuardian.idCardBlobId!,
      },
    }),
  });

  const submit = async () => {
    if (!isFormValid) {
      Alert.alert("Thiếu thông tin", "Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }
    try {
      setIsSubmitting(true);
      console.log(buildPayload())
      await submitChildUploadRequest(buildPayload());
      navigation.replace("PaymentCallbackScreen", {
        status: "success",
        title: "Gửi yêu cầu thành công!",
        message: "Yêu cầu đăng ký trẻ em đã được gửi để xét duyệt.",
      });
    } catch (e: any) {
      Alert.alert(
        "Gửi thất bại",
        e?.response?.data?.message || e?.message || "Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Image upload card ──────────────────────────────────────────────────────
  const renderImageUpload = (
    slot: ImageSlot,
    label: string,
    blobId?: string,
    preview?: string,
  ) => {
    const isUploading = uploadingSlot === slot;
    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          {label} <Text style={styles.requiredStar}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.imageUpload}
          onPress={() => pickImage(slot)}
          disabled={isUploading}
          activeOpacity={0.8}
        >
          {isUploading ? (
            <View style={styles.uploadCenter}>
              <ActivityIndicator color="#1E40AF" />
              <Text style={styles.uploadHint}>Đang tải lên…</Text>
            </View>
          ) : preview ? (
            <View style={styles.uploadPreviewWrap}>
              <Image source={{ uri: preview }} style={styles.uploadPreview} />
              <View style={styles.uploadOverlay}>
                <Ionicons name="checkmark-circle" size={20} color="#1E40AF" />
                <Text style={styles.uploadOverlayText}>Đã tải lên</Text>
              </View>
            </View>
          ) : (
            <View style={styles.uploadCenter}>
              <Ionicons name="cloud-upload-outline" size={28} color="#9CA3AF" />
              <Text style={styles.uploadHint}>Nhấn để chọn ảnh</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // ── Guardian form ──────────────────────────────────────────────────────────
  const renderGuardianForm = (
    guardian: GuardianForm,
    setGuardian: (g: GuardianForm) => void,
    slot: "firstGuardianId" | "secondGuardianId",
    isOptional = false,
  ) => {
  const relationKey = slot === "firstGuardianId" ? "first" : "second";
  const isPickerOpen = openRelationPicker === relationKey;
  return (
    <View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          Họ và tên người giám hộ
          {!isOptional && <Text style={styles.requiredStar}> *</Text>}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Nguyễn Văn A"
          placeholderTextColor="#9CA3AF"
          value={guardian.fullName}
          onChangeText={(v) => setGuardian({ ...guardian, fullName: v })}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <Text style={styles.label}>
            Số điện thoại
            {!isOptional && <Text style={styles.requiredStar}> *</Text>}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="0901234567"
            placeholderTextColor="#9CA3AF"
            value={guardian.phoneNumber}
            onChangeText={(v) =>
              setGuardian({
                ...guardian,
                phoneNumber: v.replace(/\D/g, "").slice(0, 10),
              })
            }
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>
        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <Text style={styles.label}>
            Quan hệ
            {!isOptional && <Text style={styles.requiredStar}> *</Text>}
          </Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() =>
              setOpenRelationPicker(isPickerOpen ? null : relationKey)
            }
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.pickerText,
                !guardian.relation && styles.pickerPlaceholder,
              ]}
            >
              {relationLabel(guardian.relation) || "Chọn"}
            </Text>
            <Ionicons
              name={isPickerOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color="#9CA3AF"
            />
          </TouchableOpacity>
          {isPickerOpen && (
            <View style={styles.dropdown}>
              {RELATION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.dropdownItem,
                    guardian.relation === opt.value && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    setGuardian({ ...guardian, relation: opt.value });
                    setOpenRelationPicker(null);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      guardian.relation === opt.value &&
                        styles.dropdownItemTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {guardian.relation === opt.value && (
                    <Ionicons name="checkmark" size={16} color="#1E40AF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {renderImageUpload(
        slot,
        "Ảnh CMND/CCCD người giám hộ",
        guardian.idCardBlobId,
        guardian.idCardPreview,
      )}
    </View>
  );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đăng ký trẻ em</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.intro}>
          <Text style={styles.introTitle}>Hồ sơ trẻ em mới</Text>
          <Text style={styles.introText}>
            Vui lòng điền đầy đủ thông tin và ảnh đính kèm. Yêu cầu sẽ được xét duyệt trước khi công khai.
          </Text>
        </View>

        {/* Section: Trẻ em */}
        <Text style={styles.sectionTitle}>Thông tin trẻ em</Text>

        {renderImageUpload("avatar", "Ảnh đại diện", avatarBlobId, avatarPreview)}

        <View style={styles.row}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>
              Tên <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="An"
              placeholderTextColor="#9CA3AF"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>
              Họ <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Nguyễn"
              placeholderTextColor="#9CA3AF"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Giới tính <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowGenderPicker((v) => !v)}
          >
            <Text style={[styles.pickerText, !gender && styles.pickerPlaceholder]}>
              {gender || "Chọn giới tính"}
            </Text>
            <Ionicons
              name={showGenderPicker ? "chevron-up" : "chevron-down"}
              size={18}
              color="#9CA3AF"
            />
          </TouchableOpacity>
          {showGenderPicker && (
            <View style={styles.dropdown}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.dropdownItem,
                    gender === g && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    setGender(g);
                    setShowGenderPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      gender === g && styles.dropdownItemTextSelected,
                    ]}
                  >
                    {g}
                  </Text>
                  {gender === g && (
                    <Ionicons name="checkmark" size={16} color="#1E40AF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Ngày sinh <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TouchableOpacity style={styles.pickerButton} onPress={openDatePicker}>
            <Text style={[styles.pickerText, !dateOfBirth && styles.pickerPlaceholder]}>
              {dateOfBirth || "DD/MM/YYYY"}
            </Text>
            <Ionicons name="calendar-outline" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Mã định danh <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="123456789012"
            placeholderTextColor="#9CA3AF"
            value={identityCode}
            onChangeText={(v) => setIdentityCode(v.replace(/\D/g, "").slice(0, 12))}
            keyboardType="number-pad"
            maxLength={12}
          />
        </View>

        {renderImageUpload(
          "birthCertificate",
          "Ảnh giấy khai sinh",
          birthCertBlobId,
          birthCertPreview,
        )}

        {/* Section: Địa chỉ */}
        <Text style={styles.sectionTitle}>Địa chỉ</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Địa chỉ nhà <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: "top" }]}
            placeholder="Số nhà, đường, phường/xã, quận/huyện"
            placeholderTextColor="#9CA3AF"
            value={homeAddress}
            onChangeText={setHomeAddress}
            multiline
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Khu vực <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowRegionModal(true)}
            disabled={loadingRegions}
            activeOpacity={0.8}
          >
            <Ionicons name="location-outline" size={18} color="#1E40AF" />
            <Text style={[styles.pickerText, !region && styles.pickerPlaceholder]}>
              {region || (loadingRegions ? "Đang tải khu vực…" : "Chọn khu vực đã thành lập")}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {renderImageUpload("home", "Ảnh nơi ở", homeBlobId, homePreview)}

        {/* Section: Người giám hộ chính */}
        <Text style={styles.sectionTitle}>Người giám hộ chính</Text>
        {renderGuardianForm(firstGuardian, setFirstGuardian, "firstGuardianId")}

        {/* Section: Người giám hộ phụ (optional) */}
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Người giám hộ phụ</Text>
            <Text style={styles.optionalHint}>Tuỳ chọn</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, hasSecondGuardian && styles.toggleActive]}
            onPress={() => setHasSecondGuardian((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={[styles.toggleKnob, hasSecondGuardian && styles.toggleKnobActive]} />
          </TouchableOpacity>
        </View>
        {hasSecondGuardian &&
          renderGuardianForm(secondGuardian, setSecondGuardian, "secondGuardianId", true)}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom || 16 }]}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!isFormValid || isSubmitting) && styles.submitDisabled,
          ]}
          onPress={submit}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={18} color="#FFFFFF" />
              <Text style={styles.submitText}>Gửi yêu cầu</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Region modal — established regions only */}
      <Modal
        visible={showRegionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRegionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.regionSheet}>
            <View style={styles.regionSheetHeader}>
              <Text style={styles.modalTitle}>Chọn khu vực</Text>
              <TouchableOpacity onPress={() => setShowRegionModal(false)}>
                <Ionicons name="close" size={22} color="#111827" />
              </TouchableOpacity>
            </View>

            <View style={styles.regionSearchWrap}>
              <Ionicons name="search" size={16} color="#9CA3AF" />
              <TextInput
                style={styles.regionSearchInput}
                placeholder="Tìm khu vực…"
                placeholderTextColor="#9CA3AF"
                value={regionQuery}
                onChangeText={setRegionQuery}
                autoCorrect={false}
              />
            </View>

            <View style={styles.regionNoticeCard}>
              <Ionicons name="information-circle-outline" size={18} color="#1E40AF" />
              <View style={{ flex: 1 }}>
                <Text style={styles.regionNoticeText}>
                  Không tìm thấy khu vực của trẻ? Hãy đề xuất khu vực cần hỗ trợ để được xét duyệt.
                </Text>
                <TouchableOpacity
                  style={styles.regionNoticeButton}
                  onPress={() => {
                    setShowRegionModal(false);
                    navigation.navigate("CreateSupportedRegion");
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.regionNoticeButtonText}>Đề xuất khu vực</Text>
                </TouchableOpacity>
              </View>
            </View>

            {loadingRegions ? (
              <ActivityIndicator size="large" color="#1E40AF" style={{ padding: 32 }} />
            ) : (
              <FlatList
                data={filteredRegions}
                keyExtractor={(item) => item}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 420 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.regionItem,
                      region === item && styles.regionItemSelected,
                    ]}
                    onPress={() => {
                      setRegion(item);
                      setShowRegionModal(false);
                      setRegionQuery("");
                    }}
                  >
                    <Ionicons name="location-outline" size={18} color="#1E40AF" />
                    <Text
                      style={[
                        styles.regionItemText,
                        region === item && styles.regionItemTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    {region === item && (
                      <Ionicons name="checkmark" size={18} color="#1E40AF" />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    {establishedRegions.length === 0
                      ? "Chưa có khu vực nào được thành lập."
                      : "Không tìm thấy khu vực phù hợp."}
                  </Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Date modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDatePicker(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.dateModalCard}>
            <Text style={styles.modalTitle}>Chọn ngày sinh</Text>
            <View style={styles.dateColumns}>
              {[
                { data: dayOptions, value: pickerDay, set: setPickerDay, label: "Ngày", fmt: pad2 },
                { data: monthOptions, value: pickerMonth, set: setPickerMonth, label: "Tháng", fmt: pad2 },
                { data: yearOptions, value: pickerYear, set: setPickerYear, label: "Năm", fmt: (n: number) => `${n}` },
              ].map((col, idx) => (
                <View style={styles.dateColumn} key={idx}>
                  <Text style={styles.dateColumnLabel}>{col.label}</Text>
                  <FlatList
                    data={col.data}
                    keyExtractor={(item) => `${col.label}-${item}`}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.dateOption,
                          col.value === item && styles.dateOptionSelected,
                        ]}
                        onPress={() => col.set(item)}
                      >
                        <Text
                          style={[
                            styles.dateOptionText,
                            col.value === item && styles.dateOptionTextSelected,
                          ]}
                        >
                          {col.fmt(item)}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              ))}
            </View>
            <View style={styles.dateActions}>
              <TouchableOpacity
                style={styles.dateCancel}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.dateCancelText}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dateConfirm} onPress={confirmDate}>
                <Text style={styles.dateConfirmText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#1E40AF",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },

  scrollContent: { padding: 16 },
  intro: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  introTitle: { fontSize: 14, fontWeight: "800", color: "#1E40AF", marginBottom: 4 },
  introText: { fontSize: 12, color: "#1E40AF", lineHeight: 18 },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 12,
  },

  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "700", color: "#111827", marginBottom: 6 },
  requiredStar: { color: "#DC2626", fontWeight: "700" },

  row: { flexDirection: "row", gap: 12 },

  input: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    fontSize: 14,
    color: "#111827",
  },

  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  pickerText: { fontSize: 14, color: "#111827", fontWeight: "500" },
  pickerPlaceholder: { color: "#9CA3AF", fontWeight: "400" },

  dropdown: {
    marginTop: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dropdownItemSelected: { backgroundColor: "#EFF6FF" },
  dropdownItemText: { fontSize: 14, fontWeight: "500", color: "#374151" },
  dropdownItemTextSelected: { color: "#1E40AF", fontWeight: "700" },

  imageUpload: {
    borderWidth: 1,
    borderColor: "#DBEAFE",
    borderStyle: "dashed",
    borderRadius: 12,
    backgroundColor: "#F8FAFF",
    minHeight: 120,
    overflow: "hidden",
  },
  uploadCenter: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    gap: 6,
  },
  uploadHint: { fontSize: 12, color: "#6B7280" },
  uploadPreviewWrap: { width: "100%", height: 160, position: "relative" },
  uploadPreview: { width: "100%", height: "100%", resizeMode: "cover" },
  uploadOverlay: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  uploadOverlayText: { fontSize: 11, color: "#1E40AF", fontWeight: "700" },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 12,
  },
  optionalHint: { fontSize: 11, color: "#9CA3AF", marginTop: -8 },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
    padding: 2,
    justifyContent: "center",
  },
  toggleActive: { backgroundColor: "#1E40AF" },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
  },
  toggleKnobActive: { alignSelf: "flex-end" },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1E40AF",
    height: 56,
    borderRadius: 14,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 12,
  },
  regionSheet: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    maxHeight: "80%",
  },
  regionSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  regionSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  regionSearchInput: { flex: 1, fontSize: 14, color: "#111827" },
  regionNoticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    padding: 12,
    marginBottom: 12,
  },
  regionNoticeText: { fontSize: 12, color: "#1E40AF", lineHeight: 18, marginBottom: 8 },
  regionNoticeButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: "#1E40AF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  regionNoticeButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  regionModalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
  },
  regionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  regionItemSelected: { backgroundColor: "#EFF6FF" },
  regionItemText: { fontSize: 14, color: "#374151", fontWeight: "500" },
  regionItemTextSelected: { color: "#1E40AF", fontWeight: "700" },
  emptyText: { textAlign: "center", color: "#9CA3AF", paddingVertical: 24 },
  modalCloseBtn: {
    marginTop: 12,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: { color: "#6B7280", fontWeight: "700" },

  dateModalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
  },
  dateColumns: { flexDirection: "row", height: 220, gap: 8 },
  dateColumn: { flex: 1 },
  dateColumnLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: 8,
  },
  dateOption: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 4,
  },
  dateOptionSelected: { backgroundColor: "#1E40AF" },
  dateOptionText: { fontSize: 14, color: "#374151", fontWeight: "500" },
  dateOptionTextSelected: { color: "#FFFFFF", fontWeight: "700" },
  dateActions: { flexDirection: "row", gap: 12, marginTop: 16 },
  dateCancel: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  dateCancelText: { color: "#6B7280", fontWeight: "700" },
  dateConfirm: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#1E40AF",
    alignItems: "center",
    justifyContent: "center",
  },
  dateConfirmText: { color: "#FFFFFF", fontWeight: "800" },
});

export default ChildUploadReqScreen;
