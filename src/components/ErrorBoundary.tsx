import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  t: (key: string) => string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// FIX: Extended React.Component to make this a proper class component, which gives it access to props, state, and lifecycle methods. This fixes all errors in this file and the related error in index.tsx.
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{ padding: '20px', backgroundColor: '#1a202c', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: '#e53e3e', borderBottom: '1px solid #4a5568', paddingBottom: '10px' }}>{this.props.t('error.boundaryTitle')}</h1>
          <p style={{ marginTop: '15px' }}>{this.props.t('error.boundaryMessage')}</p>
          <details style={{ marginTop: '20px', backgroundColor: '#2d3748', padding: '15px', borderRadius: '5px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>{this.props.t('error.boundaryDetails')}</summary>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginTop: '10px', color: '#cbd5e0' }}>
              {this.state.error?.toString()}
              <br />
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
