import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getChildById } from '../../services/child.service';
import { getMealNeedProof, MealNeedProof } from '../../services/sponsorship.service';
import WalrusImage from '../../components/WalrusImage';

const formatDate = (raw: string): string => {
  if (!raw) return '';
  // Already in dd/MM/yyyy format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatPeriod = (raw: string): string => {
  if (!raw) return '';
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return raw;
  // Period values come back as epoch milliseconds
  const d = new Date(n);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const ProofScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { childId, hideValue } = (route.params ?? {}) as { childId?: string; hideValue?: boolean };

  const [childName, setChildName] = useState('');
  const [proof, setProof] = useState<MealNeedProof | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!childId) {
      setError('Không có ID trẻ em.');
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const child = await getChildById(childId);
        const name = `${child.first_name || ''} ${child.last_name || ''}`.trim();
        setChildName(name);

        if (!child.meal_need) {
          setError('Trẻ em này chưa có thông tin bữa ăn.');
          return;
        }
        const proofData = await getMealNeedProof(child.meal_need);
        setProof(proofData);
      } catch (e) {
        setError('Không thể tải dữ liệu. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [childId]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bằng chứng hỗ trợ</Text>
          <View style={styles.headerButton} />
        </View>
        <ActivityIndicator size="large" color="#1E40AF" style={{ marginTop: 60 }} />
      </View>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !proof) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bằng chứng hỗ trợ</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={56} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>{error ?? 'Chưa có dữ liệu'}</Text>
        </View>
      </View>
    );
  }

  // ── Build timeline entries from 1-to-1 mapping of dates ↔ images ────────────
  const entries = (proof.provide_dates ?? []).map((date, i) => ({
    date,
    imageId: proof.provide_image_blob_ids?.[i] ?? null,
    period: proof.provide_periods?.[i] ?? null,
    staff: proof.provide_staffs?.[i] ?? null,
  }));

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {childName || 'Bằng chứng hỗ trợ'}
        </Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{proof.total_supported_months}</Text>
              <Text style={styles.summaryLabel}>Tháng hỗ trợ</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{entries.length}</Text>
              <Text style={styles.summaryLabel}>Bữa ăn đã cung cấp</Text>
            </View>
            {!hideValue && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {proof.value > 0 ? proof.value.toLocaleString('vi-VN') : '—'}
                  </Text>
                  <Text style={styles.summaryLabel}>Giá trị (đ)</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Donation durations */}
        {proof.durations && proof.durations.length > 0 && (
          <View style={styles.durationsCard}>
            <View style={styles.durationsHeader}>
              <Ionicons name="calendar-outline" size={16} color="#1E40AF" />
              <Text style={styles.durationsTitle}>Khoảng thời gian được tài trợ</Text>
            </View>
            {proof.durations.map((d, i) => (
              <View key={i} style={styles.durationRow}>
                <View style={styles.durationDot} />
                <Text style={styles.durationText}>
                  {formatDate(d.start_period)} → {formatDate(d.end_period)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Section title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Lịch sử bữa ăn</Text>
          <Text style={styles.subtitle}>
            Mỗi mục là một bằng chứng đã được xác minh trên blockchain.
          </Text>
        </View>

        {/* Timeline */}
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Chưa có bữa ăn nào được ghi nhận</Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            <View style={styles.timelineLine} />
            {entries.map((entry, index) => {
              const isFirst = index === 0;
              return (
                <View key={index} style={styles.timelineItem}>
                  <View style={styles.dateHeader}>
                    <View style={[styles.timelineDot, isFirst && styles.timelineDotActive]} />
                    <Text style={[styles.dateText, isFirst && styles.dateTextActive]}>
                      {formatDate(entry.date)}
                    </Text>
                    {!!entry.period && (
                      <View style={styles.periodBadge}>
                        <Text style={styles.periodText}>{formatPeriod(entry.period)}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.eventCard}>
                    {/* Image */}
                    <View style={styles.eventImageContainer}>
                      {entry.imageId ? (
                        <WalrusImage
                          blobId={entry.imageId}
                          style={styles.eventImage}
                          resizeMode="cover"
                          fallbackIconSize={36}
                        />
                      ) : (
                        <View style={[styles.eventImage, styles.imagePlaceholder]}>
                          <Ionicons name="image-outline" size={36} color="#BFDBFE" />
                          <Text style={styles.imagePlaceholderText}>Chưa có ảnh</Text>
                        </View>
                      )}
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="shield-checkmark" size={12} color="#1E40AF" />
                        <Text style={styles.verifiedText}>ĐÃ XÁC MINH</Text>
                      </View>
                    </View>

                    {/* Content */}
                    <View style={styles.eventContent}>
                      <Text style={styles.eventTitle}>Bữa ăn ngày {formatDate(entry.date)}</Text>

                      {!!entry.staff && (
                        <View style={styles.infoRow}>
                          <Ionicons name="person-outline" size={13} color="#6B7280" />
                          <Text style={styles.infoText} numberOfLines={1}>
                            {entry.staff.length > 20
                              ? `${entry.staff.slice(0, 10)}…${entry.staff.slice(-6)}`
                              : entry.staff}
                          </Text>
                        </View>
                      )}

                      <View style={styles.eventFooter}>
                        <View style={styles.walletInfo}>
                          <Ionicons name="cube-outline" size={13} color="#1E40AF" />
                          <Text style={styles.walletAddress} numberOfLines={1}>
                            {proof.id.slice(0, 10)}…{proof.id.slice(-6)}
                          </Text>
                        </View>
                        <View style={styles.verifiedChip}>
                          <Ionicons name="checkmark-circle" size={12} color="#059669" />
                          <Text style={styles.verifiedChipText}>On-chain</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomInfo}>
          <Ionicons name="shield-checkmark" size={16} color="#1E40AF" />
          <Text style={styles.protocolText}>XÁC MINH BỞI AGROTRUST PROTOCOL</Text>
        </View>
        <Text style={styles.needIdText} numberOfLines={1}>
          Need ID: {proof.id.slice(0, 16)}…
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
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
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827', flex: 1, textAlign: 'center' },

  scrollView: { flex: 1 },

  summaryCard: {
    margin: 16,
    backgroundColor: '#1E40AF',
    borderRadius: 20,
    padding: 20,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  summaryLabel: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  summaryDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.2)' },

  durationsCard: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#DBEAFE',
  },
  durationsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  durationsTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  durationDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#1E40AF',
  },
  durationText: { fontSize: 13, color: '#374151', fontWeight: '500' },

  titleSection: { paddingHorizontal: 16, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 4, lineHeight: 18 },

  timeline: { position: 'relative', paddingHorizontal: 16, paddingBottom: 24 },
  timelineLine: {
    position: 'absolute', left: 36, top: 0, bottom: 0, width: 2, backgroundColor: '#DBEAFE',
  },
  timelineItem: { position: 'relative', marginBottom: 28 },
  dateHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, marginLeft: 4,
  },
  timelineDot: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: '#DBEAFE',
    borderWidth: 2, borderColor: '#F8FAFC',
  },
  timelineDotActive: {
    backgroundColor: '#1E40AF',
    shadowColor: '#1E40AF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4,
    shadowRadius: 6, elevation: 4,
  },
  dateText: {
    fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1,
  },
  dateTextActive: { color: '#1E40AF' },
  periodBadge: {
    backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 8, borderWidth: 1, borderColor: '#DBEAFE',
  },
  periodText: { fontSize: 10, fontWeight: '600', color: '#1E40AF' },

  eventCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  eventImageContainer: { width: '100%', aspectRatio: 16 / 9, position: 'relative' },
  eventImage: { width: '100%', height: '100%' },
  imagePlaceholder: {
    backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  imagePlaceholderText: { fontSize: 12, color: '#93C5FD' },
  verifiedBadge: {
    position: 'absolute', top: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 16, borderWidth: 1, borderColor: '#DBEAFE',
  },
  verifiedText: { fontSize: 9, fontWeight: '700', color: '#1E40AF', letterSpacing: 0.5 },

  eventContent: { padding: 14, gap: 8 },
  eventTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 12, color: '#6B7280', flex: 1 },

  eventFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  walletInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  walletAddress: { fontSize: 10, color: '#9CA3AF', fontVariant: ['tabular-nums'], flex: 1 },
  verifiedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1, borderColor: '#BBF7D0',
  },
  verifiedChipText: { fontSize: 10, fontWeight: '700', color: '#059669' },

  emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#6B7280', textAlign: 'center' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(248,250,252,0.97)',
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20,
    alignItems: 'center', gap: 4,
  },
  bottomInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  protocolText: {
    fontSize: 10, fontWeight: '700', color: '#1E40AF', letterSpacing: 1.5,
  },
  needIdText: { fontSize: 9, color: '#9CA3AF', fontVariant: ['tabular-nums'] },
});

export default ProofScreen;
