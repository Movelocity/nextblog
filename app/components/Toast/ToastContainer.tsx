'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Toast, { ToastType } from './Toast';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed top-16 right-4 z-50 flex flex-col items-end">
      {toasts.slice(0, 3).reverse().map((toast, index) => (
        <div 
          key={toast.id} 
          className="transition-transform duration-300 ease-in-out"
          style={{ transform: `translateY(${index * 0.5}rem)` }}
        >
          <Toast {...toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>,
    document.body
  );
} 