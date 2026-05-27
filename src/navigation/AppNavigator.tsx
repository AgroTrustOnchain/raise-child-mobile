import React, { useEffect } from 'react';
import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import LoadingScreen from '../screens/LoadingScreen';
import MainNavigator from './MainNavigator';
import AuthNavigator from './AuthNavigator';
import { VolunteerNavigator } from './VolunteerNavigator';
import PersonalInformationScreen from '../screens/profile/PersonalInformationScreen';
import { useWallet } from '../context/WalletContext';
import { fetchProfile } from '../store/authSlice';
import { Profile } from '../services/profile.service';

const isProfileComplete = (p: Profile | null): boolean =>
  !!(
    p &&
    p.first_name &&
    p.last_name &&
    p.gender &&
    p.date_of_birth &&
    p.phone_number &&
    p.email &&
    p.identity_code
  );

const ProfileGateStack = createNativeStackNavigator();

const ProfileGateNavigator = () => (
  <ProfileGateStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileGateStack.Screen
      name="Profile"
      component={PersonalInformationScreen}
    />
  </ProfileGateStack.Navigator>
);

// raisechild://payment/callback?tx_bytes=...&proposal_id=...&...
// BE must redirect to this URL after PayOS payment completes.
const linking: LinkingOptions<any> = {
  prefixes: ['raisechild://'],
  config: {
    screens: {
      Main: {
        screens: {
          Explore: {
            screens: {
              PaymentCallbackScreen: {
                path: 'payment/callback',
                // All query params are automatically passed as route.params
              },
            },
          },
        },
      },
    },
  },
};

const AppNavigator = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading, profile, isProfileLoading, user } = useSelector(
    (state: RootState) => state.auth,
  );
  const { wallet } = useWallet();

  // After login, ensure we have the latest profile so the gate decides correctly.
  useEffect(() => {
    if (isAuthenticated && wallet?.sub && !profile && !isProfileLoading) {
      dispatch(fetchProfile(wallet.sub));
    }
  }, [isAuthenticated, wallet?.sub, profile, isProfileLoading, dispatch]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // While we're fetching the profile right after login, show the loader so we
  // don't briefly flash the main app and then bounce to the profile screen.
  const profileNotResolved =
    isAuthenticated && wallet?.sub && !profile && isProfileLoading;
  if (profileNotResolved) {
    return <LoadingScreen />;
  }

  const needsProfile =
    isAuthenticated && profile && !isProfileComplete(profile);

  const isVolunteer = user?.role.includes('Volunteer');

  return (
    <NavigationContainer linking={linking}>
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : needsProfile ? (
        <ProfileGateNavigator />
      ) : isVolunteer ? (
        <VolunteerNavigator />
      ) : (
        <MainNavigator />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
