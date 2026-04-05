import Constants from 'expo-constants';

export const ENV = {
  API_URL: Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001/api',
  INFURA_PROJECT_ID: Constants.expoConfig?.extra?.infuraId || '',
  NETWORK: 'goerli',
  CLIENT_ID: Constants.expoConfig?.extra?.clientId || '189055599254-q1etd5r8rvkvf9memgou1bp08cu4791j.apps.googleusercontent.com',
  IOS_CLIENT_ID: Constants.expoConfig?.extra?.iosClientId || '189055599254-5546cfglttl20jv5qg0d57po8b9adl8k.apps.googleusercontent.com',
};