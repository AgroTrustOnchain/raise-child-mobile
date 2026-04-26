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
      Alert.alert("Lỗi", "Không thể mở liên kết thanh toán.");
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
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{title}</Text>
        <View style={styles.navButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Quét mã để thanh toán</Text>
        <Text style={styles.subtitle}>
          Dùng ứng dụng ngân hàng để quét mã VietQR bên dưới, hoặc mở PayOS trực tiếp.
        </Text>

        <View style={styles.qrCard}>
          {fetchingQr ? (
            <View style={styles.qrLoading}>
              <ActivityIndicator size="large" color="#1E40AF" />
              <Text style={styles.qrLoadingText}>Đang tải mã QR…</Text>
            </View>
          ) : bankingQrUrl ? (
            <>
              <Image
                source={{ uri: bankingQrUrl }}
                style={styles.qrImage}
                resizeMode="contain"
              />
              <Text style={styles.qrSub}>
                Mở ứng dụng ngân hàng và quét mã VietQR này để hoàn tất thanh toán.
              </Text>
            </>
          ) : (
            <Text style={styles.qrSub}>
              Không thể tải mã QR ngân hàng. Vui lòng mở trang thanh toán.
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.openButton}
          onPress={handleOpenPayment}
          activeOpacity={0.85}
        >
          <Ionicons name="open-outline" size={20} color="#FFFFFF" />
          <Text style={styles.openButtonText}>Mở trang PayOS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.paidButton}
          onPress={() => navigation.navigate("PaymentCallbackScreen")}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.paidButtonText}>Tôi đã thanh toán xong</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Sau khi thanh toán, nhấn nút trên để xác minh giao dịch.
        </Text>

        <TouchableOpacity
          style={styles.testButton}
          onPress={handleTestCallback}
          activeOpacity={0.85}
        >
          <Ionicons name="bug-outline" size={16} color="#6B7280" />
          <Text style={styles.testButtonText}>Kiểm tra Callback (Dev)</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "rgba(248, 250, 252, 0.85)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 232, 240, 0.5)",
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  navTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    paddingHorizontal: 8,
  },

  content: { padding: 24, alignItems: "center" },
  heading: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    minHeight: 240,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
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
    backgroundColor: "#1E40AF",
    height: 60,
    borderRadius: 16,
    width: "100%",
    shadowColor: "#1E40AF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  openButtonText: { fontSize: 17, fontWeight: "800", color: "#FFFFFF" },
  hint: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  paidButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#16A34A",
    height: 60,
    borderRadius: 16,
    width: "100%",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  paidButtonText: { fontSize: 17, fontWeight: "800", color: "#FFFFFF" },
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
    backgroundColor: "#FFFFFF",
  },
  testButtonText: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
});

export default PaymentQrScreen;
