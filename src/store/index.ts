import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export hooks for usage in components
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = useSelector as <TSelected = unknown>(
  selector: (state: RootState) => TSelected,
) => TSelected;