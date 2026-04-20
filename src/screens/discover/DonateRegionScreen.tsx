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
      Alert.alert("Invalid amount", "Please enter a valid donation amount.");
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
        Alert.alert("Success", "Donation submitted!", [
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
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          Donate to {params.region}
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
            <Ionicons name="heart" size={48} color="#13ec5b" />
          </View>

          <Text style={styles.label}>Amount (SUI)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2000"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <Text style={styles.label}>Message (optional)</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Leave a message..."
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
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="heart" size={18} color="#fff" />
                <Text style={styles.submitButtonText}>Confirm Donation</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: "rgba(246, 248, 246, 0.9)",
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
  content: { padding: 24, paddingTop: 32 },
  iconWrap: {
    alignSelf: "center",
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(19, 236, 91, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
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
    backgroundColor: "#13ec5b",
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: "#13ec5b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});

export default DonateRegionScreen;
