import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../store';
import { RootStackParamList } from '../../navigation/MainNavigator';
import { setRole } from '../../store/authSlice';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp>();
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const [isChangingRole, setIsChangingRole] = useState(false);

  const handleChangeRoleToVolunteer = async () => {
    Alert.alert(
      'Change Role',
      'Are you sure you want to change your role to Volunteer?',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setIsChangingRole(true);
              // Update the user role in the state
              dispatch(setRole('volunteer'));
              
              // Navigate to Volunteer screen
              setTimeout(() => {
                navigation.navigate('Volunteer');
                setIsChangingRole(false);
              }, 500);
            } catch (error) {
              Alert.alert('Error', 'Failed to change role. Please try again.');
              setIsChangingRole(false);
            }
          },
          style: 'destructive',
        },
      ]
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
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Current User Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{user?.name || 'N/A'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Current Role:</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {user?.role?.toUpperCase() || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Role Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Role Management</Text>
          <TouchableOpacity
            style={[
              styles.roleButton,
              user?.role === 'volunteer' && styles.roleButtonActive,
              isChangingRole && styles.roleButtonDisabled,
            ]}
            onPress={handleChangeRoleToVolunteer}
            disabled={isChangingRole || user?.role === 'volunteer'}
            activeOpacity={0.7}
          >
            {isChangingRole ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons
                  name="person-add"
                  size={20}
                  color={user?.role === 'volunteer' ? '#666' : '#fff'}
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    user?.role === 'volunteer' && styles.roleButtonTextDisabled,
                  ]}
                >
                  {user?.role === 'volunteer'
                    ? 'Already a Volunteer'
                    : 'Switch to Volunteer'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {user?.role === 'volunteer' && (
            <View style={styles.successMessage}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.successText}>
                You are currently in Volunteer mode
              </Text>
            </View>
          )}
        </View>

        {/* Registration Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Setup</Text>
          <TouchableOpacity 
            style={styles.registrationButton}
            onPress={() => navigation.navigate("RegistrationForm" as any)}
            activeOpacity={0.7}
          >
            <View style={styles.registrationLeft}>
              <Ionicons name="document-text" size={20} color="#13ec5b" />
              <View>
                <Text style={styles.registrationTitle}>Registration Form</Text>
                <Text style={styles.registrationSubtitle}>
                  Complete your profile setup
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Additional Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={20} color="#6366f1" />
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="lock-closed" size={20} color="#6366f1" />
              <Text style={styles.settingText}>Privacy & Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="help-circle" size={20} color="#6366f1" />
              <Text style={styles.settingText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  roleBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  roleButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  roleButtonActive: {
    backgroundColor: '#e5e7eb',
  },
  roleButtonDisabled: {
    opacity: 0.6,
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  roleButtonTextDisabled: {
    color: '#666',
  },
  successMessage: {
    backgroundColor: '#e6f9f0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  successText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10b981',
  },
  settingItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  registrationButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#13ec5b',
  },
  registrationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  registrationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  registrationSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
  },
});

export default SettingsScreen;
