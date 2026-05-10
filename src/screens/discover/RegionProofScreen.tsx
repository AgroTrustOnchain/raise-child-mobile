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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRegionTaskProofs, TaskProof } from '../../services/task-proofs.service';
import WalrusImage from '../../components/WalrusImage';

function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const RegionProofScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const region: string = route.params?.region ?? '';

  const [proofs, setProofs] = useState<TaskProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!region) return;
    setLoading(true);
    getRegionTaskProofs(region)
      .then((data) => {
        const sorted = [...data].sort((a, b) => {
          const da = new Date(a.created_at ?? a.raw_submit_date ?? 0).getTime();
          const db = new Date(b.created_at ?? b.raw_submit_date ?? 0).getTime();
          return db - da;
        });
        setProofs(sorted);
      })
      .catch((e) => setError(e?.message ?? 'Failed to load proofs'))
      .finally(() => setLoading(false));
  }, [region]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Region Proof</Text>
        <View style={styles.headerBtn} />
      </View>

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>{region}</Text>
        <Text style={styles.subtitle}>
          Verified welfare activity timeline for this region.
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text style={styles.loadingText}>Loading proofs...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : proofs.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="document-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>No proofs submitted yet</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Timeline */}
          <View style={styles.timeline}>
            <View style={styles.timelineLine} />
            {proofs.map((proof, index) => {
              const isFirst = index === 0;
              const date = formatDate(proof.created_at ?? proof.raw_submit_date);
              const isApproved = proof.review_status === 'Approved';
              const isPending = proof.review_status === 'Pending';

              return (
                <View key={proof.id} style={styles.timelineItem}>
                  {/* Date row */}
                  <View style={styles.dateRow}>
                    <View style={[styles.dot, isFirst && styles.dotActive]} />
                    <Text style={[styles.dateText, isFirst && styles.dateTextActive]}>
                      {date || 'Unknown date'}
                    </Text>
                  </View>

                  {/* Card */}
                  <View style={styles.card}>
                    {proof.image_blob_id ? (
                      <WalrusImage
                        blobId={proof.image_blob_id}
                        style={styles.cardImage}
                        resizeMode="cover"
                        fallbackIconSize={32}
                      />
                    ) : (
                      <View style={[styles.cardImage, styles.imagePlaceholder]}>
                        <Ionicons name="image-outline" size={32} color="#9CA3AF" />
                      </View>
                    )}

                    {/* Status badge */}
                    <View style={[
                      styles.statusBadge,
                      isApproved && styles.statusApproved,
                      isPending && styles.statusPending,
                      !isApproved && !isPending && styles.statusRejected,
                    ]}>
                      <Ionicons
                        name={isApproved ? 'shield-checkmark' : isPending ? 'time' : 'close-circle'}
                        size={12}
                        color={isApproved ? '#1E40AF' : isPending ? '#92400E' : '#DC2626'}
                      />
                      <Text style={[
                        styles.statusText,
                        isApproved && styles.statusTextApproved,
                        isPending && styles.statusTextPending,
                        !isApproved && !isPending && styles.statusTextRejected,
                      ]}>
                        {proof.review_status ?? 'Unknown'}
                      </Text>
                    </View>

                    <View style={styles.cardBody}>
                      {proof.description ? (
                        <Text style={styles.description}>{proof.description}</Text>
                      ) : null}

                      {proof.ai_evaluation ? (
                        <View style={styles.aiRow}>
                          <Ionicons name="sparkles" size={13} color="#7C3AED" />
                          <Text style={styles.aiText} numberOfLines={3}>
                            {proof.ai_evaluation}
                          </Text>
                        </View>
                      ) : null}

                      <View style={styles.metaRow}>
                        <Ionicons name="person-outline" size={13} color="#9CA3AF" />
                        <Text style={styles.metaText} numberOfLines={1}>
                          {proof.actor_address
                            ? `${proof.actor_address.slice(0, 10)}...${proof.actor_address.slice(-6)}`
                            : 'Unknown'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
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
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  titleSection: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 4, lineHeight: 18 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#6B7280' },
  errorText: { fontSize: 14, color: '#DC2626', textAlign: 'center', paddingHorizontal: 24 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
  scrollContent: { paddingBottom: 40 },
  timeline: { position: 'relative', paddingHorizontal: 16, paddingTop: 8 },
  timelineLine: {
    position: 'absolute',
    left: 36,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(30, 64, 175, 0.12)',
  },
  timelineItem: { marginBottom: 28 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, marginLeft: 4 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(30, 64, 175, 0.25)',
    borderWidth: 2,
    borderColor: '#F8FAFC',
  },
  dotActive: {
    backgroundColor: '#1E40AF',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  dateTextActive: { color: '#1E40AF' },
  card: {
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
  cardImage: { width: '100%', height: 180 },
  imagePlaceholder: {
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(30, 64, 175, 0.15)',
  },
  statusApproved: { borderColor: 'rgba(30, 64, 175, 0.2)' },
  statusPending: { borderColor: 'rgba(146, 64, 14, 0.2)' },
  statusRejected: { borderColor: 'rgba(220, 38, 38, 0.2)' },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  statusTextApproved: { color: '#1E40AF' },
  statusTextPending: { color: '#92400E' },
  statusTextRejected: { color: '#DC2626' },
  cardBody: { padding: 14, gap: 8 },
  description: { fontSize: 14, color: '#111827', lineHeight: 20 },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    padding: 10,
  },
  aiText: { flex: 1, fontSize: 12, color: '#5B21B6', lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace', flex: 1 },
});

export default RegionProofScreen;
