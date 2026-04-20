import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/MainNavigator';
import { useAppSelector } from '../../store';
import { submitRegistration, getRegions } from '../../services/registration.service';
import { uploadImageToWalrus } from '../../services/walrus.service';
import * as FileSystem from 'expo-file-system/legacy';


type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface RegistrationFormData {
  avatarBlobId?: string;
  avatarPreview?: string;
  identityCardBlobId?: string;
  identityCardPreview?: string;
  region: string;
  registerRole: string;
}

const ROLES = ['Local Leader', 'Volunteer'];

const RegistrationFormScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<any>();
  const prefilledRegion: string = route.params?.region ?? '';
  const { user } = useAppSelector((state) => state.auth);
  const [regions, setRegions] = useState<any[]>([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);

  const [formData, setFormData] = useState<RegistrationFormData>({
    avatarBlobId: undefined,
    avatarPreview: undefined,
    identityCardBlobId: undefined,
    identityCardPreview: undefined,
    region: prefilledRegion,
    registerRole: '',
  });

  // Fetch regions from API
  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      setIsLoadingRegions(true);
      const data = await getRegions();
      setRegions(data);
    } catch (error) {
      console.error('Failed to fetch regions:', error);
      Alert.alert('Error', 'Failed to load regions. Please try again.');
    } finally {
      setIsLoadingRegions(false);
    }
  };

  const pickImage = async (imageType: 'avatar' | 'identityCard') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: imageType === 'avatar' ? [1, 1] : [4, 3],
        quality: 0.8,
      });

      console.log('Image picker result:', result);

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        console.log(uri)
        
        // Show loading indicator while uploading to Walrus
        setIsUploadingImage(true);
        
        try {
          // Upload image to Walrus storage
          const walrusBlob = await uploadImageToWalrus(uri);
          
          // Store both the blob ID (for server) and preview URI (for UI)
          if (imageType === 'avatar') {
            setFormData((prev) => ({
              ...prev,
              avatarBlobId: walrusBlob.blobId,
              avatarPreview: uri, // Keep local URI for preview
            }));
          } else {
            setFormData((prev) => ({
              ...prev,
              identityCardBlobId: walrusBlob.blobId,
              identityCardPreview: uri, // Keep local URI for preview
            }));
          }
          
          Alert.alert('Success', `${imageType === 'avatar' ? 'Avatar' : 'ID Card'} uploaded successfully!`);
        } catch (uploadError) {
          Alert.alert(
            'Upload Error',
            uploadError instanceof Error ? uploadError.message : 'Failed to upload image to Walrus'
          );
          console.error('Walrus upload error:', uploadError);
        } finally {
          setIsUploadingImage(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Image picker error:', error);
    }
  };

  const handleRoleSelect = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      registerRole: role,
    }));
    setShowRoleModal(false);
  };

  const validateForm = () => {
    if (!formData.avatarBlobId) {
      Alert.alert('Validation Error', 'Please upload an avatar image');
      return false;
    }
    if (!formData.identityCardBlobId) {
      Alert.alert('Validation Error', 'Please upload an identity card image');
      return false;
    }
    if (!formData.region) {
      Alert.alert('Validation Error', 'Please select a region');
      return false;
    }
    if (!formData.registerRole) {
      Alert.alert('Validation Error', 'Please select a role');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Check if user token exists
      if (!user) {
        Alert.alert('Error', 'You must be logged in to register');
        return;
      }
      
      const payload = {
        avatar_blob_id: formData.avatarBlobId || '',
        identity_card_blob_id: formData.identityCardBlobId || '',
        region: formData.region,
        register_role: formData.registerRole.replace(' ', '_'),
      };

      console.log('Submitting registration:', payload);
      
      // Call the registration service - it will automatically get token from AsyncStorage
      const response = await submitRegistration(payload);

      console.log(response)
      
      Alert.alert('Success', 'Registration submitted successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to submit registration form');
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registration Form</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Avatar Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Picture</Text>
          <TouchableOpacity
            style={styles.imageUploadBox}
            onPress={() => pickImage('avatar')}
            disabled={isUploadingImage}
            activeOpacity={0.7}
          >
            {isUploadingImage ? (
              <View style={styles.uploadPlaceholder}>
                <ActivityIndicator size="large" color="#1E40AF" />
                <Text style={styles.uploadText}>Uploading to Walrus...</Text>
              </View>
            ) : formData.avatarPreview ? (
              <Image
                source={{ uri: formData.avatarPreview }}
                style={styles.uploadedImage}
              />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="cloud-upload" size={40} color="#9ca3af" />
                <Text style={styles.uploadText}>Upload Avatar</Text>
                <Text style={styles.uploadSubtext}>Square image recommended</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Identity Card Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identity Card</Text>
          <TouchableOpacity
            style={styles.imageUploadBox}
            onPress={() => pickImage('identityCard')}
            disabled={isUploadingImage}
            activeOpacity={0.7}
          >
            {isUploadingImage ? (
              <View style={styles.uploadPlaceholder}>
                <ActivityIndicator size="large" color="#1E40AF" />
                <Text style={styles.uploadText}>Uploading to Walrus...</Text>
              </View>
            ) : formData.identityCardPreview ? (
              <Image
                source={{ uri: formData.identityCardPreview }}
                style={styles.uploadedImage}
              />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="cloud-upload" size={40} color="#9ca3af" />
                <Text style={styles.uploadText}>Upload ID Card</Text>
                <Text style={styles.uploadSubtext}>
                  Clear photo of front and back
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Region Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Region</Text>
          <TouchableOpacity
            style={styles.roleDropdown}
            onPress={() => setShowRegionModal(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.roleDropdownText,
                !formData.region && styles.roleDropdownPlaceholder,
              ]}
            >
              {formData.region || 'Select a region'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>

          {/* Region Modal */}
          <Modal
            visible={showRegionModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowRegionModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Region</Text>
                  <TouchableOpacity
                    onPress={() => setShowRegionModal(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#111827" />
                  </TouchableOpacity>
                </View>

                {isLoadingRegions ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1E40AF" />
                  </View>
                ) : regions.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No regions available</Text>
                  </View>
                ) : (
                  <ScrollView 
                    style={styles.modalScroll}
                    showsVerticalScrollIndicator={true}
                  >
                    {regions.map((region) => (
                      <TouchableOpacity
                        key={region?.id || region}
                        style={[
                          styles.roleOption,
                          formData.region === region && styles.roleOptionActive,
                        ]}
                        onPress={() => {
                          setFormData((prev) => ({
                            ...prev,
                            region: region,
                          }));
                          setShowRegionModal(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.roleOptionText,
                            formData.region === region &&
                              styles.roleOptionTextActive,
                          ]}
                        >
                          {region}
                        </Text>
                        {formData.region === region && (
                          <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color="#1E40AF"
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>
        </View>

        {/* Role Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registration Role</Text>
          <TouchableOpacity
            style={styles.roleDropdown}
            onPress={() => setShowRoleModal(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.roleDropdownText,
                !formData.registerRole && styles.roleDropdownPlaceholder,
              ]}
            >
              {formData.registerRole || 'Select a role'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>

          {/* Role Modal */}
          <Modal
            visible={showRoleModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowRoleModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Role</Text>
                  <TouchableOpacity
                    onPress={() => setShowRoleModal(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#111827" />
                  </TouchableOpacity>
                </View>

                {ROLES.map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleOption,
                      formData.registerRole === role && styles.roleOptionActive,
                    ]}
                    onPress={() => handleRoleSelect(role)}
                  >
                    <View style={styles.roleOptionContent}>
                      <Text
                        style={[
                          styles.roleOptionText,
                          formData.registerRole === role &&
                            styles.roleOptionTextActive,
                        ]}
                      >
                        {role}
                      </Text>
                      <Text style={styles.roleOptionDescription}>
                        {role === 'Local Leader'
                          ? 'Lead and manage local volunteer activities'
                          : 'Contribute to child welfare and development'}
                      </Text>
                    </View>
                    {formData.registerRole === role && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#1E40AF"
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Modal>
        </View>

        {/* Form Summary */}
        <View style={styles.section}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Form Summary</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCheck}>
                <Ionicons
                  name={formData.avatarBlobId ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={formData.avatarBlobId ? '#1E40AF' : '#D1D5DB'}
                />
              </View>
              <Text style={styles.summaryText}>Avatar uploaded</Text>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCheck}>
                <Ionicons
                  name={formData.identityCardBlobId ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={formData.identityCardBlobId ? '#1E40AF' : '#D1D5DB'}
                />
              </View>
              <Text style={styles.summaryText}>ID card uploaded</Text>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCheck}>
                <Ionicons
                  name={formData.region ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={formData.region ? '#1E40AF' : '#D1D5DB'}
                />
              </View>
              <Text style={styles.summaryText}>Region selected: {formData.region}</Text>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCheck}>
                <Ionicons
                  name={formData.registerRole ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={formData.registerRole ? '#1E40AF' : '#D1D5DB'}
                />
              </View>
              <Text style={styles.summaryText}>Role selected: {formData.registerRole}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={[styles.footerContainer, { paddingBottom: 16 }]}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Submit Registration</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.5)',
    backgroundColor: 'rgba(248,250,252,0.85)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  imageUploadBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderStyle: 'dashed',
    overflow: 'hidden',
    backgroundColor: '#F8FAFF',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  roleDropdown: {
    backgroundColor: '#F8FAFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleDropdownText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  roleDropdownPlaceholder: {
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
//   modalContent: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     paddingBottom: 30,
//     maxHeight: '80%',
//   },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalContent: {
  backgroundColor: '#FFFFFF',
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  paddingBottom: 30,
  maxHeight: '80%',
  flex: 0,  // don't stretch to full screen
},

// Change modalScroll style
modalScroll: {
  flexGrow: 0,   // <-- key fix
  flexShrink: 1, // <-- allows it to shrink within maxHeight
},
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  roleOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  roleOptionContent: {
    flex: 1,
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  roleOptionTextActive: {
    color: '#1E40AF',
  },
  roleOptionDescription: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  summaryCheck: {
    width: 24,
  },
  summaryText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  footerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#1E40AF',
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
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
});

export default RegistrationFormScreen;
