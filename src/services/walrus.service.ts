/**
 * Walrus Blob Storage Service
 * Handles image uploads to Walrus distributed storage
 * 
 * Reference: https://docs.walrus.xyz/
 */

import { File } from 'expo-file-system';
import { apiService } from './api.service';
import * as FileSystem from 'expo-file-system/legacy';



interface WalrusUploadResponse {
  newlyCreated?: {
    blobObject?: {
      blobId: string;
    };
  };
  blobObject?: {
    blobId: string;
  };
}

interface WalrusBlob {
  blobId: string;
  url: string;
}

// Walrus Configuration
const WALRUS_CONFIG = {
  AGGREGATOR: 'https://aggregator.walrus-testnet.walrus.space/v1/blobs',
  PUBLISHER: 'https://publisher.walrus-testnet.walrus.space',
  DEFAULT_EPOCHS: 20,
};

/**
 * Upload an image file to Walrus blob storage
 * @param imageUri - Local file URI from ImagePicker
 * @returns Walrus blob object with blobId and URL
 */
export const uploadImageToWalrus = async (imageUri: string): Promise<WalrusBlob> => {
  try {
    // Read file from local URI
    const fileData = await fetch(imageUri);
    const blob = await fileData.blob();

    // Convert base64 to blob
    // const binaryData = Uint8Array.from(atob(fileData), (c) => c.charCodeAt(0));

    console.log(blob)

    // Upload to Walrus Publisher
    const response = await fetch(
      `${WALRUS_CONFIG.PUBLISHER}/v1/blobs?epochs=${WALRUS_CONFIG.DEFAULT_EPOCHS}`,
      {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      }
    );

    // const responseV1 = await apiService.put(`${WALRUS_CONFIG.PUBLISHER}/v1/blobs?epochs=${WALRUS_CONFIG.DEFAULT_EPOCHS}`, binaryData, {
    //   headers: {
    //     'Content-Type': 'application/octet-stream',
    //   },
    // });

    console.log(response)

    if (!response.ok) {
      throw new Error(`Walrus upload failed: ${response.statusText}`);
    }

    const jsonData: WalrusUploadResponse = await response.json();

    console.log(jsonData)

    // Extract blobId from response (handle different response formats)
    const blobId =
      jsonData.newlyCreated?.blobObject?.blobId ||
      jsonData.blobObject?.blobId ||
      '';

    if (!blobId) {
      throw new Error('No blobId received from Walrus');
    }

    // Construct the public URL from aggregator
    const blobUrl = `${WALRUS_CONFIG.AGGREGATOR}/${blobId}`;

    return {
      blobId,
      url: blobUrl,
    };
  } catch (error) {
    console.error('Walrus upload error:', error);
    throw new Error(
      `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Get the Walrus blob URL from a blobId
 * @param blobId - The blob ID from Walrus
 * @returns Full URL to access the blob
 */
export const getWalrusUrl = (blobId: string): string => {
  return `${WALRUS_CONFIG.AGGREGATOR}/${blobId}`;
};

/**
 * Batch upload multiple images to Walrus
 * @param imageUris - Array of local file URIs
 * @returns Array of Walrus blob objects
 */
export const uploadImagesToWalrus = async (
  imageUris: string[]
): Promise<WalrusBlob[]> => {
  const uploadPromises = imageUris.map((uri) => uploadImageToWalrus(uri));
  return Promise.all(uploadPromises);
};
