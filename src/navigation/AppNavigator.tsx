import React from 'react';
import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import LoadingScreen from '../screens/LoadingScreen';
import MainNavigator from './MainNavigator';
import AuthNavigator from './AuthNavigator';

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
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer linking={linking}>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;
