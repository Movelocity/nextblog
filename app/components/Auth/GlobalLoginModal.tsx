'use client';

import { useLoginModal } from '@/app/hooks/useLoginModal';
import { LoginModal } from '@/app/components/Auth/LoginModal';

export const GlobalLoginModal = () => {
  const { isOpen, setIsOpen, onSuccess } = useLoginModal();

  const handleSuccess = () => {
    setIsOpen(false);
    onSuccess?.();
  };

  return (
    <LoginModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onSuccess={handleSuccess}
    />
  );
}; 