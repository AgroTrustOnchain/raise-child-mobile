import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import ChildrenScreen from '../screens/volunteer/TaskScreen';
import UpdateScreen from '../screens/volunteer/UpdateScreen';
import VolunteerSettingsScreen from '../screens/volunteer/VolunteerSettingsScreen';
import CenterReqScreen from '../screens/volunteer/CenterReqScreen';
import WelfareUpdateScreen from '../screens/volunteer/Welfareupdatescreen';
import SubmittedProofsScreen from '../screens/volunteer/SubmittedProofsScreen';
import TaskDetailScreen from '../screens/volunteer/TaskDetailScreen';
import PersonalInformationScreen from '../screens/profile/PersonalInformationScreen';

export type VolunteerTabParamList = {
  Children: undefined;
  CenterReqs: undefined;
  Update: undefined;
  VolunteerSettings: undefined;
};

export type VolunteerStackParamList = {
  VolunteerTabs: undefined;
  WelfareUpdateDetail: { child: any };
  SubmittedProofs: undefined;
  TaskDetail: { taskId: string };
  PersonalInformationScreen: undefined;
};

const Tab = createBottomTabNavigator<VolunteerTabParamList>();
const Stack = createNativeStackNavigator<VolunteerStackParamList>();

const VolunteerTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Children') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'CenterReqs') {
            iconName = focused ? 'business' : 'business-outline';
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
        name="CenterReqs"
        component={CenterReqScreen}
        options={{ title: 'Center Reqs' }}
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

export const VolunteerNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VolunteerTabs" component={VolunteerTabs} />
      <Stack.Screen
        name="WelfareUpdateDetail"
        component={WelfareUpdateScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="SubmittedProofs"
        component={SubmittedProofsScreen}
      />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
      />
      <Stack.Screen
        name="PersonalInformationScreen"
        component={PersonalInformationScreen}
      />
    </Stack.Navigator>
  );
};
