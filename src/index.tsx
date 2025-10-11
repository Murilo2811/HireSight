import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider, useTranslations } from './contexts/LanguageContext';
import { Toaster } from './components/ui/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

const AppWithErrorBoundary: React.FC = () => {
    const { t } = useTranslations();
    return (
        <ErrorBoundary t={t}>
            <App />
        </ErrorBoundary>
    )
}

root.render(
  <React.StrictMode>
    <LanguageProvider>
      <AppWithErrorBoundary />
      <Toaster />
    </LanguageProvider>
  </React.StrictMode>
);