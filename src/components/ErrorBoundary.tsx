import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  t: (key: string) => string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // FIX: Reverted to using a constructor for state initialization.
  // The class property syntax was causing type inference issues where TypeScript
  // was failing to recognize the `props` property on the component instance.
  // A constructor ensures `this.props` and `this.state` are correctly typed.
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-background text-foreground min-h-screen p-8 font-sans">
          <h1 className="text-3xl font-bold text-destructive border-b pb-4 mb-4">{this.props.t('error.boundaryTitle')}</h1>
          <p className="text-lg text-muted-foreground">{this.props.t('error.boundaryMessage')}</p>
          <details className="mt-6 bg-secondary p-4 rounded-lg">
            <summary className="cursor-pointer font-semibold">{this.props.t('error.boundaryDetails')}</summary>
            <pre className="whitespace-pre-wrap break-all mt-2 text-sm text-muted-foreground">
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