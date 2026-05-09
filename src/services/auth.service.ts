import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api.service';
import { STORAGE_KEYS } from '../utils/constants';
import { parseJWT } from '../utils/jwt';

export interface LoginCredentials {
  address: string;
  sub: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  walletAddress?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    walletAddress?: string;
  };
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const MAX_ROLE_RETRIES = 3;
    const ROLE_RETRY_DELAY_MS = 1000;

    let decoded: any;
    let token: string = '';

    for (let attempt = 1; attempt <= MAX_ROLE_RETRIES; attempt++) {
      const response = await apiService.post<{ token: string }>('/auth/login', credentials);
      token = response.data.token;
      decoded = parseJWT(token);
      // console.log(`Login attempt ${attempt}:`, decoded);

      if (decoded.roles) break;

      if (attempt < MAX_ROLE_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, ROLE_RETRY_DELAY_MS * attempt));
      }
    }

    const authResponse: AuthResponse = {
      user: {
        id: decoded.sub,
        email: '',
        name: '',
        role: decoded.roles.length > 0 ? decoded.roles : null,
        walletAddress: decoded.address,
      },
      accessToken: token,
      refreshToken: token,
    };

    await this.storeTokens(authResponse.accessToken, authResponse.refreshToken);
    return authResponse;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/register', data);
    await this.storeTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  }

  async saltUser(usersub: any): Promise<any> {
    const response = await apiService.get<{ salt: string }>(`/auth/salt/${usersub}`);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } finally {
      await this.clearTokens();
    }
  }

  async getCurrentUser() {
    const response = await apiService.get('/auth/me');
    return response.data;
  }

  async connectWallet(walletAddress: string): Promise<void> {
    await apiService.post('/auth/connect-wallet', { walletAddress });
  }

  private async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.ACCESS_TOKEN, accessToken],
      [STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
    ]);
  }

  private async clearTokens(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
    ]);
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    return !!token;
  }
}

export const authService = new AuthService();