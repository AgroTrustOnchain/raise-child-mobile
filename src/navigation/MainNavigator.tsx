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
// import NFTDetailScreen from '../screens/nft/NFTDetailScreen';
// import WalletScreen from '../screens/wallet/WalletScreen';
// import ProfileScreen from '../screens/profile/ProfileScreen';

export type NFTStackParamList = {
  NFTHome: undefined;
  NFTDetail: { nftId: string };
  Discover: undefined;
  CampaignDetail: { nftId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Create: undefined;
  Wallet: undefined;
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
          } else if (route.name === "Create") {
            iconName = focused ? "add-circle" : "add-circle-outline";
          } else if (route.name === "Wallet") {
            iconName = focused ? "wallet" : "wallet-outline";
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
      <Tab.Screen name="Create" component={CreateNFTScreen} />
      {/* <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} /> */}
    </Tab.Navigator>
  );
};

export default MainNavigator;
