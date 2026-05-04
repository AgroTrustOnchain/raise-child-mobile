import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

type CallbackStatus = "success" | "error" | "cancelled";

const PaymentCallbackScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();

  const params = (route.params ?? {}) as {
    status?: CallbackStatus;
    title?: string;
    message?: string;
  };

  const status: CallbackStatus =
    params.status === "cancelled"
      ? "cancelled"
      : params.status === "error"
      ? "error"
      : "success";

  const isSuccess = status === "success";
  const isCancelled = status === "cancelled";

  const title =
    params.title ??
    (isSuccess
      ? "Quyên góp thành công!"
      : isCancelled
      ? "Giao dịch đã bị huỷ"
      : "Giao dịch thất bại");

  const message =
    params.message ??
    (isSuccess
      ? "Thanh toán của bạn đã được ghi nhận thành công."
      : isCancelled
      ? "Bạn đã huỷ giao dịch hoặc giao dịch bị huỷ bởi hệ thống thanh toán."
      : "Đã xảy ra lỗi trong quá trình xử lý. Vui lòng thử lại.");

  const iconName = isSuccess ? "checkmark-circle" : isCancelled ? "close-circle-outline" : "close-circle";
  const iconColor = isSuccess ? "#1E40AF" : isCancelled ? "#D97706" : "#DC2626";
  const iconBg = isSuccess ? "#EFF6FF" : isCancelled ? "#FFFBEB" : "#FEE2E2";

  const buttonLabel = isSuccess ? "Về trang Khám phá" : isCancelled ? "Thử lại" : "Quay lại";

  const handleButton = () => {
    if (isCancelled) {
      navigation.goBack();
      return;
    }
    navigation.reset({
      index: 0,
      routes: [
        {
          name: "Main",
          state: {
            routes: [
              {
                name: "Explore",
                state: { routes: [{ name: "Discover" }] },
              },
            ],
          },
        },
      ],
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={64} color={iconColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{message}</Text>

      <TouchableOpacity
        style={[styles.button, isCancelled && styles.buttonWarning]}
        onPress={handleButton}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </TouchableOpacity>

      {!isSuccess && (
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [{ name: "Main", state: { routes: [{ name: "Explore", state: { routes: [{ name: "Discover" }] } }] } }],
            })
          }
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>Về trang Khám phá</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  iconWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1E40AF",
    height: 60,
    borderRadius: 16,
    paddingHorizontal: 32,
    width: "100%",
    shadowColor: "#1E40AF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  buttonWarning: {
    backgroundColor: "#D97706",
    shadowColor: "#D97706",
  },
  buttonText: { fontSize: 17, fontWeight: "800", color: "#FFFFFF" },
  secondaryButton: { paddingVertical: 12, paddingHorizontal: 24 },
  secondaryButtonText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
});

export default PaymentCallbackScreen;
