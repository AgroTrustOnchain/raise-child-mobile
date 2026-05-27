import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import { useModal } from '../../context/ModalContext';
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { uploadImageToCloudinary, uploadImageToWalrus } from "../../services/walrus.service";
import {
  submitChildUploadRequest,
  ChildUploadReqPayload,
} from "../../services/child-upload.service";
import { getEstablishedRegions } from "../../services/registration.service";
import { apiService } from "../../services/api.service";

interface OcrChildInfo {
  first_name?: string;
  last_name?: string;
  gender?: string;
  date_of_birth?: string;
  identity_code?: string;
  home_address?: string;
  first_guardian_full_name?: string;
  first_guardian_phone_number?: string;
  first_guardian_relation?: string;
  second_guardian_full_name?: string;
  second_guardian_phone_number?: string;
  second_guardian_relation?: string;
}

const extractChildInfo = async (
  imageUrl: string,
  slot: "birthCertificate" | "firstGuardianId" | "secondGuardianId" = "birthCertificate",
): Promise<OcrChildInfo | undefined> => {
  try {
    const body =
      slot === "firstGuardianId"
        ? { first_guardian_id_card_url: imageUrl }
        : slot === "secondGuardianId"
        ? { second_guardian_id_card_url: imageUrl }
        : { child_birth_certificate_url: imageUrl };
    const res = await apiService.post<OcrChildInfo>("/ocr/extract-child-info", body);
    console.log("OCR Response:", res.data);
    return res.data;
  } catch (e) {
    console.warn("OCR extraction failed", e);
  }
};

type Gender = "Male" | "Female" | "Other" | "";
type ImageSlot =
  | "avatar"
  | "birthCertificate"
  | "home"
  | "firstGuardianId"
  | "secondGuardianId";

interface GuardianForm {
  fullName: string;
  phoneNumber: string;
  relation: string;
  idCardBlobId?: string;
  idCardBase64?: string;
  idCardPreview?: string;
}

const emptyGuardian = (): GuardianForm => ({
  fullName: "",
  phoneNumber: "",
  relation: "",
  idCardBlobId: undefined,
  idCardBase64: undefined,
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
  const modal = useModal();

  // Image fields
  const [avatarBlobId, setAvatarBlobId] = useState<string | undefined>();
  const [avatarBase64, setAvatarBase64] = useState<string | undefined>();
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>();
  const [birthCertBlobId, setBirthCertBlobId] = useState<string | undefined>();
  const [birthCertBase64, setBirthCertBase64] = useState<string | undefined>();
  const [birthCertPreview, setBirthCertPreview] = useState<
    string | undefined
  >();
  const [homeBlobId, setHomeBlobId] = useState<string | undefined>();
  const [homeBase64, setHomeBase64] = useState<string | undefined>();
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
  const [firstGuardian, setFirstGuardian] =
    useState<GuardianForm>(emptyGuardian());
  const [hasSecondGuardian, setHasSecondGuardian] = useState(false);
  const [secondGuardian, setSecondGuardian] =
    useState<GuardianForm>(emptyGuardian());

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

  // Vietnam citizen ID (CCCD) validator.
  // Format: 12 digits — 3-digit province code (001–096), 1 gender/century digit (0–9),
  // 2-digit birth year (last two digits), 6 random digits.
  // If a DOB is supplied, the birth-year digits and gender/century digit must match it.
  const isValidVietnamCCCD = (
    code: string,
    opts?: { dob?: string; gender?: string },
  ) => {
    if (!/^\d{12}$/.test(code)) return false;
    const provinceCode = Number(code.slice(0, 3));
    if (provinceCode < 1 || provinceCode > 96) return false;
    const genderCenturyDigit = Number(code[3]);
    const yearTwoDigits = Number(code.slice(4, 6));
    if (Number.isNaN(yearTwoDigits)) return false;

    // Cross-check with DOB / gender when available
    if (opts?.dob) {
      const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(opts.dob);
      if (m) {
        const birthYear = Number(m[3]);
        const expectedYY = birthYear % 100;
        if (expectedYY !== yearTwoDigits) return false;

        // Century-gender mapping per Vietnamese CCCD spec:
        // 0/1 → 1900s, 2/3 → 2000s, 4/5 → 2100s, 6/7 → 2200s, 8/9 → 2300s
        // even = male, odd = female
        const century = Math.floor(birthYear / 100); // 19, 20, 21…
        const allowedDigits: number[] = [];
        const base = (century - 19) * 2;
        if (opts.gender === "Nam") allowedDigits.push(base);
        else if (opts.gender === "Nữ") allowedDigits.push(base + 1);
        else allowedDigits.push(base, base + 1);
        if (!allowedDigits.includes(genderCenturyDigit)) return false;
      }
    }
    return true;
  };

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
      const uploadFn = slot === 'avatar' || slot === 'home' ? uploadImageToWalrus : uploadImageToCloudinary;
      const blob = await uploadFn(uri);

      switch (slot) {
        case "avatar":
          setAvatarBlobId(blob.blobId);
          // setAvatarBase64(blob.base64);
          setAvatarPreview(uri);
          break;
        case "birthCertificate":
          setBirthCertBlobId(blob.blobId);
          // setBirthCertBase64(blob.base64);
          setBirthCertPreview(uri);
          try {
            const info = await extractChildInfo(blob.url);
            if (!info) break;
            console.log("Extracted child info from OCR:", info);
            if (info.first_name) setFirstName(info.first_name);
            if (info.last_name) setLastName(info.last_name);
            if (info.identity_code) setIdentityCode(info.identity_code);
            if (info.home_address) setHomeAddress(info.home_address);
            if (info.date_of_birth) setDateOfBirth(info.date_of_birth);
            if (info.gender) {
              const g = info.gender.trim().toLowerCase();
              if (g === "male" || g === "nam") setGender("Male");
              else if (g === "female" || g === "nữ" || g === "nu")
                setGender("Female");
            }
          } catch {
            // OCR is best-effort — silently ignore failures
          }
          break;
        case "home":
          setHomeBlobId(blob.blobId);
          // setHomeBase64(blob.base64);
          setHomePreview(uri);
          break;
        case "firstGuardianId":
          setFirstGuardian((g) => ({
            ...g,
            idCardBlobId: blob.blobId,
            // idCardBase64: blob.base64,
            idCardPreview: uri,
          }));
          try {
            const info = await extractChildInfo(blob.url, "firstGuardianId");
            if (info?.first_guardian_full_name)
              setFirstGuardian((g) => ({ ...g, fullName: info.first_guardian_full_name! }));
            if (info?.first_guardian_phone_number)
              setFirstGuardian((g) => ({ ...g, phoneNumber: info.first_guardian_phone_number! }));
            if (info?.first_guardian_relation)
              setFirstGuardian((g) => ({ ...g, relation: info.first_guardian_relation! }));
          } catch {
            // OCR is best-effort — silently ignore failures
          }
          break;
        case "secondGuardianId":
          setSecondGuardian((g) => ({
            ...g,
            idCardBlobId: blob.blobId,
            // idCardBase64: blob.base64,
            idCardPreview: uri,
          }));
          try {
            const info = await extractChildInfo(blob.url, "secondGuardianId");
            if (info?.second_guardian_full_name)
              setSecondGuardian((g) => ({ ...g, fullName: info.second_guardian_full_name! }));
            if (info?.second_guardian_phone_number)
              setSecondGuardian((g) => ({ ...g, phoneNumber: info.second_guardian_phone_number! }));
            if (info?.second_guardian_relation)
              setSecondGuardian((g) => ({ ...g, relation: info.second_guardian_relation! }));
          } catch {
            // OCR is best-effort — silently ignore failures
          }
          break;
      }
    } catch (e: any) {
      modal.error(
        "Lỗi",
        e?.message || "Không thể tải ảnh lên. Vui lòng thử lại.",
      );
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
    isValidVietnamCCCD(identityCode.trim(), { dob: dateOfBirth, gender }) &&
    homeAddress.trim().length > 0 &&
    region.trim().length > 0 &&
    isGuardianValid(firstGuardian) &&
    (!hasSecondGuardian || isGuardianValid(secondGuardian));

  const buildPayload = (): ChildUploadReqPayload => ({
    avatar_blob_id: avatarBlobId!,
    // avatar_base64: avatarBase64 ?? "",
    birth_certificate_blob_id: birthCertBlobId!,
    date_of_birth: dateOfBirth,
    first_guardian: {
      guardian_full_name: firstGuardian.fullName,
      guardian_phone_number: firstGuardian.phoneNumber,
      guardian_relation: firstGuardian.relation,
      identity_card_blob_id: firstGuardian.idCardBlobId!,
      // identity_card_base64: firstGuardian.idCardBase64 ?? "",
    },
    first_name: firstName,
    gender,
    home_address: homeAddress,
    home_blob_id: homeBlobId!,
    // home_base64: homeBase64 ?? "",
    identity_code: identityCode,
    last_name: lastName,
    region,
    ...(hasSecondGuardian && {
      second_guardian: {
        guardian_full_name: secondGuardian.fullName,
        guardian_phone_number: secondGuardian.phoneNumber,
        guardian_relation: secondGuardian.relation,
        identity_card_blob_id: secondGuardian.idCardBlobId!,
        // identity_card_base64: secondGuardian.idCardBase64 ?? "",
      },
    }),
  });

  const submit = async () => {
    if (!isFormValid) {
      modal.warning(
        "Thiếu thông tin",
        "Vui lòng điền đầy đủ các trường bắt buộc.",
      );
      return;
    }
    try {
      setIsSubmitting(true);
      console.log(buildPayload());
      await submitChildUploadRequest(buildPayload());
      navigation.replace("PaymentCallbackScreen", {
        status: "success",
        title: "Gửi yêu cầu thành công!",
        message: "Yêu cầu đăng ký trẻ em đã được gửi để xét duyệt.",
      });
    } catch (e: any) {
      modal.error(
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
                      guardian.relation === opt.value &&
                        styles.dropdownItemSelected,
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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
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
            Vui lòng điền đầy đủ thông tin và ảnh đính kèm. Yêu cầu sẽ được xét
            duyệt trước khi công khai.
          </Text>
        </View>

        {/* Section: Trẻ em */}
        <Text style={styles.sectionTitle}>Thông tin trẻ em</Text>

        {renderImageUpload(
          "avatar",
          "Ảnh đại diện",
          avatarBlobId,
          avatarPreview,
        )}

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
            <Text
              style={[styles.pickerText, !gender && styles.pickerPlaceholder]}
            >
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
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={openDatePicker}
          >
            <Text
              style={[
                styles.pickerText,
                !dateOfBirth && styles.pickerPlaceholder,
              ]}
            >
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
            onChangeText={(v) =>
              setIdentityCode(v.replace(/\D/g, "").slice(0, 12))
            }
            keyboardType="number-pad"
            maxLength={12}
          />
          {identityCode.length > 0 &&
            !isValidVietnamCCCD(identityCode.trim(), {
              dob: dateOfBirth,
              gender,
            }) && (
              <Text style={styles.cccdError}>
                {identityCode.length < 12
                  ? `Cần đủ 12 chữ số (còn ${12 - identityCode.length}).`
                  : "Mã định danh không hợp lệ. Kiểm tra mã tỉnh, năm sinh và giới tính."}
              </Text>
            )}
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
            <Text
              style={[styles.pickerText, !region && styles.pickerPlaceholder]}
            >
              {region ||
                (loadingRegions
                  ? "Đang tải khu vực…"
                  : "Chọn khu vực đã thành lập")}
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
            <View
              style={[
                styles.toggleKnob,
                hasSecondGuardian && styles.toggleKnobActive,
              ]}
            />
          </TouchableOpacity>
        </View>
        {hasSecondGuardian &&
          renderGuardianForm(
            secondGuardian,
            setSecondGuardian,
            "secondGuardianId",
            true,
          )}

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
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#1E40AF"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.regionNoticeText}>
                  Không tìm thấy khu vực của trẻ? Hãy đề xuất khu vực cần hỗ trợ
                  để được xét duyệt.
                </Text>
                <TouchableOpacity
                  style={styles.regionNoticeButton}
                  onPress={() => {
                    setShowRegionModal(false);
                    navigation.navigate("CreateSupportedRegion");
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.regionNoticeButtonText}>
                    Đề xuất khu vực
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {loadingRegions ? (
              <ActivityIndicator
                size="large"
                color="#1E40AF"
                style={{ padding: 32 }}
              />
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
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color="#1E40AF"
                    />
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
                {
                  data: dayOptions,
                  value: pickerDay,
                  set: setPickerDay,
                  label: "Ngày",
                  fmt: pad2,
                },
                {
                  data: monthOptions,
                  value: pickerMonth,
                  set: setPickerMonth,
                  label: "Tháng",
                  fmt: pad2,
                },
                {
                  data: yearOptions,
                  value: pickerYear,
                  set: setPickerYear,
                  label: "Năm",
                  fmt: (n: number) => `${n}`,
                },
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
              <TouchableOpacity
                style={styles.dateConfirm}
                onPress={confirmDate}
              >
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
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E40AF",
    marginBottom: 6,
  },
  introText: { fontSize: 15, color: "#1E40AF", lineHeight: 22 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 14,
  },

  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "700", color: "#111827", marginBottom: 8 },
  requiredStar: { color: "#DC2626", fontWeight: "700" },
  cccdError: { fontSize: 14, color: "#DC2626", marginTop: 6, lineHeight: 20 },

  row: { flexDirection: "row", gap: 12 },

  input: {
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 14,
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
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  pickerText: { fontSize: 16, color: "#111827", fontWeight: "500" },
  pickerPlaceholder: { color: "#9CA3AF", fontWeight: "400" },

  dropdown: {
    marginTop: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dropdownItemSelected: { backgroundColor: "#EFF6FF" },
  dropdownItemText: { fontSize: 16, fontWeight: "500", color: "#374151" },
  dropdownItemTextSelected: { color: "#1E40AF", fontWeight: "700" },

  imageUpload: {
    borderWidth: 1,
    borderColor: "#DBEAFE",
    borderStyle: "dashed",
    borderRadius: 14,
    backgroundColor: "#F8FAFF",
    minHeight: 130,
    overflow: "hidden",
  },
  uploadCenter: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 8,
  },
  uploadHint: { fontSize: 15, color: "#4B5563" },
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
  optionalHint: { fontSize: 14, color: "#6B7280", marginTop: -6 },
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
    gap: 10,
    backgroundColor: "#1E40AF",
    height: 56,
    borderRadius: 16,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 14,
  },
  regionSheet: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    maxHeight: "80%",
  },
  regionSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  regionSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 14,
  },
  regionSearchInput: { flex: 1, fontSize: 16, color: "#111827" },
  regionNoticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    padding: 14,
    marginBottom: 14,
  },
  regionNoticeText: {
    fontSize: 14,
    color: "#1E40AF",
    lineHeight: 21,
    marginBottom: 10,
  },
  regionNoticeButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    backgroundColor: "#1E40AF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  regionNoticeButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
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
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRadius: 12,
  },
  regionItemSelected: { backgroundColor: "#EFF6FF" },
  regionItemText: { fontSize: 16, color: "#374151", fontWeight: "500" },
  regionItemTextSelected: { color: "#1E40AF", fontWeight: "700" },
  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 15,
    paddingVertical: 28,
  },
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
    borderRadius: 20,
    padding: 20,
  },
  dateColumns: { flexDirection: "row", height: 240, gap: 8 },
  dateColumn: { flex: 1 },
  dateColumnLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4B5563",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textAlign: "center",
    marginBottom: 10,
  },
  dateOption: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 4,
  },
  dateOptionSelected: { backgroundColor: "#1E40AF" },
  dateOptionText: { fontSize: 16, color: "#374151", fontWeight: "500" },
  dateOptionTextSelected: { color: "#FFFFFF", fontWeight: "700" },
  dateActions: { flexDirection: "row", gap: 12, marginTop: 20 },
  dateCancel: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  dateCancelText: { color: "#4B5563", fontWeight: "700", fontSize: 16 },
  dateConfirm: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    backgroundColor: "#1E40AF",
    alignItems: "center",
    justifyContent: "center",
  },
  dateConfirmText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },
});

export default ChildUploadReqScreen;
