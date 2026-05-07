import React, { useEffect, useState } from 'react';
import { Image, ImageProps, View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props extends Omit<ImageProps, 'source'> {
  blobId?: string | null;
  fallbackIconSize?: number;
}

// Walrus testnet has many public aggregators. The official one frequently
// returns 403 to non-browser clients, so we try several and use the first
// that responds successfully.
const WALRUS_AGGREGATORS = [
  'https://aggregator.walrus-testnet.walrus.space/v1/blobs',
  'https://walrus-testnet-aggregator.nodes.guru/v1/blobs',
  'https://walrus-testnet.blockscope.net/v1/blobs',
  'https://walrus-testnet-aggregator.stakeengine.co.uk/v1/blobs',
  'https://walrus-testnet-aggregator.starduststaking.com/v1/blobs',
  'https://walrus-testnet-aggregator.brightlystake.com/v1/blobs',
  'https://walrus-testnet.blockscope.net/v1/blobs',
];

const sniffMime = (bytes: Uint8Array): string => {
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46
  ) {
    return 'image/gif';
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  return 'image/jpeg';
};

const bufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunkSize)),
    );
  }
  // global.btoa is available in React Native (Hermes provides it)
  return global.btoa(binary);
};

const WalrusImage: React.FC<Props> = ({ blobId, style, fallbackIconSize = 22, ...rest }) => {
  const [dataUri, setDataUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!blobId) {
      setDataUri(null);
      return;
    }

    setLoading(true);
    setErrored(false);

    (async () => {
      let lastError: any = null;
      for (const base of WALRUS_AGGREGATORS) {
        if (cancelled) return;
        try {
          const res = await fetch(`${base}/${blobId}`);
          if (!res.ok) {
            lastError = new Error(`HTTP ${res.status}`);
            continue;
          }
          const buffer = await res.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          const mime = sniffMime(bytes);
          const base64 = bufferToBase64(buffer);
          if (!cancelled) {
            setDataUri(`data:${mime};base64,${base64}`);
            setLoading(false);
          }
          return;
        } catch (e) {
          lastError = e;
        }
      }

      if (!cancelled) {
        console.warn('WalrusImage load failed for', blobId, lastError);
        setErrored(true);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [blobId]);

  if (!blobId || errored) {
    return (
      <View style={[styles.placeholder, style]}>
        <Ionicons name="image-outline" size={fallbackIconSize} color="#9CA3AF" />
      </View>
    );
  }

  if (loading || !dataUri) {
    return (
      <View style={[styles.placeholder, style]}>
        <ActivityIndicator size="small" color="#1E40AF" />
      </View>
    );
  }

  return <Image source={{ uri: dataUri }} style={style} {...rest} />;
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default WalrusImage;
