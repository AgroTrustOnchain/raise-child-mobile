// src/screens/auth/LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
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
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { GoogleSigninButton } from "@react-native-google-signin/google-signin";
import { useDispatch } from "react-redux";
import { loginUser, saltUser, setCredentials } from "../../store/authSlice";
import { AppDispatch } from "../../store";
import { getSubFromJWT } from "../../utils/jwt";
import { jwtToAddress } from "../../utils/zklogin";

const LoginScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const [isInProgress, setIsInProgress] = useState(false);
  const { isLoading, error } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const loginReponse : any = await dispatch(
            loginUser({ address: formData.email, sub: formData.password }),
          );

          console.log(loginReponse.payload);

    try {
      // await login(formData);
      // Navigation handled by AppNavigator when auth state changes
      dispatch(
        setCredentials({
          user: loginReponse.payload.user,
          // accessToken: idToken,
          refreshToken: "",
        } as any),
      );

      setIsInProgress(false);
      navigation.navigate("Home" as never);
    } catch (err: any) {
      Alert.alert("Login Failed", err.message || "Please try again");
    }
  };

  const handleForgotPassword = () => {
    Alert.alert("Forgot Password", "Password reset will be implemented");
  };

  const handleLoginWithGoogle = async () => {
    try {
      setIsInProgress(true);
      await GoogleSignin.hasPlayServices();
      const isSignedIn = await GoogleSignin.getCurrentUser();
      if (isSignedIn) {
        await GoogleSignin.signOut();
      }
      const response = await GoogleSignin.signIn();
      if (isSuccessResponse(response)) {
        // Send idToken to backend for authentication
        const { idToken, user }: any = response.data;
        const { name, email, photo } = user;

        // Extract the 'sub' field from the JWT
        const sub: any = getSubFromJWT(idToken);
        console.log("Google User ID (sub):", sub);

        dispatch(
              setCredentials({
                user: {
                  id: sub,
                  email,
                  name,
                  // role: "donor",
                  walletAddress: "",
                },
                accessToken: idToken,
                refreshToken: "",
              } as any),
            );

        // Dispatch saltUser to get user salt
        try {
          const saltResult = await dispatch(saltUser(sub)).unwrap();
          // console.log('User Salt:', saltResult);

          const userAddress = jwtToAddress(idToken, saltResult.salt, false);

          console.log("User Address:", userAddress);

          const loginReponse = await dispatch(
            loginUser({ address: userAddress, sub }),
          );

          console.log(loginReponse.payload);

          if (loginReponse.payload) {
            Alert.alert("Login Successful", "Welcome back!");
            

            setIsInProgress(false);
            navigation.navigate("Home" as never);
          } else {
            Alert.alert("Login Failed", "Unable to authenticate with Google");
            setIsInProgress(false);
          }

          
        } catch (saltError) {
          console.error("Error getting user salt:", saltError);
        }


        // Store user credentials
      } else {
        setIsInProgress(false);
        Alert.alert("Google Sign-In Failed", "Unable to sign in with Google");
      }
    } catch (error) {
      setIsInProgress(false);
      console.log("Google Sign-In Error:", error);
      Alert.alert(
        "Google Sign-In Failed",
        "An error occurred while signing in with Google",
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
          {/* Header with Glow Effect */}
          <View style={styles.header}>
            {/* <View style={styles.glowCircle} /> */}
            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="leaf" size={32} color="#1E40AF" />
              </View>
              <Text style={styles.title}>AgroTrust</Text>
              <Text style={styles.subtitle}>
                Secure login for transparent rural donations.
              </Text>
            </View>
          </View>

          {/* Form Content */}
          <View style={styles.formContainer}>
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#991B1B" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#9CA3AF"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="donor@agrotrust.io"
                  placeholderTextColor="#9CA3AF"
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, email: text })
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#9CA3AF"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={formData.password}
                  onChangeText={(text) =>
                    setFormData({ ...formData, password: text })
                  }
                  secureTextEntry
                />
              </View>
            </View>

            {/* Forgot Password Link */}
            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? "Logging in..." : "Login"}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialButtonsContainer}>
              <GoogleSigninButton
                size={GoogleSigninButton.Size.Wide}
                color={GoogleSigninButton.Color.Dark}
                onPress={() => {
                  handleLoginWithGoogle();
                  // initiate sign in
                }}
                disabled={isInProgress}
              />

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() =>
                  Alert.alert("Apple Login", "Apple login will be implemented")
                }
              >
                <Ionicons name="logo-apple" size={20} color="#000" />
                <Text style={styles.socialButtonText}>Apple</Text>
              </TouchableOpacity>
            </View>

            {/* Sign Up Link */}
            <TouchableOpacity
              onPress={() => navigation.navigate("Register" as never)}
              style={styles.signUpContainer}
            >
              <Text style={styles.signUpText}>
                New to AgroTrust?{" "}
                <Text style={styles.signUpLink}>Create an account</Text>
              </Text>
            </TouchableOpacity>

            {/* Secured Badge */}
            <View style={styles.securedRow}>
              <Ionicons name="lock-closed" size={12} color="#9CA3AF" />
              <Text style={styles.securedText}>Secured by Sui Network Protocol</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
  },
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
  header: {
    position: "relative",
    paddingTop: 40,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  glowCircle: {
    position: "absolute",
    top: -96,
    left: "50%",
    width: 192,
    height: 192,
    backgroundColor: "#EFF6FF",
    borderRadius: 96,
    transform: [{ translateX: -96 }],
    opacity: 0.6,
  },
  headerContent: {
    alignItems: "center",
    zIndex: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: "#EFF6FF",
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  formContainer: {
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: "#991B1B",
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E40AF",
  },
  loginButton: {
    backgroundColor: "#1E40AF",
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1E40AF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    paddingHorizontal: 8,
    fontSize: 14,
    color: "#6B7280",
  },
  socialButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: 8,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  signUpContainer: {
    alignItems: "center",
  },
  signUpText: {
    fontSize: 14,
    color: "#6B7280",
  },
  signUpLink: {
    color: "#1E40AF",
    fontWeight: "600",
  },
  securedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 20,
  },
  securedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
});

export default LoginScreen;
