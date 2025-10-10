import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ReactDOM from 'react-dom';
import { CheckCircle2Icon, XCircleIcon, AlertCircleIcon } from '../icons';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// FIX: Export the toast object to make it accessible for global usage.
export const toast = {
    success: (message: string) => {},
    error: (message: string) => {},
    info: (message: string) => {}
};

export const Toaster: React.FC = () => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    
    const addToast = useCallback((message: string, type: ToastType) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 5000);
    }, []);

    toast.success = (message: string) => addToast(message, 'success');
    toast.error = (message: string) => addToast(message, 'error');
    toast.info = (message: string) => addToast(message, 'info');

    const icons: Record<ToastType, React.ReactNode> = {
        success: <CheckCircle2Icon className="h-5 w-5 text-green-500" />,
        error: <XCircleIcon className="h-5 w-5 text-red-500" />,
        info: <AlertCircleIcon className="h-5 w-5 text-blue-500" />,
    }

    return ReactDOM.createPortal(
        <div className="fixed top-4 right-4 z-[100] w-full max-w-xs space-y-2">
            {toasts.map(toast => (
                <div key={toast.id} className="bg-card text-card-foreground rounded-lg shadow-lg p-4 flex items-start gap-3 border animate-fade-in animate-slide-up">
                    <div className="flex-shrink-0">{icons[toast.type]}</div>
                    <p className="text-sm font-medium">{toast.message}</p>
                </div>
            ))}
        </div>,
        document.body
    );
};
