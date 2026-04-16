import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToWalrus } from '../../services/walrus.service';
import { submitTaskProof } from '../../services/task-proofs.service';

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  region: string;
  avatar: string;
  verificationStatus: string;
}

interface UploadedImage {
  id: string;
  uri: string;
  isQueued?: boolean;
}

const WelfareUpdateScreen = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  // Get task from route params (passed from UpdateScreen)
  const taskFromParams = route?.params?.child;

  const [selectedChild, setSelectedChild] = useState<ChildProfile>(
    taskFromParams || {
      id: 'AG-4882',
      name: 'Amani Osei',
      age: 8,
      region: 'South Sector',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCdCs3EGDnl0wy2duHNoRuOPYDnLo4gCeBfei8kNi1tCbAwsCcbSg68HaW0F_pUpDKGrS2lsWYUVI0whPAPQK50FbodwYfRDYeY0ShMqf7n0aq4Pa654nTyiYM6jD6A8ZNykavIFaZ7IixASVuI41K90wcqMT_FgkOy-ijcqgdyPuTX1FapL5EIGdyLtNWvNj9yhmLonSV3y7pMLLz69M-5d3edbU7ZWk-MIYo-7v8qexVYUQY7mg6n6CG0q8grqVTzQCOrJ574G-ov',
      verificationStatus: 'VERIFIED ZONE',
    }
  );

  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [wellnessNotes, setWellnessNotes] = useState('');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const childProfiles: ChildProfile[] = [
    {
      id: 'AG-4882',
      name: 'Amani Osei',
      age: 8,
      region: 'South Sector',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCdCs3EGDnl0wy2duHNoRuOPYDnLo4gCeBfei8kNi1tCbAwsCcbSg68HaW0F_pUpDKGrS2lsWYUVI0whPAPQK50FbodwYfRDYeY0ShMqf7n0aq4Pa654nTyiYM6jD6A8ZNykavIFaZ7IixASVuI41K90wcqMT_FgkOy-ijcqgdyPuTX1FapL5EIGdyLtNWvNj9yhmLonSV3y7pMLLz69M-5d3edbU7ZWk-MIYo-7v8qexVYUQY7mg6n6CG0q8grqVTzQCOrJ574G-ov',
      verificationStatus: 'VERIFIED ZONE',
    },
    {
      id: 'AG-4883',
      name: 'Kofi Mensah',
      age: 10,
      region: 'South Sector',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCdCs3EGDnl0wy2duHNoRuOPYDnLo4gCeBfei8kNi1tCbAwsCcbSg68HaW0F_pUpDKGrS2lsWYUVI0whPAPQK50FbodwYfRDYeY0ShMqf7n0aq4Pa654nTyiYM6jD6A8ZNykavIFaZ7IixASVuI41K90wcqMT_FgkOy-ijcqgdyPuTX1FapL5EIGdyLtNWvNj9yhmLonSV3y7pMLLz69M-5d3edbU7ZWk-MIYo-7v8qexVYUQY7mg6n6CG0q8grqVTzQCOrJ574G-ov',
      verificationStatus: 'VERIFIED ZONE',
    },
    {
      id: 'AG-4884',
      name: 'Zara Bello',
      age: 7,
      region: 'East Sector',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCdCs3EGDnl0wy2duHNoRuOPYDnLo4gCeBfei8kNi1tCbAwsCcbSg68HaW0F_pUpDKGrS2lsWYUVI0whPAPQK50FbodwYfRDYeY0ShMqf7n0aq4Pa654nTyiYM6jD6A8ZNykavIFaZ7IixASVuI41K90wcqMT_FgkOy-ijcqgdyPuTX1FapL5EIGdyLtNWvNj9yhmLonSV3y7pMLLz69M-5d3edbU7ZWk-MIYo-7v8qexVYUQY7mg6n6CG0q8grqVTzQCOrJ574G-ov',
      verificationStatus: 'VERIFIED ZONE',
    },
  ];

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImage: UploadedImage = {
        id: Date.now().toString(),
        uri: result.assets[0].uri,
      };
      setUploadedImages([...uploadedImages, newImage]);
    }
  };

  const removeImage = (id: string) => {
    setUploadedImages(uploadedImages.filter((img) => img.id !== id));
  };

  const handleSubmit = async () => {
    if (!height || !weight) {
      Alert.alert('Validation Error', 'Please fill in height and weight');
      return;
    }

    if (uploadedImages.length === 0) {
      Alert.alert('Validation Error', 'Please upload at least one image');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Upload images to Walrus and get blob IDs
      setIsUploadingImages(true);
      const walrusBlobIds: string[] = [];

      for (const image of uploadedImages) {
        try {
          const walrusBlob = await uploadImageToWalrus(image.uri);
          walrusBlobIds.push(walrusBlob.blobId);
        } catch (uploadError) {
          throw new Error(
            `Failed to upload image: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`
          );
        }
      }
      setIsUploadingImages(false);

      // Step 2: Submit task proofs for each image
      const taskId = selectedChild.id;
      const submitPromises = walrusBlobIds.map((blobId) =>
        submitTaskProof({
          taskId,
          imageBlobId: blobId,
        })
      );

      const responses = await Promise.all(submitPromises);
      
      // Check if any submission failed
      const hasErrors = responses.some(
        (res) =>
          res.success === false ||
          (res.message && res.message.toLowerCase().includes('error'))
      );

      if (hasErrors) {
        throw new Error('Some task proofs failed to submit');
      }

      Alert.alert('Success', 'Welfare update submitted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            resetForm();
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to submit welfare update';
      Alert.alert('Error', errorMessage);
      console.error('Submit error:', error);
    } finally {
      setIsLoading(false);
      setIsUploadingImages(false);
    }
  };

  const resetForm = () => {
    setHeight('');
    setWeight('');
    setWellnessNotes('');
    setUploadedImages([]);
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.headerLabel}>
          <Ionicons name="create" size={18} color="#F97316" />
          <Text style={styles.headerLabelText}>Welfare Portal</Text>
        </View>
        <Text style={styles.headerTitle}>Upload Welfare Update</Text>
        <Text style={styles.headerDescription}>
          Enter precise health metrics and visual evidence for blockchain verification. Your
          data ensures direct transparency for sponsors.
        </Text>
      </View>

      {/* Child Selection Card */}
      <View style={styles.childSelectionCard}>
        <Text style={styles.cardLabel}>Target Profile</Text>

        {/* Dropdown Selector */}
        <View style={styles.selectorContainer}>
          <TouchableOpacity style={styles.dropdownButton}>
            <Text style={styles.dropdownText}>{selectedChild.name} - Region: {selectedChild.region}</Text>
            <Ionicons name="chevron-down" size={20} color="#757684" />
          </TouchableOpacity>
        </View>

        {/* Child Info Card */}
        <View style={styles.childInfoCard}>
          <Image
            source={{ uri: selectedChild.avatar }}
            style={styles.childAvatar}
            resizeMode="cover"
          />
          <View style={styles.childDetails}>
            <Text style={styles.childName}>{selectedChild.name}</Text>
            <Text style={styles.childMeta}>
              ID: {selectedChild.id} • {selectedChild.age} Years Old
            </Text>
            <View style={styles.verificationBadge}>
              <Text style={styles.verificationText}>{selectedChild.verificationStatus}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Visual Evidence Section */}
      <View style={styles.visualEvidenceSection}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="camera" size={20} color="#1E40AF" />
          <Text style={styles.sectionTitle}>Visual Evidence</Text>
        </View>

        <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
          <Ionicons name="image-outline" size={48} color="#757684" />
          <Text style={styles.uploadBoxTitle}>Capture Meal or Check-up</Text>
          <Text style={styles.uploadBoxSubtitle}>PNG or JPG, max 10MB</Text>
        </TouchableOpacity>

        {/* Uploaded Images Grid */}
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
                >
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Biometric Metrics Section */}
      <View style={styles.biometricsCard}>
        <View style={styles.biometricsHeader}>
          <View style={styles.biometricsIconContainer}>
            <Ionicons name="heart" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.biometricsTitle}>Biometric Metrics</Text>
        </View>

        <View style={styles.biometricsGrid}>
          <View style={styles.biometricInput}>
            <Text style={styles.inputLabel}>Height (cm)</Text>
            <TextInput
              style={styles.metricInput}
              placeholder="124"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.biometricInput}>
            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <TextInput
              style={styles.metricInput}
              placeholder="24.5"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={[styles.biometricInput, styles.fullWidth]}>
            <Text style={styles.inputLabel}>Field Wellbeing Notes</Text>
            <TextInput
              style={[styles.metricInput, styles.notesInput]}
              placeholder="Describe behavior, energy levels, and social interaction..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={wellnessNotes}
              onChangeText={setWellnessNotes}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </View>

      {/* Encryption Info Card */}
      <View style={styles.encryptionCard}>
        <View style={styles.encryptionIconContainer}>
          <Ionicons name="shield-checkmark" size={20} color="#1E40AF" />
        </View>
        <View style={styles.encryptionContent}>
          <Text style={styles.encryptionTitle}>Cryptographic Verification</Text>
          <Text style={styles.encryptionText}>
            Your update will be cryptographically hashed and anchored to the AgroTrust Ledger
            for immutable proof.
          </Text>
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <ActivityIndicator color="#FFFFFF" />
            <Text style={styles.submitButtonLoadingText}>
              {isUploadingImages ? 'Uploading images...' : 'Submitting proof...'}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.submitButtonText}>Verify on Blockchain</Text>
            <Ionicons name="wallet" size={20} color="#FFFFFF" />
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
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
    color: '#9D4300',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#00288E',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  headerDescription: {
    fontSize: 14,
    color: '#444653',
    lineHeight: 20,
    fontWeight: '400',
  },
  childSelectionCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#EFF4FF',
    borderRadius: 20,
    padding: 24,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00288E',
    marginBottom: 16,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  selectorContainer: {
    marginBottom: 16,
  },
  dropdownButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0D1C2E',
    flex: 1,
  },
  childInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  childAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  childDetails: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1C2E',
    marginBottom: 4,
  },
  childMeta: {
    fontSize: 11,
    color: '#444653',
    fontWeight: '500',
    marginBottom: 8,
  },
  verificationBadge: {
    backgroundColor: '#00563F',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  verificationText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
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
    color: '#00288E',
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(196, 197, 213, 0.3)',
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF4FF',
    marginBottom: 16,
  },
  uploadBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D1C2E',
    marginTop: 8,
  },
  uploadBoxSubtitle: {
    fontSize: 12,
    color: '#757684',
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
    backgroundColor: 'rgba(13, 28, 46, 0.5)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  biometricsCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#00288E',
    borderRadius: 20,
    padding: 28,
  },
  biometricsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  biometricsIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FD761A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  biometricsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  biometricsGrid: {
    gap: 16,
  },
  biometricInput: {
    gap: 8,
  },
  fullWidth: {
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(184, 196, 255, 0.8)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  metricInput: {
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  notesInput: {
    minHeight: 80,
    paddingTop: 12,
  },
  encryptionCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: 'rgba(219, 234, 254, 0.3)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    flexDirection: 'row',
    gap: 16,
  },
  encryptionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  encryptionContent: {
    flex: 1,
    justifyContent: 'center',
  },
  encryptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D1C2E',
    marginBottom: 4,
  },
  encryptionText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  submitButton: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#9D4300',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#FD761A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
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