import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { logout, setRole } from '../../store/authSlice';
import { useModal } from '../../context/ModalContext';

type NavigationProp = NativeStackNavigationProp<any>;

const VolunteerSettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const allRoles = useSelector((state: RootState) => state.auth.allRoles);
  const hasDonorRole = allRoles.some((r) => r.toLowerCase() === 'user');
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [privateProfile, setPrivateProfile] = useState(false);
  const modal = useModal();

  const handleSwitchRole = () => {
    modal.confirm(
      'Chuyển sang người dùng',
      'Bạn có muốn chuyển vai trò tài khoản từ Tình nguyện viên sang Người dùng không? Bạn có thể chuyển lại bất cứ lúc nào.',
      () => dispatch(setRole('User')),
    );
  };

  const handleLogout = () => {
    modal.confirm(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất không?',
      () => dispatch(logout()),
    );
  };

  const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  const SettingItem = ({
    icon,
    label,
    subtitle,
    onPress,
    rightElement,
  }: {
    icon: string;
    label: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress && !rightElement}
      activeOpacity={onPress || rightElement ? 0.6 : 1}
    >
      <View style={styles.settingItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={20} color="#1E40AF" />
        </View>
        <View style={styles.settingItemText}>
          <Text style={styles.settingLabel}>{label}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || (onPress ? <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" /> : null)}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Cài đặt</Text>
          <Text style={styles.subtitle}>Quản lý tùy chọn tài khoản tình nguyện viên</Text>
        </View>

        {/* Account Section */}
        <SettingSection title="Tài khoản">
          <SettingItem
            icon="person"
            label="Chỉnh sửa hồ sơ"
            subtitle="Cập nhật thông tin của bạn"
            onPress={() => navigation.navigate('PersonalInformationScreen')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="lock"
            label="Đổi mật khẩu"
            subtitle="Cập nhật cài đặt bảo mật"
            onPress={() => modal.alert('Đổi mật khẩu', 'Tính năng đổi mật khẩu sắp ra mắt')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="document-text"
            label="Xem hồ sơ"
            subtitle="Xem hồ sơ tình nguyện viên của bạn"
            onPress={() => navigation.navigate('PersonalInformationScreen')}
          />
        </SettingSection>

        {/* Notifications Section */}
        <SettingSection title="Thông báo">
          <SettingItem
            icon="notifications"
            label="Thông báo đẩy"
            subtitle="Nhận cảnh báo về nhiệm vụ và cập nhật"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#E5E7EB', true: '#1E40AF' }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <View style={styles.divider} />
          <SettingItem
            icon="mail"
            label="Cập nhật qua email"
            subtitle="Nhận email tóm tắt hàng tuần"
            rightElement={
              <Switch
                value={emailUpdates}
                onValueChange={setEmailUpdates}
                trackColor={{ false: '#E5E7EB', true: '#1E40AF' }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </SettingSection>

        {/* Privacy Section */}
        <SettingSection title="Quyền riêng tư">
          <SettingItem
            icon="shield"
            label="Hồ sơ riêng tư"
            subtitle="Ẩn hồ sơ của bạn khỏi người dùng khác"
            rightElement={
              <Switch
                value={privateProfile}
                onValueChange={setPrivateProfile}
                trackColor={{ false: '#E5E7EB', true: '#1E40AF' }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <View style={styles.divider} />
          <SettingItem
            icon="alert-circle"
            label="Dữ liệu & Quyền riêng tư"
            subtitle="Xem và quản lý dữ liệu của bạn"
            onPress={() => modal.alert('Dữ liệu & Quyền riêng tư', 'Chính sách quyền riêng tư sắp ra mắt')}
          />
        </SettingSection>

        {/* Role Section */}
        <SettingSection title="Vai trò tài khoản">
          <View style={styles.roleSwitchContainer}>
            <View style={styles.roleInfo}>
              <Text style={styles.roleLabel}>Vai trò hiện tại</Text>
              <Text style={styles.roleBadge}>Tình nguyện viên</Text>
            </View>
            <TouchableOpacity
              style={[styles.switchRoleButton, !hasDonorRole && styles.switchRoleButtonDisabled]}
              onPress={handleSwitchRole}
              // disabled={!hasDonorRole}
            >
              <MaterialIcons name="swap-horiz" size={18} color="#fff" />
              <Text style={styles.switchRoleButtonText}>Chuyển sang người dùng</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.roleSwitchInfo}>
            Nhà tài trợ có thể hỗ trợ trẻ em thông qua đóng góp tài chính trực tiếp
          </Text>
        </SettingSection>

        {/* About Section */}
        <SettingSection title="Thông tin">
          <SettingItem
            icon="information-circle"
            label="Phiên bản ứng dụng"
            subtitle="Phiên bản 1.0.0"
          />
          <View style={styles.divider} />
          <SettingItem
            icon="help-circle"
            label="Trợ giúp & Hỗ trợ"
            subtitle="Nhận trợ giúp và báo cáo sự cố"
            onPress={() => modal.alert('Trợ giúp & Hỗ trợ', 'Trang hỗ trợ sắp ra mắt')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="document"
            label="Điều khoản & Điều kiện"
            subtitle="Xem điều khoản dịch vụ của chúng tôi"
            onPress={() => modal.alert('Điều khoản & Điều kiện', 'Trang điều khoản sắp ra mắt')}
          />
        </SettingSection>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={18} color="#DC2626" />
            <Text style={styles.logoutButtonText}>Đăng xuất</Text>
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
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingItemText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  settingSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },
  roleSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 12,
  },
  roleInfo: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  roleBadge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
  },
  switchRoleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E40AF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginLeft: 12,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  switchRoleButtonDisabled: {
    opacity: 0.6,
  },
  switchRoleButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  roleSwitchInfo: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  logoutContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    paddingVertical: 14,
    borderRadius: 12,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
});

export default VolunteerSettingsScreen;
