import { create } from 'zustand';

interface LoginModalStore {
  isOpen: boolean;
  onSuccess?: () => void;
  setIsOpen: (isOpen: boolean) => void;
  setOnSuccess: (callback?: () => void) => void;
}

export const useLoginModal = create<LoginModalStore>((set) => ({
  isOpen: false,
  onSuccess: undefined,
  setIsOpen: (isOpen) => set({ isOpen }),
  setOnSuccess: (callback) => set({ onSuccess: callback }),
})); 