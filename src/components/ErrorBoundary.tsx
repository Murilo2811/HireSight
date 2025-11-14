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
  // Fix: Initialize state as a class property to ensure it's correctly typed on the component instance.
  // This resolves the error on line 16 and allows removing the constructor.
  state: ErrorBoundaryState = { hasError: false, error: null };

  // Fix: Add explicit return type for static method.
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    // Fix: With state correctly typed, this.state can be safely accessed, resolving error on line 28.
    if (this.state.hasError) {
      return (
        <div className="bg-background text-foreground min-h-screen p-8 font-sans">
          {/* Fix: With props correctly typed, this.props can be safely accessed, resolving error on line 31. */}
          <h1 className="text-3xl font-bold text-destructive border-b pb-4 mb-4">{this.props.t('error.boundaryTitle')}</h1>
          {/* Fix: With props correctly typed, this.props can be safely accessed, resolving error on line 32. */}
          <p className="text-lg text-muted-foreground">{this.props.t('error.boundaryMessage')}</p>
          <details className="mt-6 bg-secondary p-4 rounded-lg">
            {/* Fix: With props correctly typed, this.props can be safely accessed, resolving error on line 34. */}
            <summary className="cursor-pointer font-semibold">{this.props.t('error.boundaryDetails')}</summary>
            <pre className="whitespace-pre-wrap break-all mt-2 text-sm text-muted-foreground">
              {/* Fix: With state correctly typed, this.state can be safely accessed, resolving error on line 36. */}
              {this.state.error?.toString()}
              <br />
              {/* Fix: With state correctly typed, this.state can be safely accessed, resolving error on line 38. */}
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }

    // Fix: With props correctly typed, this.props can be safely accessed, resolving error on line 45.
    return this.props.children; 
  }
}

export default ErrorBoundary;
