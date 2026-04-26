// src/screens/auth/LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../hooks/useAuth";
import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";
import { GoogleSigninButton } from "@react-native-google-signin/google-signin";
import { useDispatch } from "react-redux";
import { loginUser, saltUser } from "../../store/authSlice";
import { AppDispatch } from "../../store";
import { getSubFromJWT } from "../../utils/jwt";
import { jwtToAddress } from "../../utils/zklogin";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { generateNonce, generateRandomness } from "@mysten/sui/zklogin";
import { useWallet } from "../../context/WalletContext";

const SUI_RPC = "https://fullnode.testnet.sui.io";

const getCurrentEpoch = async (): Promise<number> => {
  const res = await fetch(SUI_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "suix_getLatestSuiSystemState", params: [] }),
  });
  const json = await res.json();
  return Number(json.result.epoch);
};

const LoginScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const [isInProgress, setIsInProgress] = useState(false);
  const { error } = useAuth();
  const { setWallet } = useWallet();

  const handleLoginWithGoogle = async () => {
    try {
      setIsInProgress(true);
      await GoogleSignin.hasPlayServices();
      const isSignedIn = GoogleSignin.getCurrentUser();
      if (isSignedIn) {
        await GoogleSignin.signOut();
      }
      const response = await GoogleSignin.signIn();
      if (isSuccessResponse(response)) {
        const { idToken }: any = response.data;

        const sub: any = getSubFromJWT(idToken);
        console.log("Google User ID (sub):", sub);

        try {
          const saltResult = await dispatch(saltUser(sub)).unwrap();
          const userAddress = jwtToAddress(idToken, saltResult.salt, false);
          console.log("User Address:", userAddress);

          const ephemeralKeyPair = Ed25519Keypair.generate();
          const randomness = generateRandomness();
          const currentEpoch = await getCurrentEpoch();
          const maxEpoch = currentEpoch + 2;
          const nonce = generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch, randomness);
          console.log("Nonce:", nonce);

          const loginResponse = await dispatch(
            loginUser({ address: userAddress, sub }),
          );

          if (loginResponse.payload) {
            setWallet({
              address: userAddress,
              sub,
              ephemeralKeyPair,
              jwt: idToken,
              randomness: randomness.toString(),
              maxEpoch,
              salt: saltResult.salt,
            });
            Alert.alert("Đăng nhập thành công", "Chào mừng trở lại!");
            setIsInProgress(false);
          } else {
            Alert.alert("Đăng nhập thất bại", "Không thể xác thực với Google");
            setIsInProgress(false);
          }
        } catch (saltError) {
          console.error("Error getting user salt:", saltError);
          setIsInProgress(false);
        }
      } else {
        setIsInProgress(false);
        Alert.alert("Đăng nhập Google thất bại", "Không thể đăng nhập bằng Google");
      }
    } catch (err) {
      setIsInProgress(false);
      console.log("Google Sign-In Error:", err);
      Alert.alert(
        "Đăng nhập Google thất bại",
        "Đã xảy ra lỗi khi đăng nhập bằng Google",
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="leaf" size={32} color="#1E40AF" />
              </View>
              <Text style={styles.title}>AgroTrust</Text>
              <Text style={styles.subtitle}>
                Đăng nhập bảo mật cho các khoản quyên góp nông thôn minh bạch.
              </Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#991B1B" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.googleButtonWrapper}>
              <GoogleSigninButton
                size={GoogleSigninButton.Size.Wide}
                color={GoogleSigninButton.Color.Dark}
                onPress={handleLoginWithGoogle}
                disabled={isInProgress}
              />
            </View>

            <View style={styles.securedRow}>
              <Ionicons name="lock-closed" size={12} color="#9CA3AF" />
              <Text style={styles.securedText}>
                Bảo mật bởi Giao thức Mạng Sui
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 16 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  header: { paddingTop: 40, paddingBottom: 24, paddingHorizontal: 24, alignItems: "center" },
  headerContent: { alignItems: "center" },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: "#EFF6FF",
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#111827", marginBottom: 4, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#6B7280", textAlign: "center", paddingHorizontal: 16 },
  formContainer: { paddingHorizontal: 32, paddingBottom: 40 },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: { flex: 1, color: "#991B1B", fontSize: 14 },
  googleButtonWrapper: { alignItems: "center", marginBottom: 24 },
  securedRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  securedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
});

export default LoginScreen;
