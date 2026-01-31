// src/hooks/useAuth.ts
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { 
  loginUser, 
  registerUser, 
  logoutUser, 
  fetchCurrentUser,
  connectWallet as connectWalletAction
} from '../store/authSlice';
import { LoginCredentials, RegisterData } from '../services/auth.service';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);

  /**
   * Login user with email and password
   */
  const login = async (credentials: LoginCredentials) => {
    return dispatch(loginUser(credentials)).unwrap();
  };

  /**
   * Register new user
   */
  const register = async (data: RegisterData) => {
    return dispatch(registerUser(data)).unwrap();
  };

  /**
   * Logout current user
   */
  const logout = async () => {
    return dispatch(logoutUser()).unwrap();
  };

  /**
   * Fetch current user data
   */
  const getCurrentUser = async () => {
    return dispatch(fetchCurrentUser()).unwrap();
  };

  /**
   * Connect wallet address to user account
   */
  const connectWallet = async (walletAddress: string) => {
    return dispatch(connectWalletAction(walletAddress)).unwrap();
  };

  return {
    // State
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,
    
    // Actions
    login,
    register,
    logout,
    getCurrentUser,
    connectWallet,
  };
};
