import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { donateToPool, getPaymentStatus } from "../../services/payment.service";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20;
const SUCCESS_STATUSES = new Set(["PAID", "paid", "SUCCESS", "Success", "success", "completed", "COMPLETED"]);
const CANCELLED_STATUSES = new Set(["CANCELLED", "Cancelled", "cancelled", "CANCELED", "canceled"]);

const DonateRegionScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = route.params as { pool_id: string; region: string };

  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [donating, setDonating] = useState(false);

  // Polling state
  const [waitingPayment, setWaitingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const paymentIdRef = useRef<string | number | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef = useRef(0);
  const resolvedRef = useRef(false);

  const clearPoll = () => {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  };

  const navigateToResult = useCallback((
    status: "success" | "cancelled",
    data: { amount?: number; description?: string }
  ) => {
    resolvedRef.current = true;
    clearPoll();
    if (status === "cancelled") {
      navigation.replace("PaymentCallbackScreen", {
        status: "cancelled",
        title: "Giao dịch đã bị huỷ",
        message: "Giao dịch đã bị huỷ bởi người dùng hoặc hệ thống thanh toán.",
      });
      return;
    }
    const parts: string[] = [];
    if (typeof data.amount === "number" && data.amount > 0) {
      parts.push(`Khoản thanh toán ${data.amount.toLocaleString("vi-VN")}đ đã được ghi nhận.`);
    } else {
      parts.push("Khoản thanh toán của bạn đã được ghi nhận.");
    }
    if (data.description) parts.push(data.description);
    navigation.replace("PaymentCallbackScreen", {
      status: "success",
      title: "Quyên góp thành công!",
      message: parts.join(" "),
    });
  }, [navigation]);

  const checkStatus = useCallback(async () => {
    const pid = paymentIdRef.current;
    if (!pid || resolvedRef.current) return;
    try {
      const data = await getPaymentStatus(pid);
      const status = data.status ?? "";
      setPaymentStatus(status);
      if (SUCCESS_STATUSES.has(status)) {
        navigateToResult("success", data);
        return;
      }
      if (CANCELLED_STATUSES.has(status)) {
        navigateToResult("cancelled", data);
        return;
      }
    } catch (err) {
      console.warn("[Poll] status check failed", err);
    }
    pollCountRef.current += 1;
    if (pollCountRef.current < MAX_POLLS) {
      pollTimer.current = setTimeout(checkStatus, POLL_INTERVAL_MS);
    }
  }, [navigateToResult]);

  useEffect(() => () => clearPoll(), []);

  const handleDonate = async () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert("Số tiền không hợp lệ", "Vui lòng nhập số tiền quyên góp hợp lệ.");
      return;
    }
    try {
      setDonating(true);
      const res = await donateToPool({
        amount: numAmount,
        message: message.trim(),
        pool_id: params.pool_id,
      });

      if (res?.url) {
        // Open payment URL in browser
        const supported = await Linking.canOpenURL(res.url);
        if (supported) await Linking.openURL(res.url);
        else Alert.alert("Lỗi", "Không thể mở liên kết thanh toán.");

        // Start polling on this screen
        const pid = res.payment_id ?? res.order_code ?? res.id ?? null;
        if (pid) {
          paymentIdRef.current = pid;
          pollCountRef.current = 0;
          resolvedRef.current = false;
          setPaymentStatus(null);
          setWaitingPayment(true);
          pollTimer.current = setTimeout(checkStatus, POLL_INTERVAL_MS);
        }
      } else {
        Alert.alert("Thành công", "Đã gửi quyên góp!", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Donation failed. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setDonating(false);
    }
  };

  const handleManualCheck = async () => {
    const pid = paymentIdRef.current;
    if (!pid) return;
    setChecking(true);
    clearPoll();
    try {
      const data = await getPaymentStatus(pid);
      const status = data.status ?? "";
      setPaymentStatus(status);
      if (SUCCESS_STATUSES.has(status)) {
        navigateToResult("success", data);
      } else if (CANCELLED_STATUSES.has(status)) {
        navigateToResult("cancelled", data);
      } else {
        Alert.alert(
          "Chưa xác nhận",
          `Trạng thái: ${status || "Đang xử lý"}. Vui lòng thử lại sau vài giây.`
        );
        pollTimer.current = setTimeout(checkStatus, POLL_INTERVAL_MS);
      }
    } catch {
      Alert.alert("Lỗi", "Không thể kiểm tra trạng thái. Vui lòng thử lại.");
      pollTimer.current = setTimeout(checkStatus, POLL_INTERVAL_MS);
    } finally {
      setChecking(false);
    }
  };

  const handleCancelWaiting = () => {
    clearPoll();
    setWaitingPayment(false);
    setPaymentStatus(null);
    paymentIdRef.current = null;
    pollCountRef.current = 0;
    resolvedRef.current = false;
  };

  // ── Waiting overlay ──────────────────────────────────────────────────────────
  if (waitingPayment) {
    const timedOut = pollCountRef.current >= MAX_POLLS;
    return (
      <View style={styles.container}>
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.navButton} onPress={handleCancelWaiting}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.navTitle} numberOfLines={1}>
            Quyên góp cho {params.region}
          </Text>
          <View style={styles.navButton} />
        </View>

        <View style={styles.waitingContent}>
          <View style={styles.waitingIconCircle}>
            <Ionicons name="card-outline" size={40} color="#1E40AF" />
          </View>
          <Text style={styles.waitingTitle}>Đang chờ thanh toán</Text>
          <Text style={styles.waitingSubtitle}>
            Hoàn tất thanh toán trên trình duyệt. Ứng dụng sẽ tự động chuyển khi giao dịch thành công.
          </Text>

          <View style={styles.pollingRow}>
            <ActivityIndicator
              size="small"
              color={timedOut ? "#9CA3AF" : "#1E40AF"}
              animating={!timedOut && !resolvedRef.current}
            />
            <Text style={styles.pollingText}>
              {timedOut
                ? "Tự động kiểm tra đã hết thời gian — nhấn nút bên dưới để xác nhận"
                : paymentStatus
                ? `Trạng thái: ${paymentStatus}`
                : "Đang tự động kiểm tra trạng thái thanh toán…"}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.confirmButton, checking && styles.buttonDisabled]}
            onPress={handleManualCheck}
            disabled={checking}
            activeOpacity={0.85}
          >
            {checking ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Tôi đã thanh toán xong</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelWaiting} activeOpacity={0.7}>
            <Text style={styles.cancelButtonText}>Huỷ giao dịch</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Donation form ────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          Quyên góp cho {params.region}
        </Text>
        <View style={styles.navButton} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.iconWrap}>
            <Ionicons name="heart" size={48} color="#1E40AF" />
          </View>

          <Text style={styles.label}>Số tiền (VND)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2000"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <Text style={styles.label}>Lời nhắn (không bắt buộc)</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Để lại lời nhắn..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
          />

          <TouchableOpacity
            style={[styles.submitButton, donating && styles.submitButtonDisabled]}
            onPress={handleDonate}
            disabled={donating}
            activeOpacity={0.85}
          >
            {donating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="heart" size={18} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Xác nhận quyên góp</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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

  // Form
  content: { padding: 24, paddingTop: 32 },
  iconWrap: {
    alignSelf: "center",
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  label: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 8 },
  input: {
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    marginBottom: 20,
  },
  inputMultiline: { height: 100, textAlignVertical: "top" },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1E40AF",
    height: 60,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: "#1E40AF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: 17, fontWeight: "800", color: "#FFFFFF" },

  // Waiting state
  waitingContent: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  waitingIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  waitingTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  waitingSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
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
    marginBottom: 20,
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
  confirmButton: {
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
  buttonDisabled: { opacity: 0.6 },
  confirmButtonText: { fontSize: 17, fontWeight: "800", color: "#FFFFFF" },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelButtonText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
});

export default DonateRegionScreen;
