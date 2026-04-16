import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<any>;

const VolunteerSettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [privateProfile, setPrivateProfile] = useState(false);

  const handleSwitchRole = () => {
    Alert.alert(
      'Switch to Donor',
      'Would you like to switch your account role from Volunteer to Donor? You can always switch back later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // API call to switch role would go here
              // await switchUserRole('donor');
              setTimeout(() => {
                setLoading(false);
                Alert.alert('Success', 'Your role has been switched to Donor. Restarting app...');
                // Navigate to donor screens
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'MainNavigator' }],
                });
              }, 1500);
            } catch (error) {
              setLoading(false);
              Alert.alert('Error', 'Failed to switch role. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // API call to logout would go here
              // await logout();
              setTimeout(() => {
                setLoading(false);
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'AuthNavigator' }],
                });
              }, 1000);
            } catch (error) {
              setLoading(false);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
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
          <Ionicons name={icon as any} size={20} color="#00288e" />
        </View>
        <View style={styles.settingItemText}>
          <Text style={styles.settingLabel}>{label}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || (onPress ? <MaterialIcons name="chevron-right" size={24} color="#cbd5e1" /> : null)}
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
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your volunteer account preferences</Text>
        </View>

        {/* Account Section */}
        <SettingSection title="Account">
          <SettingItem
            icon="person"
            label="Edit Profile"
            subtitle="Update your information"
            onPress={() => navigation.navigate('PersonalInformationScreen')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="lock"
            label="Change Password"
            subtitle="Update your security settings"
            onPress={() => {
              Alert.alert('Change Password', 'Password change feature coming soon');
            }}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="document-text"
            label="View Profile"
            subtitle="See your public volunteer profile"
            onPress={() => navigation.navigate('PersonalInformationScreen')}
          />
        </SettingSection>

        {/* Notifications Section */}
        <SettingSection title="Notifications">
          <SettingItem
            icon="notifications"
            label="Push Notifications"
            subtitle="Receive task and update alerts"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#cbd5e1', true: '#6366f1' }}
                thumbColor="#00288e"
              />
            }
          />
          <View style={styles.divider} />
          <SettingItem
            icon="mail"
            label="Email Updates"
            subtitle="Get weekly summary emails"
            rightElement={
              <Switch
                value={emailUpdates}
                onValueChange={setEmailUpdates}
                trackColor={{ false: '#cbd5e1', true: '#6366f1' }}
                thumbColor="#00288e"
              />
            }
          />
        </SettingSection>

        {/* Privacy Section */}
        <SettingSection title="Privacy">
          <SettingItem
            icon="shield"
            label="Private Profile"
            subtitle="Hide your profile from other users"
            rightElement={
              <Switch
                value={privateProfile}
                onValueChange={setPrivateProfile}
                trackColor={{ false: '#cbd5e1', true: '#6366f1' }}
                thumbColor="#00288e"
              />
            }
          />
          <View style={styles.divider} />
          <SettingItem
            icon="alert-circle"
            label="Data & Privacy"
            subtitle="View and manage your data"
            onPress={() => {
              Alert.alert('Data & Privacy', 'Privacy policy and data management coming soon');
            }}
          />
        </SettingSection>

        {/* Role Section */}
        <SettingSection title="Account Role">
          <View style={styles.roleSwitchContainer}>
            <View style={styles.roleInfo}>
              <Text style={styles.roleLabel}>Current Role</Text>
              <Text style={styles.roleBadge}>Volunteer</Text>
            </View>
            <TouchableOpacity
              style={[styles.switchRoleButton, loading && styles.switchRoleButtonDisabled]}
              onPress={handleSwitchRole}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <MaterialIcons name="swap-horiz" size={18} color="#fff" />
                  <Text style={styles.switchRoleButtonText}>Switch to Donor</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.roleSwitchInfo}>
            Donors can support children through direct financial contributions
          </Text>
        </SettingSection>

        {/* About Section */}
        <SettingSection title="About">
          <SettingItem
            icon="information-circle"
            label="App Version"
            subtitle="Version 1.0.0"
          />
          <View style={styles.divider} />
          <SettingItem
            icon="help-circle"
            label="Help & Support"
            subtitle="Get help and report issues"
            onPress={() => {
              Alert.alert('Help & Support', 'Support page coming soon');
            }}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="document"
            label="Terms & Conditions"
            subtitle="Review our terms of service"
            onPress={() => {
              Alert.alert('Terms & Conditions', 'Terms page coming soon');
            }}
          />
        </SettingSection>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={[styles.logoutButton, loading && styles.logoutButtonDisabled]}
            onPress={handleLogout}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#dc2626" size="small" />
            ) : (
              <>
                <MaterialIcons name="logout" size={18} color="#dc2626" />
                <Text style={styles.logoutButtonText}>Log Out</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#00288e',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
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
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingItemText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  settingSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9ca3af',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
  },
  roleSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
    marginBottom: 12,
  },
  roleInfo: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  roleBadge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00288e',
  },
  switchRoleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 12,
  },
  switchRoleButtonDisabled: {
    opacity: 0.6,
  },
  switchRoleButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  roleSwitchInfo: {
    fontSize: 12,
    color: '#6b7280',
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
    backgroundColor: '#fef2f2',
    borderWidth: 1.5,
    borderColor: '#fecaca',
    paddingVertical: 14,
    borderRadius: 12,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#dc2626',
  },
});

export default VolunteerSettingsScreen;
