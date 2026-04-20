import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/MainNavigator';
import {
  getSupportedRegionSuggestions,
  SupportedRegionSuggestion,
} from '../../services/registration.service';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap }> = {
  pending:  { label: 'Needs Support', bg: '#FFF7ED', color: '#EA580C', icon: 'time-outline' },
  approved: { label: 'Active',        bg: '#EFF6FF', color: '#1E40AF', icon: 'checkmark-circle-outline' },
  rejected: { label: 'Closed',        bg: '#FEE2E2', color: '#DC2626', icon: 'close-circle-outline' },
};

const getStatusConfig = (status: string) =>
  STATUS_CONFIG[status.toLowerCase()] ?? STATUS_CONFIG['pending'];

const SupportedRegionsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [suggestions, setSuggestions] = useState<SupportedRegionSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await getSupportedRegionSuggestions();
      setSuggestions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load regions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(true);
  }, []);

  const handleRegister = (region: string) => {
    navigation.navigate('RegistrationForm', { region });
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Regions Needing Support</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text style={styles.loadingText}>Loading regions…</Text>
        </View>
      </View>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Regions Needing Support</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={52} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData()}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Regions Needing Support</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E40AF" />}
      >
        {/* Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerIconContainer}>
            <Ionicons name="people" size={24} color="#1E40AF" />
          </View>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Join Your Community</Text>
            <Text style={styles.bannerSubtitle}>
              These regions need Volunteers and Local Leaders to support child welfare programs.
            </Text>
          </View>
        </View>

        {/* Role legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendChip}>
            <Ionicons name="shield-checkmark-outline" size={13} color="#1E40AF" />
            <Text style={styles.legendChipText}>Local Leader</Text>
          </View>
          <View style={styles.legendChip}>
            <Ionicons name="hand-left-outline" size={13} color="#1E40AF" />
            <Text style={styles.legendChipText}>Volunteer</Text>
          </View>
        </View>

        {/* Empty state */}
        {suggestions.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="map-outline" size={52} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No regions at the moment</Text>
            <Text style={styles.emptySubtitle}>Check back later for new opportunities.</Text>
          </View>
        )}

        {/* Region cards */}
        {suggestions.map((item) => {
          const sc = getStatusConfig(item.status);
          return (
            <View key={item.id} style={styles.card}>
              {/* Card header row */}
              <View style={styles.cardHeader}>
                <View style={styles.regionIconContainer}>
                  <Ionicons name="location" size={20} color="#1E40AF" />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.regionName}>{item.region}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                  <Ionicons name={sc.icon} size={11} color={sc.color} />
                  <Text style={[styles.statusBadgeText, { color: sc.color }]}>{sc.label}</Text>
                </View>
              </View>

              {/* Content */}
              <Text style={styles.contentText}>{item.content}</Text>

              {/* Roles needed row */}
              <View style={styles.rolesNeededRow}>
                <View style={styles.roleNeededChip}>
                  <Ionicons name="shield-checkmark-outline" size={12} color="#1E40AF" />
                  <Text style={styles.roleNeededText}>Local Leader</Text>
                </View>
                <View style={styles.roleNeededChip}>
                  <Ionicons name="hand-left-outline" size={12} color="#1E40AF" />
                  <Text style={styles.roleNeededText}>Volunteer</Text>
                </View>
              </View>

              {/* CTA */}
              <TouchableOpacity
                style={styles.registerButton}
                onPress={() => handleRegister(item.region)}
                activeOpacity={0.85}
              >
                <Text style={styles.registerButtonText}>Register for this Region</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },
  loadingText: { fontSize: 15, color: '#64748B', fontWeight: '500' },
  errorText: { fontSize: 15, color: '#DC2626', fontWeight: '600', textAlign: 'center' },
  retryBtn: {
    backgroundColor: '#1E40AF', paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: 10, marginTop: 4,
  },
  retryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 16,
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(226, 232, 240, 0.5)',
  },
  headerButton: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  scrollContent: { padding: 16 },
  bannerCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#DBEAFE', marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  bannerIconContainer: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  bannerTextContainer: { flex: 1 },
  bannerTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  bannerSubtitle: { fontSize: 13, color: '#6B7280', lineHeight: 19 },
  legendRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  legendChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#DBEAFE',
  },
  legendChipText: { fontSize: 12, fontWeight: '600', color: '#1E40AF' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  regionIconContainer: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cardHeaderText: { flex: 1 },
  regionName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  contentText: { fontSize: 13, color: '#4B5563', lineHeight: 20, marginBottom: 12 },
  rolesNeededRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  roleNeededChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F8FAFF', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: '#DBEAFE',
  },
  roleNeededText: { fontSize: 11, fontWeight: '600', color: '#1E40AF' },
  registerButton: {
    backgroundColor: '#1E40AF', height: 50, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#1E40AF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 3,
  },
  registerButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});

export default SupportedRegionsScreen;
