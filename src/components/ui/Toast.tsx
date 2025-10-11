import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
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

// A simple event emitter to allow calling toast from outside React components
const toastEventEmitter = {
  listeners: [] as ((message: string, type: ToastType) => void)[],
  subscribe(listener: (message: string, type: ToastType) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },
  emit(message: string, type: ToastType) {
    this.listeners.forEach(listener => listener(message, type));
  },
};

export const toast = {
    success: (message: string) => toastEventEmitter.emit(message, 'success'),
    error: (message: string) => toastEventEmitter.emit(message, 'error'),
    info: (message: string) => toastEventEmitter.emit(message, 'info')
};

export const Toaster: React.FC = () => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    
    useEffect(() => {
        const addToast = (message: string, type: ToastType) => {
            const id = Date.now();
            setToasts(prev => [...prev, { id, message, type }]);
            setTimeout(() => {
                setToasts(prev => prev.filter(toast => toast.id !== id));
            }, 5000);
        };

        const unsubscribe = toastEventEmitter.subscribe(addToast);
        return () => unsubscribe();
    }, []);

    const icons: Record<ToastType, React.ReactNode> = {
        success: <CheckCircle2Icon className="h-5 w-5 text-green-500" />,
        error: <XCircleIcon className="h-5 w-5 text-red-500" />,
        info: <AlertCircleIcon className="h-5 w-5 text-blue-500" />,
    }

    if (typeof document === 'undefined') return null;

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
