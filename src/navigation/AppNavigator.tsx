import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// import AuthNavigator from './AuthNavigator';
// import MainNavigator from './MainNavigator';
import LoadingScreen from '../screens/LoadingScreen';
import HomeScreen from '../screens/nft/HomeScreen';
import MainNavigator from './MainNavigator';
import AuthNavigator from './AuthNavigator';

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {/* {isAuthenticated ? <MainNavigator  /> : <AuthNavigator  />} */}
      <MainNavigator  /> 
    </NavigationContainer>
  );
};

export default AppNavigator;