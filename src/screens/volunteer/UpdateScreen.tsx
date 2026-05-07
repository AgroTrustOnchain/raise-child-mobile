import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getStaffTasks, TaskItem } from '../../services/tasks.service';
import { useWallet } from '../../context/WalletContext';

type NavigationProp = NativeStackNavigationProp<any>;

function UpdateScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { wallet } = useWallet();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchTasks();
    }, [wallet?.address])
  );

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!wallet?.address) {
        setTasks([]);
        return;
      }

      const tasksList = await getStaffTasks(wallet.address);
      console.log(tasksList)
      setTasks(tasksList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tasks';
      setError(errorMessage);
      console.error('Failed to fetch tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadUpdate = (task: TaskItem) => {
    navigation.navigate('WelfareUpdateDetail', { child: task });
  };

  const handleRetry = () => {
    fetchTasks();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upload Updates</Text>
        <TouchableOpacity
          style={styles.headerActionBtn}
          onPress={() => navigation.navigate('SubmittedProofs')}
          activeOpacity={0.85}
        >
          <Ionicons name="document-text" size={16} color="#FFFFFF" />
          <Text style={styles.headerActionText}>Submitted</Text>
        </TouchableOpacity>
      </View>

      {/* Subtitle */}
      <View style={styles.subtitleSection}>
        <Text style={styles.subtitle}>
          Select a task to submit welfare updates and health metrics
        </Text>
        <Text style={styles.childCount}>{isLoading ? '...' : tasks.length} tasks in your care</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text style={styles.loadingText}>Loading your tasks...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#DC2626" />
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Tasks</Text>
          <Text style={styles.emptyText}>
            You don't have any tasks assigned yet
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {tasks.map((task) => (
            <View key={task.id} style={styles.childCard}>
              {/* Task Info */}
              <View style={styles.childInfoContainer}>
                {/* Avatar or Icon */}
                {task.image_blob_id ? (
                  <Image
                    source={{ uri: `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${task.image_blob_id}` }}
                    style={styles.childImage}
                  />
                ) : (
                  <View style={[styles.childImage, styles.placeholderImage]}>
                    <Ionicons name="person" size={32} color="#9CA3AF" />
                  </View>
                )}
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{task.title || task.name || `Task ${task.id}`}</Text>
                  <Text style={styles.childMeta}>
                    ID: {task.id}
                  </Text>
                  {task.region && (
                    <Text style={styles.childRegion}>{task.region}</Text>
                  )}
                  {task.description && (
                    <Text style={styles.lastUpdated} numberOfLines={1}>
                      {task.description}
                    </Text>
                  )}
                </View>
                <View style={styles.badgeContainer}>
                  <View style={styles.verificationBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#1E40AF" />
                    <Text style={styles.badgeText}>{task.status || 'Active'}</Text>
                  </View>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Action Button */}
              <TouchableOpacity
                style={[styles.uploadButton, task.is_submitted && styles.uploadButtonDisabled]}
                onPress={() => handleUploadUpdate(task)}
                disabled={task.is_submitted}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={task.is_submitted ? 'checkmark-circle' : 'cloud-upload'}
                  size={18}
                  color="#fff"
                />
                <Text style={styles.uploadButtonText}>
                  {task.is_submitted ? 'Already Submitted' : 'Upload Welfare Update'}
                </Text>
                {!task.is_submitted && (
                  <Ionicons name="chevron-forward" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          ))}

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#1E40AF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Regular Updates Required</Text>
              <Text style={styles.infoText}>
                Submit welfare updates at least once per week to maintain verification status and sponsor trust.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E40AF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  headerActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitleSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 20,
  },
  childCount: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  childCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  childInfoContainer: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'flex-start',
    gap: 12,
  },
  childImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  childMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  childRegion: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
  },
  lastUpdated: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  badgeContainer: {
    justifyContent: 'flex-start',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E40AF',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  uploadButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    marginTop: 8,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  placeholderImage: {
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E40AF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default UpdateScreen;
