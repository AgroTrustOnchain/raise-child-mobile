// src/screens/profile/PersonalInformationScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { updateProfile } from '../../services/profile.service';
import { useAuth } from '../../hooks/useAuth';

// ─── Types ────────────────────────────────────────────────────────────────────

type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say' | '';

// ─── Component ────────────────────────────────────────────────────────────────

const PersonalInformationScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender>('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [identityCode, setIdentityCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Unique ID is read-only / blockchain-verified
  const uniqueId = 'AT-882910-B7';

  const genderOptions: Gender[] = ['Male', 'Female', 'Other', 'Prefer not to say'];
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  const handleSave = async () => {
  if (!firstName.trim() || !lastName.trim()) {
    Alert.alert('Error', 'Please enter your first and last name');
    return;
  }

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
    console.log(payload)

    await updateProfile(user ? user?.id : null, payload);

    Alert.alert('Success', 'Your profile has been updated.');
  } catch (err: any) {
    console.error(err);
    Alert.alert('Failed', err?.response?.data?.message || 'Please try again');
  } finally {
    setIsSaving(false);
  }
};

  const handleChangePhoto = () => {
    Alert.alert('Change Photo', 'Photo upload will be implemented');
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
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John"
                placeholderTextColor="#9CA3AF"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Doe"
                placeholderTextColor="#9CA3AF"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Gender — custom picker */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Gender</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowGenderPicker(prev => !prev)}
              activeOpacity={0.8}
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
            <Text style={styles.label}>Date of Birth</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { paddingRight: 48 }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                keyboardType="numbers-and-punctuation"
              />
              <Ionicons name="calendar-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
            </View>
          </View>

          {/* ── Contact Details ──────────────────────────────────────────── */}
          <View style={styles.sectionDivider}>
            <Text style={styles.sectionLabel}>Contact Details</Text>
          </View>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneRow}>
              <View style={styles.countryCodeBox}>
                <Text style={styles.countryCodeText}>+1</Text>
                <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
              </View>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="(555) 000-0000"
                placeholderTextColor="#9CA3AF"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { paddingRight: 48 }]}
                placeholder="john.doe@example.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Ionicons name="checkmark-circle" size={20} color="#1E40AF" style={styles.inputIcon} />
            </View>
          </View>

          {/* Identity Code */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Identity Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your identity code"
              placeholderTextColor="#9CA3AF"
              value={identityCode}
              onChangeText={setIdentityCode}
              autoCapitalize="none"
            />
          </View>

        </View>

        {/* Footer spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Fixed Footer ──────────────────────────────────────────────────── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom || 16 }]}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving…' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </View>
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
});

export default PersonalInformationScreen;