import * as FileSystem from 'expo-file-system/legacy';
import { apiService } from './api.service';

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface WalrusBlob {
  blobId: string;
  url: string;
  /** Raw base64 of the uploaded image (no `data:` prefix). */
  base64: string;
}

// ─── Walrus ───────────────────────────────────────────────────────────────────

interface WalrusUploadResponse {
  newlyCreated?: { blobObject?: { blobId: string } };
  blobObject?: { blobId: string };
}

const WALRUS_CONFIG = {
  AGGREGATOR: 'https://aggregator.walrus-testnet.walrus.space/v1/blobs',
  PUBLISHER: 'https://publisher.walrus-testnet.walrus.space',
  DEFAULT_EPOCHS: 20,
};

/**
 * Upload an image to Walrus blob storage (original flow).
 */
export const uploadImageToWalrus = async (imageUri: string): Promise<WalrusBlob> => {
  const fileData = await fetch(imageUri);
  const blob = await fileData.blob();

  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const response = await fetch(
    `${WALRUS_CONFIG.PUBLISHER}/v1/blobs?epochs=${WALRUS_CONFIG.DEFAULT_EPOCHS}`,
    {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': 'application/octet-stream' },
    }
  );

  if (!response.ok) {
    throw new Error(`Walrus upload failed: ${response.statusText}`);
  }

  const jsonData: WalrusUploadResponse = await response.json();
  const blobId =
    jsonData.newlyCreated?.blobObject?.blobId ||
    jsonData.blobObject?.blobId ||
    '';

  if (!blobId) throw new Error('No blobId received from Walrus');

  return {
    blobId,
    url: `${WALRUS_CONFIG.AGGREGATOR}/${blobId}`,
    base64,
  };
};

// ─── Cloudinary ───────────────────────────────────────────────────────────────

interface PresignedUrlResponse {
  signature: string;
  timestamp: number;
  api_key: string;
  folder: string;
  upload_url: string;
}

interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  url?: string;
  asset_id?: string;
}

/**
 * Upload an image to Cloudinary via the backend presigned-url flow.
 *
 * 1. GET /images/presigned-url  → { signature, timestamp, api_key, folder, upload_url }
 * 2. POST upload_url (multipart/form-data) with the image + signing fields
 */
export const uploadImageToCloudinary = async (imageUri: string): Promise<WalrusBlob> => {
  const presignRes = await apiService.get<PresignedUrlResponse>('/images/presigned-url');
  const { signature, timestamp, api_key, folder, upload_url } = presignRes.data;

  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const filename = imageUri.split('/').pop() || 'upload.jpg';
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const formData = new FormData();
  formData.append('file', { uri: imageUri, name: filename, type: mimeType } as any);
  formData.append('api_key', api_key);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('folder', folder);

  const uploadRes = await fetch(upload_url, { method: 'POST', body: formData });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text().catch(() => uploadRes.statusText);
    throw new Error(`Cloudinary upload failed: ${errText}`);
  }

  const uploadJson: CloudinaryUploadResponse = await uploadRes.json();
  console.log('Cloudinary upload response:', uploadJson);

  const blobId = uploadJson.public_id;
  const url = uploadJson.url ?? uploadJson.secure_url;

  if (!blobId || !url) {
    throw new Error('Cloudinary upload returned no public_id or url');
  }

  return { blobId, url, base64 };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const getWalrusUrl = (blobId: string): string =>
  `${WALRUS_CONFIG.AGGREGATOR}/${blobId}`;

export const getWalrusImageSource = (blobId: string) => ({
  uri: getWalrusUrl(blobId),
  headers: { Accept: 'image/*' },
});

export const uploadImagesToWalrus = async (imageUris: string[]): Promise<WalrusBlob[]> =>
  Promise.all(imageUris.map(uploadImageToWalrus));
