// src/components/AppHeader.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import { useDispatch } from "react-redux";
import { logout, logoutUser } from "../store/authSlice";
import { useNavigation } from "@react-navigation/native";

type Props = {
  title: string;
};

const AppHeader = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch()
  // const { logout } = useAuth();

  const handleNavProfile = () => {
    navigation.navigate("Profile");
  }

  const handleLogout = () => {
    setTimeout(() => Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất không?",
      [
        {
          text: "Hủy",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Đăng xuất",
          onPress: async () => {
            try {
              dispatch(logout());
            } catch (error) {
              Alert.alert("Lỗi", "Đăng xuất thất bại");
            }
          },
          style: "destructive",
        },
      ]
    ), 0);
  };

  return (
    <View style={styles.topBar}>
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Ionicons name="leaf" size={20} color="#fff" />
        </View>
        <Text style={styles.logoText}>AgroTrust</Text>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.notificationButton} onPress={handleNavProfile}>
          <FontAwesome5 name="user-circle" size={24} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AppHeader;

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // marginBottom: 16,
    paddingTop: 62,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
