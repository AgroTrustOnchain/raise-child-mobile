import React, { useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StackActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAppSelector } from "../store";
import HomeScreen from "../screens/nft/HomeScreen";
import DiscoverScreen from "../screens/discover/DiscoverScreen";
import AppHeader from "../components/AppHeader ";
import CampaignDetail from "../screens/discover/CampaignDetail";
import ChildDetailScreen from "../screens/discover/ChildDetailScreen";
import MyTrackScreen from "../screens/track/MyTrackScreen";
import ProofScreen from "../screens/track/ProofScreen";
import WithdrawalScreen from "../screens/wallet/WithdrawalScreen";
import ChildProofScreen from "../screens/discover/ChildProofScreen";
import DonateRegionScreen from "../screens/discover/DonateRegionScreen";
import SupportedRegionsScreen from "../screens/discover/SupportedRegionsScreen";
import PaymentCallbackScreen from "../screens/discover/PaymentCallbackScreen";
import PaymentQrScreen from "../screens/discover/PaymentQrScreen";
import WalletScreen from "../screens/wallet/WalletScreen";
import PersonalInformationScreen from "../screens/profile/PersonalInformationScreen";
import WelfareUpdateScreen from "../screens/volunteer/Welfareupdatescreen";
import SettingsScreen from "../screens/settings/SettingsScreen";
import RegistrationFormScreen from "../screens/settings/RegistrationFormScreen";
import ChildUploadReqScreen from "../screens/profile/ChildUploadReqScreen";
import { VolunteerNavigator } from "./VolunteerNavigator";

// Define all global/modal screens that aren't in tab navigation
export type GlobalModalParamList = {
  WelfareUpdate: undefined;
  WelfareUpdateDetail: { child: any };
  Profile: undefined;
  Volunteer: undefined;
  RegistrationForm: { region?: string } | undefined;
  SupportedRegions: undefined;
  Wallet: undefined;
  ChildUploadReq: undefined;
  PaymentCallbackScreen: {
    status?: string;
    title?: string;
    message?: string;
    tx_bytes?: string;
    proposal_id?: string;
    center_req?: string;
    registration_req?: string;
    upload_child_req?: string;
  };
  // CreateNFT: undefined;
  // Add more modal screens here as needed
  // ChildHealthReport: { childId: string };
  // EmergencyAlert: { childId: string };
};

export type NFTStackParamList = {
  NFTHome: undefined;
  NFTDetail: { nftId: string };
  Discover: undefined;
  CampaignDetail: { nftId: string };
  ChildDetailScreen: { childId: string };
  MyTrackScreen: undefined;
  ProofScreen: { childId: string };
  ChildProofScreen: { childId: string; childName: string };
  SupportedRegionsScreen: undefined;
  DonateRegionScreen: { pool_id: string; region: string };
  PaymentCallbackScreen: {
    tx_bytes?: string;
    proposal_id?: string;
    center_req?: string;
    registration_req?: string;
    upload_child_req?: string;
  };
  PaymentQrScreen: { paymentUrl: string; paymentId?: string | number; title?: string };
};

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Regions: undefined;
  Withdrawal: undefined;
  Track: undefined;
  Settings: undefined;
};

// Combined params for root navigator
export type RootStackParamList = GlobalModalParamList & {
  Main: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<NFTStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const NFTStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        header: ({ route }) => <AppHeader />,
      }}
    >
      <Stack.Screen
        name="NFTHome"
        component={HomeScreen}
        options={{ title: "My NFTs" }}
      />
    </Stack.Navigator>
  );
};

const DiscoverStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        header: ({ route }) => <AppHeader />,
      }}
    >
      <Stack.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{ title: "Discover" }}
      />
      <Stack.Screen 
        name="CampaignDetail" 
        component={CampaignDetail} 
        options={{ title: 'Campaign Details' }} 
      />
      <Stack.Screen 
        name="ChildDetailScreen" 
        component={ChildDetailScreen} 
        options={{ title: 'Child Details' }} 
      />
      <Stack.Screen
        name="ChildProofScreen"
        component={ChildProofScreen}
        options={{ title: 'Impact Proof' }}
      />
      <Stack.Screen
        name="SupportedRegionsScreen"
        component={SupportedRegionsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DonateRegionScreen"
        component={DonateRegionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PaymentCallbackScreen"
        component={PaymentCallbackScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PaymentQrScreen"
        component={PaymentQrScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const TrackStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        header: ({ route }) => <AppHeader />,
      }}
    >
      <Stack.Screen
        name="MyTrackScreen"
        component={MyTrackScreen}
        options={{ title: "My Track" }}
      />
      <Stack.Screen
        name="ProofScreen"
        component={ProofScreen}
        options={{ title: "Impact Proof" }}
      />
    </Stack.Navigator>
  );
};

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        header: () => <AppHeader />,
        
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Explore") {
            iconName = focused ? "compass" : "compass-outline";
          } else if (route.name === "Regions") {
            iconName = focused ? "map" : "map-outline";
          } else if (route.name === "Withdrawal") {
            iconName = focused ? "card" : "card-outline";
          } else if (route.name === "Track") {
            iconName = focused ? "list" : "list-outline";
          } else if (route.name === "Settings") {
            iconName = focused ? "settings" : "settings-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#6366f1",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name="Home"
        component={NFTStack}
        options={{ headerShown: false, tabBarLabel: "Trang chủ" }}
      />
      <Tab.Screen
        name="Explore"
        component={DiscoverStack}
        options={{ headerShown: false, tabBarLabel: "Khám phá" }}
        // listeners={({ navigation }) => ({
        //   blur: () => {
        //     if (navigation.canGoBack()) {
        //       navigation.dispatch(StackActions.popToTop());
        //     }
        //   },
        // })}
      />
      <Tab.Screen
        name="Regions"
        component={SupportedRegionsScreen}
        options={{ headerShown: true, tabBarLabel: "Khu vực" }}
      />
      <Tab.Screen
        name="Withdrawal"
        component={WithdrawalScreen}
        options={{ headerShown: true, tabBarLabel: "Rút tiền" }}
      />
      <Tab.Screen
        name="Track"
        component={TrackStack}
        options={{ headerShown: false, tabBarLabel: "Theo dõi" }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: false, tabBarLabel: "Cài đặt" }}
      />
    </Tab.Navigator>
  );
};

/**
 * RootNavigator with Global Modal Stack
 * 
 * This navigator handles:
 * - Main tab navigation
 * - Global modal screens (welfare updates, alerts, etc.)
 * 
 * Benefits:
 * - Modals appear above all tab content
 * - Can navigate to modals from anywhere in the app
 * - Modals don't mess with tab state
 */
export const RootNavigator = () => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        // animationEnabled: true,
      }}
    >
      {/* Main Tab Navigation */}
      <RootStack.Group>
        <RootStack.Screen
          name="Main"
          component={MainNavigator}
          // options={{ animationEnabled: false }}
        />
      </RootStack.Group>

      {/* Global Modal Stack - appears above everything */}
      <RootStack.Group screenOptions={{ presentation: 'modal' }}>
        <RootStack.Screen
          name="WelfareUpdate"
          component={WelfareUpdateScreen}
          options={{
            title: 'Welfare Update',
            headerShown: false,
            // animationEnabled: true,
          }}
        />
        <RootStack.Screen
          name="WelfareUpdateDetail"
          component={WelfareUpdateScreen}
          options={{
            title: 'Welfare Update',
            headerShown: false,
            // animationEnabled: true,
          }}
        />
        <RootStack.Screen
          name="Profile"
          component={PersonalInformationScreen}
          options={{
            title: 'Create NFT',
            headerShown: false,
            // animationEnabled: true,
          }}
        />
        <RootStack.Screen
          name="Volunteer"
          component={VolunteerNavigator}
          options={{
            title: 'Volunteer Mode',
            headerShown: false,
            // animationEnabled: true,
          }}
        />
        <RootStack.Screen
          name="RegistrationForm"
          component={RegistrationFormScreen}
          options={{ title: 'Registration Form', headerShown: false }}
        />
        <RootStack.Screen
          name="Wallet"
          component={WalletScreen}
          options={{ title: 'Wallet', headerShown: false }}
        />
        <RootStack.Screen
          name="SupportedRegions"
          component={SupportedRegionsScreen}
          options={{ title: 'Regions Needing Support', headerShown: false }}
        />
        <RootStack.Screen
          name="ChildUploadReq"
          component={ChildUploadReqScreen}
          options={{ title: 'Đăng ký trẻ em', headerShown: false }}
        />
        <RootStack.Screen
          name="PaymentCallbackScreen"
          component={PaymentCallbackScreen}
          options={{ headerShown: false }}
        />
        {/* Add more global modal screens here as needed */}
        {/* <RootStack.Screen
          name="ChildHealthReport"
          component={ChildHealthReportScreen}
          options={{
            title: 'Health Report',
            headerShown: false,
          }}
        /> */}
      </RootStack.Group>
    </RootStack.Navigator>
  );
};

export default RootNavigator;