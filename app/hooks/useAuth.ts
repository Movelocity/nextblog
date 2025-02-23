import { create } from 'zustand';
import { isAuthenticated as checkAuth } from '@/app/services/auth';

interface AuthStore {
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuthStatus: () => Promise<void>;
  setIsAuthenticated: (value: boolean) => void;
}

export const useAuth = create<AuthStore>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  checkAuthStatus: async () => {
    set({ isLoading: true });
    const authStatus = await checkAuth();
    set({ isAuthenticated: authStatus, isLoading: false });
  },
  setIsAuthenticated: (value: boolean) => set({ isAuthenticated: value }),
})); 