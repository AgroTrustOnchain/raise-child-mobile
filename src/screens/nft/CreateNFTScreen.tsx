// src/screens/nft/CreateNFTScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { useModal } from '../../context/ModalContext';
import * as ImagePicker from 'expo-image-picker';
// import { useNFT } from '../../hooks/useNFT';

const CreateNFTScreen = () => {
//   const { createNewNFT, isLoading } = useNFT();
  const modal = useModal();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
  });

  const handlePickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      modal.warning('Cần quyền truy cập', 'Please allow photo access');
      return;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData({ ...formData, image: result.assets[0].uri });
    }
  };

  const handleTakePhoto = async () => {
    // Request camera permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      modal.warning('Cần quyền truy cập', 'Please allow camera access');
      return;
    }

    // Take photo
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData({ ...formData, image: result.assets[0].uri });
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.description || !formData.image) {
      modal.warning('Lỗi', 'Please fill all fields and select an image');
      return;
    }

    try {
    //   await createNewNFT(formData);
      modal.success('Thành công', 'NFT created successfully!');
      setFormData({ name: '', description: '', image: '' });
    } catch (error: any) {
      modal.error('Lỗi', error.message || 'Failed to create NFT');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create New NFT</Text>

        {/* Image Preview */}
        <View style={styles.imageContainer}>
          {formData.image ? (
            <Image source={{ uri: formData.image }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>No image selected</Text>
            </View>
          )}
        </View>

        {/* Image Selection Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.imageButton, styles.imageButtonPrimary]} 
            onPress={handlePickImage}
          >
            <Text style={styles.imageButtonText}>Choose from Library</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.imageButton, styles.imageButtonSecondary]} 
            onPress={handleTakePhoto}
          >
            <Text style={styles.imageButtonTextSecondary}>Take Photo</Text>
          </TouchableOpacity>
        </View>

        {/* NFT Name Input */}
        <TextInput
          style={styles.input}
          placeholder="NFT Name"
          placeholderTextColor="#9CA3AF"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
        />

        {/* Description Input */}
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description"
          placeholderTextColor="#9CA3AF"
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Create Button */}
        {/* <TouchableOpacity
          style={[styles.createButton, isLoading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={isLoading}
        >
          <Text style={styles.createButtonText}>
            {isLoading ? 'Creating...' : 'Create NFT'}
          </Text>
        </TouchableOpacity> */}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 24,
    color: '#111827',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DBEAFE',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  imageButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  imageButtonPrimary: {
    backgroundColor: '#1E40AF',
  },
  imageButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1E40AF',
  },
  imageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  imageButtonTextSecondary: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#F8FAFF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  createButton: {
    backgroundColor: '#1E40AF',
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
});

export default CreateNFTScreen;