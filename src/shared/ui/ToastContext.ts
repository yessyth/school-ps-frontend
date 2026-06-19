import { createContext } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);
