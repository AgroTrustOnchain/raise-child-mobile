import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../store';
import { RootStackParamList } from '../../navigation/MainNavigator';
import { setRole } from '../../store/authSlice';
import { useModal } from '../../context/ModalContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp>();
  const { user, profile, allRoles } = useAppSelector((state) => state.auth);
  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() ||
    user?.name ||
    'N/A';
  const displayEmail = profile?.email || user?.email || 'N/A';

  const hasVolunteerRole = allRoles.some((r) => r.toLowerCase() === 'volunteer');
  const modal = useModal();

  const handleChangeRoleToVolunteer = async () => {
    modal.confirm(
      'Đổi vai trò',
      'Bạn có chắc muốn đổi vai trò thành Tình nguyện viên không?',
      () => dispatch(setRole('Volunteer')),
    );
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Cài đặt</Text>
        </View>

        {/* Current User Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tên:</Text>
              <Text style={styles.infoValue}>{displayName}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>

              <Text style={styles.infoValue}>{displayEmail}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Vai trò hiện tại:</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {user?.role?.[0]?.toUpperCase() || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Role Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quản lý vai trò</Text>
          <TouchableOpacity
            style={[
              styles.roleButton,
              !hasVolunteerRole && styles.roleButtonDisabled,
            ]}
            onPress={handleChangeRoleToVolunteer}
            disabled={!hasVolunteerRole}
            activeOpacity={0.7}
          >
            <Ionicons name="person-add" size={20} color="#fff" />
            <Text style={styles.roleButtonText}>
              Chuyển sang Tình nguyện viên
            </Text>
          </TouchableOpacity>

          {!hasVolunteerRole && (
            <View style={styles.infoMessage}>
              <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
              <Text style={styles.infoMessageText}>
                Tài khoản của bạn chưa có quyền Tình nguyện viên
              </Text>
            </View>
          )}
        </View>

        {/* Wallet */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài chính</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate("Wallet" as any)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="wallet" size={20} color="#1E40AF" />
              <Text style={styles.settingText}>Ví</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Registration Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thiết lập hồ sơ</Text>
          <TouchableOpacity
            style={styles.registrationButton}
            onPress={() => navigation.navigate("RegistrationForm" as any)}
            activeOpacity={0.7}
          >
            <View style={styles.registrationLeft}>
              <Ionicons name="document-text" size={20} color="#1E40AF" />
              <View>
                <Text style={styles.registrationTitle}>Mẫu đăng ký</Text>
                <Text style={styles.registrationSubtitle}>
                  Hoàn thiện hồ sơ của bạn
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.registrationButton, { marginTop: 8 }]}
            onPress={() => navigation.navigate("ChildUploadReq" as any)}
            activeOpacity={0.7}
          >
            <View style={styles.registrationLeft}>
              <Ionicons name="person-add" size={20} color="#1E40AF" />
              <View>
                <Text style={styles.registrationTitle}>Đăng ký trẻ em</Text>
                <Text style={styles.registrationSubtitle}>
                  Gửi yêu cầu thêm hồ sơ trẻ em mới
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Additional Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tùy chọn</Text>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={20} color="#1E40AF" />
              <Text style={styles.settingText}>Thông báo</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="lock-closed" size={20} color="#1E40AF" />
              <Text style={styles.settingText}>Quyền riêng tư & Bảo mật</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="help-circle" size={20} color="#1E40AF" />
              <Text style={styles.settingText}>Trợ giúp & Hỗ trợ</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  roleBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  roleButton: {
    backgroundColor: '#1E40AF',
    height: 64,
    borderRadius: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  roleButtonActive: {
    backgroundColor: '#F1F5F9',
    shadowOpacity: 0,
    elevation: 0,
  },
  roleButtonDisabled: {
    opacity: 0.6,
  },
  roleButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  roleButtonTextDisabled: {
    color: '#6B7280',
  },
  successMessage: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  infoMessage: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoMessageText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4B5563',
    flex: 1,
    lineHeight: 22,
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  registrationButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#1E40AF',
  },
  registrationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  registrationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  registrationSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default SettingsScreen;
