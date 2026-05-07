import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/MainNavigator';
import { createSupportedRegionSuggestion } from '../../services/registration.service';
import RegionPicker from '../../components/RegionPicker';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MAX_CONTENT = 500;

const CreateSupportedRegionScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const [region, setRegion] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!region.trim()) {
      Alert.alert('Lỗi', 'Vui lòng chọn vùng.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mô tả nhu cầu hỗ trợ.');
      return;
    }
    try {
      setSubmitting(true);
      await createSupportedRegionSuggestion({
        region: region.trim(),
        content: content.trim(),
      });
      Alert.alert('Thành công', 'Đề xuất vùng đã được gửi.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert(
        'Gửi thất bại',
        e?.response?.data?.message || e?.message || 'Vui lòng thử lại.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đề xuất vùng cần hỗ trợ</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bannerCard}>
          <View style={styles.bannerIconContainer}>
            <Ionicons name="megaphone" size={22} color="#1E40AF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Giới thiệu vùng cần hỗ trợ</Text>
            <Text style={styles.bannerSubtitle}>
              Mô tả vùng và lý do cần Tình nguyện viên / Lãnh đạo địa phương để hỗ trợ trẻ em.
            </Text>
          </View>
        </View>

        {/* Region picker */}
        <Text style={styles.label}>Vùng *</Text>
        <View style={{ marginBottom: 16 }}>
          <RegionPicker value={region} onChange={setRegion} placeholder="Chọn xã/phường" />
        </View>

        {/* Content */}
        <Text style={styles.label}>Mô tả nhu cầu *</Text>
        <View style={styles.textareaWrap}>
          <TextInput
            style={styles.textarea}
            value={content}
            onChangeText={(t) => setContent(t.slice(0, MAX_CONTENT))}
            placeholder="Vùng này cần hỗ trợ điều gì? Hoàn cảnh trẻ em ở đây ra sao?"
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.counter}>{content.length}/{MAX_CONTENT}</Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Gửi đề xuất</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>

    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },

  scrollContent: { padding: 16 },

  bannerCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#DBEAFE', marginBottom: 16,
  },
  bannerIconContainer: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  bannerTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  bannerSubtitle: { fontSize: 12, color: '#6B7280', lineHeight: 18 },

  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8, marginTop: 4 },

  selector: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 14, height: 50, marginBottom: 16,
  },
  selectorText: { flex: 1, fontSize: 14, color: '#111827', fontWeight: '500' },
  placeholder: { color: '#9CA3AF', fontWeight: '400' },

  textareaWrap: {
    backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
    padding: 12, marginBottom: 20,
  },
  textarea: {
    minHeight: 130, fontSize: 14, color: '#111827', lineHeight: 20, padding: 0,
  },
  counter: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 6 },

  submitButton: {
    backgroundColor: '#1E40AF', height: 52, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#1E40AF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 3,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  modalRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  modalRowText: { flex: 1, fontSize: 14, color: '#111827', fontWeight: '500' },
  emptyText: { fontSize: 13, color: '#6B7280', textAlign: 'center', padding: 24 },
});

export default CreateSupportedRegionScreen;
