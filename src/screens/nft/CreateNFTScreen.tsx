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
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
// import { useNFT } from '../../hooks/useNFT';

const CreateNFTScreen = () => {
//   const { createNewNFT, isLoading } = useNFT();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
  });

  const handlePickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access');
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
      Alert.alert('Permission needed', 'Please allow camera access');
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
      Alert.alert('Error', 'Please fill all fields and select an image');
      return;
    }

    try {
    //   await createNewNFT(formData);
      Alert.alert('Success', 'NFT created successfully!');
      setFormData({ name: '', description: '', image: '' });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create NFT');
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
          placeholderTextColor="#999"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
        />

        {/* Description Input */}
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description"
          placeholderTextColor="#999"
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
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#999',
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
    borderRadius: 8,
    alignItems: 'center',
  },
  imageButtonPrimary: {
    backgroundColor: '#6366f1',
  },
  imageButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imageButtonTextSecondary: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  createButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CreateNFTScreen;