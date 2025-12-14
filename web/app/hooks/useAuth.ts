import { create } from 'zustand';
import { isAuthenticated as checkAuth } from '@/app/services/auth';

interface LoginModalOptions {
  onSuccess?: () => void;
}

interface AuthStore {
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuthStatus: () => Promise<void>;
  setIsAuthenticated: (value: boolean) => void;

  isLoginModalOpened: boolean;
  openLoginModal: (options?: LoginModalOptions) => void;
  closeLoginModal: () => void;
  loginCallback?: () => void;
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
  isLoginModalOpened: false,
  openLoginModal: (options) => set({ isLoginModalOpened: true, loginCallback: options?.onSuccess }),
  closeLoginModal: () => set({ isLoginModalOpened: false }),

  loginCallback: undefined,
})); 