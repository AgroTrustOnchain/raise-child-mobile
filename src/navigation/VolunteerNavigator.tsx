import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import ChildrenScreen from '../screens/volunteer/ChildrenScreen';
import UpdateScreen from '../screens/volunteer/UpdateScreen';
import VolunteerSettingsScreen from '../screens/volunteer/VolunteerSettingsScreen';

export type VolunteerTabParamList = {
  Children: undefined;
  Update: undefined;
  VolunteerSettings: undefined;
};

const Tab = createBottomTabNavigator<VolunteerTabParamList>();

export const VolunteerNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Children') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Update') {
            iconName = focused ? 'cloud-upload' : 'cloud-upload-outline';
          } else if (route.name === 'VolunteerSettings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Children"
        component={ChildrenScreen}
        options={{
          title: 'Children',
        }}
      />
      <Tab.Screen
        name="Update"
        component={UpdateScreen}
        options={{
          title: 'Update',
        }}
      />
      <Tab.Screen
        name="VolunteerSettings"
        component={VolunteerSettingsScreen}
        options={{
          title: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};
