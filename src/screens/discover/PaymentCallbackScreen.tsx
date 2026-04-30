import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

type CallbackStatus = "success" | "error";

const PaymentCallbackScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();

  const params = (route.params ?? {}) as {
    status?: CallbackStatus;
    title?: string;
    message?: string;
  };

  const status: CallbackStatus = params.status === "error" ? "error" : "success";
  const isError = status === "error";

  const title =
    params.title ??
    (isError ? "Giao dịch thất bại" : "Quyên góp thành công!");

  const message =
    params.message ??
    (isError
      ? "Đã xảy ra lỗi trong quá trình xử lý. Vui lòng thử lại."
      : "Thanh toán của bạn đã được ghi nhận thành công.");

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, isError ? styles.iconError : styles.iconSuccess]}>
        <Ionicons
          name={isError ? "close-circle" : "checkmark-circle"}
          size={64}
          color={isError ? "#DC2626" : "#1E40AF"}
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{message}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
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
          })
        }
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>
          {isError ? "Quay lại" : "Về trang Khám phá"}
        </Text>
      </TouchableOpacity>
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
  iconSuccess: { backgroundColor: "#EFF6FF" },
  iconError: { backgroundColor: "#FEE2E2" },
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
  },
  buttonText: { fontSize: 17, fontWeight: "800", color: "#FFFFFF" },
});

export default PaymentCallbackScreen;
