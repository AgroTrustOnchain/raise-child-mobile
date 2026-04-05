import "react-native-get-random-values"; // Must be first!
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { store } from "./src/store";
import AppNavigator from "./src/navigation/AppNavigator";
import { useEffect } from "react";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { ENV } from "./src/config/env";
import { WalletCustomProvider } from "./src/context/WalletContext";

export default function App() {
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: ENV.CLIENT_ID,
      iosClientId: ENV.IOS_CLIENT_ID,
      profileImageSize: 150,
    });
  }, []);
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <WalletCustomProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </WalletCustomProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
