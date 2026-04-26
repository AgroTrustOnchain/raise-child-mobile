import React, { useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { donateToPool } from "../../services/payment.service";

const DonateRegionScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = route.params as { pool_id: string; region: string };

  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [donating, setDonating] = useState(false);

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
        navigation.navigate("PaymentQrScreen", {
          paymentUrl: res.url,
          title: `Donate to ${params.region}`,
        });
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

          <Text style={styles.label}>Số tiền (SUI)</Text>
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
});

export default DonateRegionScreen;
