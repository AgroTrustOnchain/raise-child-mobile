import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/nft/HomeScreen";
// import ExploreScreen from '../screens/nft/ExploreScreen';
import CreateNFTScreen from "../screens/nft/CreateNFTScreen";
import DiscoverScreen from "../screens/discover/DiscoverScreen";
import AppHeader from "../components/AppHeader ";
import CampaignDetail from "../screens/discover/CampaignDetail";
import ChildDetailScreen from "../screens/discover/ChildDetailScreen";
import MyTrackScreen from "../screens/track/MyTrackScreen";
import ProofScreen from "../screens/track/ProofScreen";
import WalletScreen from "../screens/wallet/WalletScreen";
import WithdrawalScreen from "../screens/wallet/WithdrawalScreen";
import SponsorshipScreen from "../screens/discover/Sponsorshipscreen";
// import NFTDetailScreen from '../screens/nft/NFTDetailScreen';
// import ProfileScreen from '../screens/profile/ProfileScreen';

export type NFTStackParamList = {
  NFTHome: undefined;
  NFTDetail: { nftId: string };
  Discover: undefined;
  CampaignDetail: { nftId: string };
  ChildDetailScreen: { childId: string };
  MyTrackScreen: undefined;
  ProofScreen: { childId: string };
  SponsorshipScreen: { childId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Wallet: undefined;
  Withdrawal: undefined;
  Track: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<NFTStackParamList>();

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
      {/* <Stack.Screen 
        name="NFTDetail" 
        component={NFTDetailScreen} 
        options={{ title: 'NFT Details' }} 
      /> */}
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
        name="SponsorshipScreen" 
        component={SponsorshipScreen} 
        options={{ title: 'Sponsorship' }} 
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
          } else if (route.name === "Wallet") {
            iconName = focused ? "wallet" : "wallet-outline";
          } else if (route.name === "Withdrawal") {
            iconName = focused ? "card" : "card-outline";
          } else if (route.name === "Track") {
            iconName = focused ? "list" : "list-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
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
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Explore" component={DiscoverStack} options={{ headerShown: false }}/>
      <Tab.Screen name="Wallet" component={WalletScreen} options={{ headerShown: true }}/>
      <Tab.Screen name="Withdrawal" component={WithdrawalScreen} options={{ headerShown: true }}/>
      <Tab.Screen name="Track" component={TrackStack} options={{ headerShown: false }}/>
      {/* <Tab.Screen name="Profile" component={ProfileScreen} /> */}
    </Tab.Navigator>
  );
};

export default MainNavigator;
