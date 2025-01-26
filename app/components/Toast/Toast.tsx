'use client';

import { useEffect } from 'react';
import classNames from 'classnames';
import { IoCheckmarkCircle, IoWarning, IoInformationCircle, IoCloseCircle } from 'react-icons/io5';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onDismiss: (id: string) => void;
}

const TOAST_ICONS = {
  success: IoCheckmarkCircle,
  error: IoCloseCircle,
  warning: IoWarning,
  info: IoInformationCircle,
};

const TOAST_STYLES = {
  success: 'bg-green-50 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  error: 'bg-red-50 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  warning: 'bg-amber-50 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  info: 'bg-blue-50 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
};

export default function Toast({ id, message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, 2000);

    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const Icon = TOAST_ICONS[type];

  return (
    <div
      className={classNames(
        'flex items-center p-4 mb-3 rounded-lg shadow-lg transition-all duration-300 ease-in-out',
        'animate-enter',
        TOAST_STYLES[type]
      )}
      role="alert"
    >
      <Icon className="w-5 h-5 mr-2" />
      <span className="font-medium">{message}</span>
    </div>
  );
} 