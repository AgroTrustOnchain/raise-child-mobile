// src/screens/profile/PersonalInformationScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
  KeyboardAvoidingView,
  Modal,
  FlatList,
} from 'react-native';
import { useModal } from '../../context/ModalContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { updateProfile } from '../../services/profile.service';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useWallet } from '../../context/WalletContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say' | '';

// ─── Component ────────────────────────────────────────────────────────────────

const PersonalInformationScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { profile, refresh } = useProfile();
  const { wallet } = useWallet();
  const modal = useModal();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender>('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [identityCode, setIdentityCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const uniqueId = profile?.id || wallet?.sub || 'AT-882910-B7';

  useEffect(() => {
    if (!profile && wallet?.sub) {
      refresh(wallet.sub);
    }
  }, [profile, wallet?.sub]);

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.first_name || '');
    setLastName(profile.last_name || '');
    setGender((profile.gender as Gender) || '');
    setDateOfBirth(profile.date_of_birth || '');
    setPhoneNumber(profile.phone_number || '');
    setEmail(profile.email || '');
    setIdentityCode(profile.identity_code || '');
  }, [profile]);

  const genderOptions: Gender[] = ['Male', 'Female', 'Other', 'Prefer not to say'];
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  // Date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const today = new Date();
  const [pickerDay, setPickerDay] = useState(1);
  const [pickerMonth, setPickerMonth] = useState(1);
  const [pickerYear, setPickerYear] = useState(today.getFullYear() - 20);

  const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const daysInMonth = (m: number, y: number) => new Date(y, m, 0).getDate();
  const days = Array.from(
    { length: daysInMonth(pickerMonth, pickerYear) },
    (_, i) => i + 1,
  );
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => today.getFullYear() - i);

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

  // English picker values → values the CCCD validator understands
  const mapGenderForValidator = (g: Gender): string | undefined => {
    if (g === 'Male') return 'Nam';
    if (g === 'Female') return 'Nữ';
    return undefined;
  };

  // Vietnam citizen ID (CCCD) validator — same rules as ChildUploadReqScreen.
  // Format: 12 digits — 3-digit province code (001–096), 1 gender/century digit,
  // 2-digit birth year, 6 random digits. Cross-checks against DOB / gender when provided.
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

    if (opts?.dob) {
      const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(opts.dob);
      if (m) {
        const birthYear = Number(m[3]);
        const expectedYY = birthYear % 100;
        if (expectedYY !== yearTwoDigits) return false;

        const century = Math.floor(birthYear / 100);
        const base = (century - 19) * 2;
        const allowedDigits: number[] = [];
        if (opts.gender === 'Nam') allowedDigits.push(base);
        else if (opts.gender === 'Nữ') allowedDigits.push(base + 1);
        else allowedDigits.push(base, base + 1);
        if (!allowedDigits.includes(genderCenturyDigit)) return false;
      }
    }
    return true;
  };

  const cccdValid = isValidVietnamCCCD(identityCode.trim(), {
    dob: dateOfBirth,
    gender: mapGenderForValidator(gender),
  });
  const phoneValid = /^\d{10}$/.test(phoneNumber.trim());

  const isFormValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    gender !== '' &&
    dateOfBirth.trim().length > 0 &&
    phoneValid &&
    email.trim().length > 0 &&
    cccdValid;

  // Profile is "locked" (already filled) if the server already has every required field.
  // After the first successful update the profile cannot be edited again.
  const isProfileLocked = !!(
    profile &&
    profile.first_name &&
    profile.last_name &&
    profile.gender &&
    profile.date_of_birth &&
    profile.phone_number &&
    profile.email &&
    profile.identity_code
  );

  const submitProfile = async () => {
    try {
      setIsSaving(true);
      const payload = {
        first_name: firstName,
        last_name: lastName,
        gender,
        date_of_birth: dateOfBirth,
        phone_number: phoneNumber,
        email,
        identity_code: identityCode,
      };
      await updateProfile(user ? user?.id : null, payload);
      if (wallet?.sub) {
        refresh(wallet.sub);
      }
      modal.success('Success', 'Your profile has been updated.');
    } catch (err: any) {
      console.error(err);
      modal.error('Failed', err?.response?.data?.message || 'Please try again');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    if (isProfileLocked) {
      modal.alert(
        'Profile already set',
        'Your profile has already been submitted and cannot be changed.',
      );
      return;
    }
    if (!isFormValid) {
      modal.warning('Error', 'Please fill in all required fields');
      return;
    }
    modal.confirm(
      'Confirm submission',
      'You can only update your profile once. Please review your information carefully before submitting — this action cannot be undone.',
      submitProfile,
    );
  };

  const handleChangePhoto = () => {
    modal.alert('Change Photo', 'Photo upload will be implemented');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingBottom: insets.bottom, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      {/* <View style={[styles.header]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#1e40af" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Information</Text>
        <View style={styles.headerPlaceholder} />
      </View> */}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Avatar ──────────────────────────────────────────────────────── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYA8xwY0K0P-ZGy15yFGb97qKIj-aR-AVF79JFos4RElnlPrq-SJl4j9N4YcI5edZEzkv0fc58kamdNkBGfFPxRpH1Mowm1A5tTy5jYAsA8GV7x2y_PPNyB67iiqg705cc3wve4o5-WroUmx---gwucQvODzNgHv9wnRsMVMLH1XXXJCTUxaq3-Pe3LgEzeN7iGYQ8RRFoyXS_DzW0XhOnnjH1ecIctECbaH0J2s5zROvP1Zt7yf73tUpnt7NBVECsv8-VgHZne6pK' }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.cameraButton} onPress={handleChangePhoto} activeOpacity={0.85}>
              <Ionicons name="camera" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarTitle}>Upload Photo</Text>
          <Text style={styles.avatarSubtitle}>Update your profile picture on the ledger</Text>
        </View>

        {/* ── Fields ──────────────────────────────────────────────────────── */}
        <View style={styles.form}>

          {/* One-time-update warning */}
          {!isProfileLocked ? (
            <View style={styles.warningBanner}>
              <Ionicons name="warning" size={18} color="#B45309" />
              <Text style={styles.warningText}>
                You can only update your profile once. Please review your information carefully before submitting.
              </Text>
            </View>
          ) : (
            <View style={styles.lockedBanner}>
              <Ionicons name="lock-closed" size={18} color="#1E40AF" />
              <Text style={styles.lockedText}>
                Your profile has already been submitted and cannot be edited.
              </Text>
            </View>
          )}

          {/* Unique ID — read only */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Unique Identifier</Text>
            <View style={styles.readonlyWrapper}>
              <Text style={styles.readonlyText}>{uniqueId}</Text>
              <Ionicons name="lock-closed" size={18} color="#9CA3AF" />
            </View>
            <Text style={styles.verifiedCaption}>Blockchain Verified ID</Text>
          </View>

          {/* First / Last Name */}
          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>
                First Name <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="John"
                placeholderTextColor="#9CA3AF"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                editable={!isProfileLocked}
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>
                Last Name <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Doe"
                placeholderTextColor="#9CA3AF"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                editable={!isProfileLocked}
              />
            </View>
          </View>

          {/* Gender — custom picker */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Gender <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowGenderPicker(prev => !prev)}
              activeOpacity={0.8}
              disabled={isProfileLocked}
            >
              <Text style={[styles.pickerText, !gender && styles.pickerPlaceholder]}>
                {gender || 'Select Gender'}
              </Text>
              <Ionicons
                name={showGenderPicker ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#9CA3AF"
              />
            </TouchableOpacity>
            {showGenderPicker && (
              <View style={styles.dropdownMenu}>
                {genderOptions.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.dropdownItem,
                      gender === option && styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setGender(option);
                      setShowGenderPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        gender === option && styles.dropdownItemTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                    {gender === option && (
                      <Ionicons name="checkmark" size={16} color="#1E40AF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Date of Birth */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Date of Birth <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={openDatePicker}
              activeOpacity={0.8}
              disabled={isProfileLocked}
            >
              <Text style={[styles.pickerText, !dateOfBirth && styles.pickerPlaceholder]}>
                {dateOfBirth || 'DD/MM/YYYY'}
              </Text>
              <Ionicons name="calendar-outline" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* ── Contact Details ──────────────────────────────────────────── */}
          <View style={styles.sectionDivider}>
            <Text style={styles.sectionLabel}>Contact Details</Text>
          </View>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Phone Number <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.phoneRow}>
              {/* <View style={styles.countryCodeBox}>
                <Text style={styles.countryCodeText}>+1</Text>
                <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
              </View> */}
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="0901234567"
                placeholderTextColor="#9CA3AF"
                value={phoneNumber}
                onChangeText={(v) => setPhoneNumber(v.replace(/\D/g, '').slice(0, 10))}
                keyboardType="phone-pad"
                maxLength={10}
                editable={!isProfileLocked}
              />
            </View>
            {phoneNumber.length > 0 && !phoneValid && (
              <Text style={styles.cccdError}>Số điện thoại phải đủ 10 chữ số.</Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Email Address <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { paddingRight: 48 }]}
                placeholder="john.doe@example.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isProfileLocked}
              />
              <Ionicons name="checkmark-circle" size={20} color="#1E40AF" style={styles.inputIcon} />
            </View>
          </View>

          {/* Identity Code */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Identity Code <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="123456789012"
              placeholderTextColor="#9CA3AF"
              value={identityCode}
              onChangeText={(v) => setIdentityCode(v.replace(/\D/g, '').slice(0, 12))}
              keyboardType="number-pad"
              maxLength={12}
              autoCapitalize="none"
              editable={!isProfileLocked}
            />
            {identityCode.length > 0 && !cccdValid && (
              <Text style={styles.cccdError}>
                {identityCode.length < 12
                  ? `Cần đủ 12 chữ số (còn ${12 - identityCode.length}).`
                  : 'Mã định danh không hợp lệ. Kiểm tra mã tỉnh, năm sinh và giới tính.'}
              </Text>
            )}
          </View>

        </View>

        {/* Footer spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Fixed Footer ──────────────────────────────────────────────────── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom || 16 }]}>
        <View style={styles.footerRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (isSaving || !isFormValid || isProfileLocked) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={isSaving || !isFormValid || isProfileLocked}
            activeOpacity={0.85}
          >
            <Text style={styles.saveButtonText}>
              {isProfileLocked ? 'Already Submitted' : isSaving ? 'Saving…' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Date Picker Modal ────────────────────────────────────────────── */}
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
            <Text style={styles.dateModalTitle}>Select Date of Birth</Text>
            <View style={styles.dateColumns}>
              <View style={styles.dateColumn}>
                <Text style={styles.dateColumnLabel}>Day</Text>
                <FlatList
                  data={days}
                  keyExtractor={(item) => `d-${item}`}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.dateOption,
                        pickerDay === item && styles.dateOptionSelected,
                      ]}
                      onPress={() => setPickerDay(item)}
                    >
                      <Text
                        style={[
                          styles.dateOptionText,
                          pickerDay === item && styles.dateOptionTextSelected,
                        ]}
                      >
                        {pad2(item)}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
              <View style={styles.dateColumn}>
                <Text style={styles.dateColumnLabel}>Month</Text>
                <FlatList
                  data={months}
                  keyExtractor={(item) => `m-${item}`}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.dateOption,
                        pickerMonth === item && styles.dateOptionSelected,
                      ]}
                      onPress={() => setPickerMonth(item)}
                    >
                      <Text
                        style={[
                          styles.dateOptionText,
                          pickerMonth === item && styles.dateOptionTextSelected,
                        ]}
                      >
                        {pad2(item)}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
              <View style={styles.dateColumn}>
                <Text style={styles.dateColumnLabel}>Year</Text>
                <FlatList
                  data={years}
                  keyExtractor={(item) => `y-${item}`}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.dateOption,
                        pickerYear === item && styles.dateOptionSelected,
                      ]}
                      onPress={() => setPickerYear(item)}
                    >
                      <Text
                        style={[
                          styles.dateOptionText,
                          pickerYear === item && styles.dateOptionTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
            <View style={styles.dateModalActions}>
              <TouchableOpacity
                style={styles.dateCancelButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.dateCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateConfirmButton}
                onPress={confirmDate}
              >
                <Text style={styles.dateConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerPlaceholder: {
    width: 40,
  },

  // Scroll
  scrollContent: {
    paddingBottom: 0,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  avatarWrapper: {
    position: 'relative',
    width: 112,
    height: 112,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E40AF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#F8FAFC',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  avatarSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },

  // Form
  form: {
    paddingHorizontal: 20,
    gap: 4,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  requiredStar: {
    color: '#DC2626',
    fontWeight: '700',
  },
  cccdError: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 6,
    lineHeight: 16,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600',
    lineHeight: 18,
  },
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  lockedText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '600',
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },

  // Read-only
  readonlyWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'space-between',
  },
  readonlyText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  verifiedCaption: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '700',
    color: '#1E40AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 2,
  },

  // Input
  input: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#F8FAFF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    fontSize: 15,
    color: '#111827',
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    right: 16,
  },

  // Gender picker
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#F8FAFF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  pickerText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  pickerPlaceholder: {
    color: '#9CA3AF',
    fontWeight: '400',
  },
  dropdownMenu: {
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  dropdownItemTextSelected: {
    color: '#1E40AF',
    fontWeight: '700',
  },

  // Phone
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 52,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },

  // Section divider
  sectionDivider: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 20,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#1E40AF',
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 17,
    fontWeight: '700',
  },

  // Date picker modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dateModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  dateModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  dateColumns: {
    flexDirection: 'row',
    height: 220,
    gap: 8,
  },
  dateColumn: {
    flex: 1,
  },
  dateColumnLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 8,
  },
  dateOption: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 4,
  },
  dateOptionSelected: {
    backgroundColor: '#1E40AF',
  },
  dateOptionText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  dateOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dateModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  dateCancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCancelText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '700',
  },
  dateConfirmButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#1E40AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default PersonalInformationScreen;