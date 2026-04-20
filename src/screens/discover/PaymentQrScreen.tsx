import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { fakePaymentCallback } from "../../services/payment.service";

const extractBankingQr = async (payosUrl: string): Promise<string | null> => {
  try {
    const res = await fetch(payosUrl);
    const html = await res.text();
    const allMatches = [...html.matchAll(/src="(https:\/\/img\.vietqr\.io\/[^"]+)"/g)].map(
      (m) => m[1].replace(/&amp;/g, "&")
    );
    const withAmount = allMatches.find(
      (u) => u.includes("amount") || u.includes("addInfo") || u.includes("accountNo")
    );
    return withAmount ?? allMatches[0] ?? null;
  } catch (e) {
    console.warn("[VietQR] extract failed", e);
    return null;
  }
};

const PaymentQrScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { paymentUrl, title = "Complete Payment" } = route.params as {
    paymentUrl: string;
    title?: string;
  };

  const [bankingQrUrl, setBankingQrUrl] = useState<string | null>(null);
  const [fetchingQr, setFetchingQr] = useState(true);

  useEffect(() => {
    extractBankingQr(paymentUrl).then((url) => {
      setBankingQrUrl(url);
      setFetchingQr(false);
    });
  }, [paymentUrl]);

  const handleOpenPayment = async () => {
    const supported = await Linking.canOpenURL(paymentUrl);
    if (supported) {
      await Linking.openURL(paymentUrl);
    } else {
      Alert.alert("Error", "Cannot open payment link.");
    }
  };

  const handleTestCallback = async () => {
    try {
      await fakePaymentCallback();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || "Fake callback failed.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{title}</Text>
        <View style={styles.navButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Scan to Pay</Text>
        <Text style={styles.subtitle}>
          Use any banking app to scan the VietQR code below, or open PayOS directly.
        </Text>

        <View style={styles.qrCard}>
          {fetchingQr ? (
            <View style={styles.qrLoading}>
              <ActivityIndicator size="large" color="#13ec5b" />
              <Text style={styles.qrLoadingText}>Loading QR code…</Text>
            </View>
          ) : bankingQrUrl ? (
            <>
              <Image
                source={{ uri: bankingQrUrl }}
                style={styles.qrImage}
                resizeMode="contain"
              />
              <Text style={styles.qrSub}>
                Open any banking app and scan this VietQR code to complete payment.
              </Text>
            </>
          ) : (
            <Text style={styles.qrSub}>
              Could not load banking QR. Please open the payment page instead.
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.openButton}
          onPress={handleOpenPayment}
          activeOpacity={0.85}
        >
          <Ionicons name="open-outline" size={20} color="#fff" />
          <Text style={styles.openButtonText}>Open PayOS Page</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          After paying, tap the button below to verify the transaction.
        </Text>

        <TouchableOpacity
          style={styles.testButton}
          onPress={handleTestCallback}
          activeOpacity={0.85}
        >
          <Ionicons name="bug-outline" size={16} color="#6B7280" />
          <Text style={styles.testButtonText}>Test Callback (Dev)</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8f6" },

  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(246,248,246,0.9)",
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  navTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    paddingHorizontal: 8,
  },

  content: { padding: 24, alignItems: "center" },
  heading: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },

  qrCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    minHeight: 240,
    justifyContent: "center",
  },
  qrImage: { width: 240, height: 240 },
  qrLoading: { alignItems: "center", gap: 12, paddingVertical: 24 },
  qrLoadingText: { fontSize: 13, color: "#9CA3AF" },
  qrSub: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 14,
    lineHeight: 18,
  },

  openButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#13ec5b",
    borderRadius: 14,
    paddingVertical: 14,
    width: "100%",
    shadowColor: "#13ec5b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  openButtonText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  hint: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#F9FAFB",
  },
  testButtonText: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
});

export default PaymentQrScreen;
