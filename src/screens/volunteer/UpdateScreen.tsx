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
import { getTasks, TaskItem } from '../../services/tasks.service';

type NavigationProp = NativeStackNavigationProp<any>;

function UpdateScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchTasks();
    }, [])
  );

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await getTasks({
        page: 0,
        pageSize: 20,
      });

      // Extract tasks from response (handles different formats)
      const tasksList = response.data || response.items || response.tasks || [];
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
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading your tasks...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#d1d5db" />
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
                    <Ionicons name="person" size={32} color="#9ca3af" />
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
                    <Ionicons name="checkmark-circle" size={14} color="#13ec5b" />
                    <Text style={styles.badgeText}>{task.status || 'Active'}</Text>
                  </View>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Action Button */}
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => handleUploadUpdate(task)}
                activeOpacity={0.7}
              >
                <Ionicons name="cloud-upload" size={18} color="#fff" />
                <Text style={styles.uploadButtonText}>Upload Welfare Update</Text>
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#6366f1" />
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#6366f1',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  subtitleSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  subtitle: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 6,
    lineHeight: 20,
  },
  childCount: {
    fontSize: 12,
    color: '#9ca3af',
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
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  childCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 16,
    overflow: 'hidden',
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
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  childMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  childRegion: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 6,
  },
  lastUpdated: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  badgeContainer: {
    justifyContent: 'flex-start',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(19, 236, 91, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#13ec5b',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
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
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#4b5563',
    lineHeight: 18,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  placeholderImage: {
    backgroundColor: '#f3f4f6',
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
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default UpdateScreen;
