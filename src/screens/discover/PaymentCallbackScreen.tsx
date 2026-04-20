import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { executeTransaction } from "../../services/payment.service";
import { useWallet } from "../../context/WalletContext";

type Status = "signing" | "done" | "error";

const PaymentCallbackScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { wallet } = useWallet();

  // Params passed by the deep link via React Navigation linking config
  const params = route.params as {
    tx_bytes?: string;
    proposal_id?: string;
    center_req?: string;
    registration_req?: string;
    upload_child_req?: string;
  };

  const [status, setStatus] = useState<Status>("signing");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    signAndExecute();
  }, []);

  const signAndExecute = async () => {
    try {
      const { tx_bytes, proposal_id, center_req, registration_req, upload_child_req } =
        params ?? {};

      if (!tx_bytes) {
        setErrorMsg("Missing transaction data. Please try donating again.");
        setStatus("error");
        return;
      }

      const keypair: Ed25519Keypair =
        wallet?.ephemeralKeyPair ?? Ed25519Keypair.generate();

      // Decode base64 without Buffer (not available in React Native)
      const binaryStr = atob(tx_bytes);
      const txBytesArray = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        txBytesArray[i] = binaryStr.charCodeAt(i);
      }

      const { signature } = await keypair.signTransaction(txBytesArray);

      await executeTransaction({
        tx_bytes,
        signature,
        proposal_id: proposal_id ?? "",
        center_req: center_req ?? "",
        registration_req: registration_req ?? "",
        upload_child_req: upload_child_req ?? "",
      });

      setStatus("done");
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Transaction failed.";
      setErrorMsg(msg);
      setStatus("error");
    }
  };

  if (status === "signing") {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1E40AF" style={styles.spinner} />
        <Text style={styles.title}>Signing Transaction</Text>
        <Text style={styles.subtitle}>
          Verifying your payment and submitting to the SUI network…
        </Text>
      </View>
    );
  }

  if (status === "error") {
    return (
      <View style={styles.container}>
        <View style={[styles.iconWrap, styles.iconError]}>
          <Ionicons name="close-circle" size={64} color="#DC2626" />
        </View>
        <Text style={styles.title}>Transaction Failed</Text>
        <Text style={styles.subtitle}>{errorMsg}</Text>
        <TouchableOpacity
          style={[styles.button, styles.buttonRetry]}
          onPress={signAndExecute}
          activeOpacity={0.85}
        >
          <Ionicons name="refresh" size={18} color="#FFFFFF" />
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={() => navigation.navigate("Explore")}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonSecondaryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, styles.iconSuccess]}>
        <Ionicons name="checkmark-circle" size={64} color="#1E40AF" />
      </View>
      <Text style={styles.title}>Donation Successful!</Text>
      <Text style={styles.subtitle}>
        Your payment has been verified and the transaction was submitted to the SUI network.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Explore")}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>Back to Explore</Text>
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
  spinner: { marginBottom: 24 },
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
    marginBottom: 12,
  },
  buttonRetry: { backgroundColor: "#DC2626", shadowColor: "#DC2626" },
  buttonText: { fontSize: 17, fontWeight: "800", color: "#FFFFFF" },
  buttonSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonSecondaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
});

export default PaymentCallbackScreen;
