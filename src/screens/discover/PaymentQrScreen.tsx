import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { getPaymentStatus } from "../../services/payment.service";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20; // 60 seconds total

const SUCCESS_STATUSES = new Set(["PAID", "paid", "SUCCESS", "success", "completed", "COMPLETED"]);

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
  const { paymentUrl, paymentId, title = "Hoàn tất thanh toán" } = route.params as {
    paymentUrl: string;
    paymentId?: string | number;
    title?: string;
  };

  const [bankingQrUrl, setBankingQrUrl] = useState<string | null>(null);
  const [fetchingQr, setFetchingQr] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef = useRef(0);
  const resolvedRef = useRef(false);

  // ── QR extraction ──────────────────────────────────────────────────────────
  useEffect(() => {
    extractBankingQr(paymentUrl).then((url) => {
      setBankingQrUrl(url);
      setFetchingQr(false);
    });
  }, [paymentUrl]);

  // ── Polling ────────────────────────────────────────────────────────────────
  const checkStatus = useCallback(async () => {
    if (!paymentId || resolvedRef.current) return;

    try {
      const data = await getPaymentStatus(paymentId);
      const status = data.status ?? "";
      setPaymentStatus(status);

      if (SUCCESS_STATUSES.has(status)) {
        resolvedRef.current = true;
        clearPollTimer();
        // Navigate to callback/success screen
        navigation.replace("PaymentCallbackScreen", {});
        return;
      }
    } catch (err) {
      console.warn("[Poll] status check failed", err);
    }

    pollCountRef.current += 1;

    if (pollCountRef.current >= MAX_POLLS) {
      clearPollTimer();
      // Stop silently — user can still manually confirm
    } else {
      schedulePoll();
    }
  }, [paymentId]);

  const schedulePoll = () => {
    pollTimer.current = setTimeout(checkStatus, POLL_INTERVAL_MS);
  };

  const clearPollTimer = () => {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  };

  useEffect(() => {
    if (paymentId) {
      schedulePoll(); // first poll after POLL_INTERVAL_MS
    }
    return () => clearPollTimer();
  }, [checkStatus]);

  // ── Manual check ───────────────────────────────────────────────────────────
  const handleManualCheck = async () => {
    if (!paymentId) {
      navigation.navigate("PaymentCallbackScreen", {});
      return;
    }
    setChecking(true);
    clearPollTimer();
    try {
      const data = await getPaymentStatus(paymentId);
      const status = data.status ?? "";
      setPaymentStatus(status);
      if (SUCCESS_STATUSES.has(status)) {
        resolvedRef.current = true;
        navigation.replace("PaymentCallbackScreen", {});
      } else {
        Alert.alert(
          "Chưa xác nhận",
          `Trạng thái hiện tại: ${status || "Đang xử lý"}. Vui lòng thử lại sau vài giây.`
        );
        schedulePoll();
      }
    } catch {
      Alert.alert("Lỗi", "Không thể kiểm tra trạng thái. Vui lòng thử lại.");
      schedulePoll();
    } finally {
      setChecking(false);
    }
  };

  const handleOpenPayment = async () => {
    const supported = await Linking.canOpenURL(paymentUrl);
    if (supported) {
      await Linking.openURL(paymentUrl);
    } else {
      Alert.alert("Lỗi", "Không thể mở liên kết thanh toán.");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Quét mã để thanh toán</Text>
        <Text style={styles.subtitle}>
          Dùng ứng dụng ngân hàng để quét mã VietQR bên dưới, hoặc mở PayOS trực tiếp.
        </Text>

        {/* QR Card */}
        <View style={styles.qrCard}>
          {fetchingQr ? (
            <View style={styles.qrPlaceholder}>
              <ActivityIndicator size="large" color="#1E40AF" />
              <Text style={styles.qrLoadingText}>Đang tải mã QR…</Text>
            </View>
          ) : bankingQrUrl ? (
            <>
              <Image source={{ uri: bankingQrUrl }} style={styles.qrImage} resizeMode="contain" />
              <Text style={styles.qrSub}>
                Mở ứng dụng ngân hàng và quét mã VietQR này để hoàn tất thanh toán.
              </Text>
            </>
          ) : (
            <Text style={styles.qrSub}>
              Không thể tải mã QR. Vui lòng mở trang thanh toán bên dưới.
            </Text>
          )}
        </View>

        {/* Polling status indicator */}
        {paymentId && (
          <View style={styles.pollingRow}>
            <ActivityIndicator
              size="small"
              color={pollCountRef.current >= MAX_POLLS ? "#9CA3AF" : "#1E40AF"}
              animating={pollCountRef.current < MAX_POLLS && !resolvedRef.current}
            />
            <Text style={styles.pollingText}>
              {pollCountRef.current >= MAX_POLLS
                ? "Tự động kiểm tra đã hết thời gian — nhấn nút bên dưới để xác nhận"
                : paymentStatus
                ? `Trạng thái: ${paymentStatus}`
                : "Đang tự động kiểm tra trạng thái thanh toán…"}
            </Text>
          </View>
        )}

        {/* Open PayOS */}
        <TouchableOpacity style={styles.openButton} onPress={handleOpenPayment} activeOpacity={0.85}>
          <Ionicons name="open-outline" size={20} color="#FFFFFF" />
          <Text style={styles.openButtonText}>Mở trang PayOS</Text>
        </TouchableOpacity>

        {/* Manual confirm */}
        <TouchableOpacity
          style={[styles.paidButton, checking && styles.buttonDisabled]}
          onPress={handleManualCheck}
          disabled={checking}
          activeOpacity={0.85}
        >
          {checking ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.paidButtonText}>Tôi đã thanh toán xong</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          Sau khi quét mã, nhấn nút trên để xác nhận giao dịch.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "rgba(248, 250, 252, 0.85)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 232, 240, 0.5)",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
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
  qrPlaceholder: { alignItems: "center", gap: 12, paddingVertical: 24 },
  qrLoadingText: { fontSize: 13, color: "#9CA3AF" },
  qrSub: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 14,
    lineHeight: 18,
  },

  pollingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: "100%",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  pollingText: {
    flex: 1,
    fontSize: 12,
    color: "#1E40AF",
    fontWeight: "500",
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
    marginBottom: 12,
  },
  openButtonText: { fontSize: 17, fontWeight: "800", color: "#FFFFFF" },

  paidButton: {
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
    opacity: 0.85,
  },
  buttonDisabled: { opacity: 0.6 },
  paidButtonText: { fontSize: 17, fontWeight: "800", color: "#FFFFFF" },

  hint: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
  },
});

export default PaymentQrScreen;
