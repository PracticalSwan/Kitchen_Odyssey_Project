// Toast notification system for user-facing error/success feedback
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

const ToastContext = createContext(null);

const TOAST_DURATION = 6000;

const ICONS = {
  error: AlertCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  error: 'bg-red-50 border-red-200 text-red-800',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const ICON_STYLES = {
  error: 'text-red-500',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

let toastId = 0;

// Extract a user-friendly error message with error code from any error
export function formatError(error) {
  if (!error) return 'An unknown error occurred';

  // ApiError with status and code
  if (error.status && error.code) {
    const code = error.code !== 'UNKNOWN_ERROR' ? error.code : `HTTP_${error.status}`;
    return `${error.message} (${code})`;
  }

  // ApiError with just status
  if (error.status) {
    return `${error.message || 'Request failed'} (HTTP_${error.status})`;
  }

  // Network/fetch errors
  if (error.name === 'TypeError' && error.message?.includes('fetch')) {
    return 'Unable to connect to server. Please check your connection. (ERR_NETWORK)';
  }

  if (error.name === 'AbortError') {
    return 'Request timed out. Please try again. (ERR_TIMEOUT)';
  }

  return error.message || 'An unexpected error occurred';
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'error') => {
    const id = ++toastId;
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => removeToast(id), TOAST_DURATION);
  }, [removeToast]);

  // Workaround: useCallback doesn't work on objects — use useMemo-like pattern
  const value = React.useMemo(() => ({
    error: (msg) => addToast(msg, 'error'),
    success: (msg) => addToast(msg, 'success'),
    warning: (msg) => addToast(msg, 'warning'),
    info: (msg) => addToast(msg, 'info'),
  }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container - fixed bottom-right */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div
              key={t.id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-slide-in-right',
                STYLES[t.type]
              )}
              role="alert"
            >
              <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', ICON_STYLES[t.type])} />
              <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

