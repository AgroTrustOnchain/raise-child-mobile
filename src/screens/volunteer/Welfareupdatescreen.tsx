import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToWalrus } from '../../services/walrus.service';
import { submitTaskProof } from '../../services/task-proofs.service';

interface UploadedImage {
  id: string;
  uri: string;
}

const WelfareUpdateScreen = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const taskFromParams = route?.params?.child;
  const taskId: string | undefined = taskFromParams?.id;

  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setUploadedImages((prev) => [
        ...prev,
        { id: Date.now().toString(), uri: result.assets[0].uri },
      ]);
    }
  };

  const removeImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleCancel = () => {
    if (uploadedImages.length === 0) {
      navigation.goBack();
      return;
    }
    Alert.alert(
      'Hủy tải lên',
      'Bạn có chắc muốn hủy? Các ảnh đã chọn sẽ bị xóa.',
      [
        { text: 'Tiếp tục chỉnh sửa', style: 'cancel' },
        {
          text: 'Hủy',
          style: 'destructive',
          onPress: () => {
            setUploadedImages([]);
            navigation.goBack();
          },
        },
      ],
    );
  };

  const handleSubmit = async () => {
    if (!taskId) {
      Alert.alert('Lỗi', 'Không tìm thấy ID nhiệm vụ. Vui lòng mở lại màn hình này từ danh sách nhiệm vụ.');
      return;
    }
    if (uploadedImages.length === 0) {
      Alert.alert('Lỗi xác thực', 'Vui lòng tải lên ít nhất một ảnh');
      return;
    }

    setIsLoading(true);

    try {
      setIsUploadingImages(true);
      const walrusBlobs: { blobId: string; base64: string }[] = [];
      for (const image of uploadedImages) {
        const walrusBlob = await uploadImageToWalrus(image.uri);
        walrusBlobs.push({ blobId: walrusBlob.blobId, base64: walrusBlob.base64 });
      }
      setIsUploadingImages(false);

      const responses = await Promise.all(
        walrusBlobs.map(({ blobId, base64 }) =>
          submitTaskProof({ taskId, imageBlobId: blobId, imageBlobIdBase64: base64 }),
        ),
      );

      const hasErrors = responses.some(
        (res) =>
          res.success === false ||
          (res.message && res.message.toLowerCase().includes('error')),
      );

      if (hasErrors) {
        throw new Error('Một số ảnh tải lên thất bại');
      }

      Alert.alert('Thành công', 'Ảnh đã được tải lên thành công!', [
        {
          text: 'OK',
          onPress: () => {
            setUploadedImages([]);
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to upload images';
      Alert.alert('Lỗi', errorMessage);
      console.error('Submit error:', error);
    } finally {
      setIsLoading(false);
      setIsUploadingImages(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerLabel}>
          <Ionicons name="cloud-upload" size={18} color="#1E40AF" />
          <Text style={styles.headerLabelText}>Tải lên ảnh</Text>
        </View>
        <Text style={styles.headerTitle}>Tải lên ảnh phúc lợi</Text>
        <Text style={styles.headerDescription}>
          Tải lên ảnh minh chứng cho công việc của bạn. Ảnh sẽ được lưu trữ và gửi đến hệ thống để xét duyệt.
        </Text>
      </View>

      {/* Visual Evidence Section */}
      <View style={styles.visualEvidenceSection}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="camera" size={20} color="#1E40AF" />
          <Text style={styles.sectionTitle}>Ảnh đã tải lên ({uploadedImages.length})</Text>
        </View>

        <TouchableOpacity style={styles.uploadBox} onPress={pickImage} disabled={isLoading}>
          <Ionicons name="image-outline" size={48} color="#6B7280" />
          <Text style={styles.uploadBoxTitle}>Chọn ảnh từ thư viện</Text>
          <Text style={styles.uploadBoxSubtitle}>PNG hoặc JPG</Text>
        </TouchableOpacity>

        {uploadedImages.length > 0 && (
          <View style={styles.imagesGrid}>
            {uploadedImages.map((image) => (
              <View key={image.id} style={styles.imageCard}>
                <Image
                  source={{ uri: image.uri }}
                  style={styles.uploadedImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(image.id)}
                  disabled={isLoading}
                >
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.cancelButton, isLoading && styles.cancelButtonDisabled]}
          onPress={handleCancel}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (isLoading || uploadedImages.length === 0) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isLoading || uploadedImages.length === 0}
        >
          {isLoading ? (
            <>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.submitButtonLoadingText}>
                {isUploadingImages ? 'Đang tải ảnh lên…' : 'Đang gửi…'}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.submitButtonText}>Gửi ảnh</Text>
              <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 20,
  },
  headerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  headerLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  headerDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontWeight: '400',
  },
  visualEvidenceSection: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#DBEAFE',
    borderRadius: 14,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFF',
    marginBottom: 16,
  },
  uploadBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  uploadBoxSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  imagesGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  imageCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  cancelButton: {
    flex: 1,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#6B7280',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#1E40AF',
    height: 60,
    borderRadius: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  submitButtonLoadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default WelfareUpdateScreen;
