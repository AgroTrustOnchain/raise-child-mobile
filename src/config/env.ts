import Constants from 'expo-constants';

export const ENV = {
  API_URL: Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001/api',
  INFURA_PROJECT_ID: Constants.expoConfig?.extra?.infuraId || '',
  NETWORK: 'goerli',
};