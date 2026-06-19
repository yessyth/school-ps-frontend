import { useState, useCallback, type ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { ToastContext } from './ToastContext';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '350px',
          width: '100%',
        }}
      >
        {toasts.map((toast) => {
          let bgColor = 'var(--status-gray-bg)';
          let borderColor = 'var(--status-gray-border)';
          let textColor = 'var(--text-primary)';
          let icon = <Info size={20} color="var(--status-gray)" />;

          if (toast.type === 'success') {
            bgColor = 'var(--status-green-bg)';
            borderColor = 'var(--status-green-border)';
            textColor = '#065f46';
            icon = <CheckCircle size={20} color="var(--status-green)" />;
          } else if (toast.type === 'error') {
            bgColor = 'var(--status-red-bg)';
            borderColor = 'var(--status-red-border)';
            textColor = '#991b1b';
            icon = <AlertCircle size={20} color="var(--status-red)" />;
          } else if (toast.type === 'warning') {
            bgColor = 'var(--status-yellow-bg)';
            borderColor = 'var(--status-yellow-border)';
            textColor = '#92400e';
            icon = <AlertCircle size={20} color="var(--status-yellow)" />;
          }

          return (
            <div
              key={toast.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: bgColor,
                border: `1px solid ${borderColor}`,
                boxShadow: 'var(--shadow-md)',
                color: textColor,
                fontSize: '0.875rem',
                fontWeight: 500,
                animation: 'slideInRight 0.2s ease',
              }}
            >
              <div style={{ flexShrink: 0 }}>{icon}</div>
              <div style={{ flexGrow: 1, wordBreak: 'break-word' }}>{toast.message}</div>
              <button
                onClick={() => {
                  removeToast(toast.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'inherit',
                  opacity: 0.7,
                }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext>
  );
};
