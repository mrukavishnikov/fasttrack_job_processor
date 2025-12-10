import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 * 
 * Architecture Note: This provides a last-resort error handling
 * for unhandled exceptions. For API errors, use try/catch or
 * React Query's error handling.
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-900 p-4">
          <div className="max-w-md w-full bg-surface-800 rounded-lg neon-border-magenta p-8 text-center">
            <div className="text-6xl mb-4">💥</div>
            <h1 className="text-2xl font-display font-bold text-neon-magenta mb-4">
              System Error
            </h1>
            <p className="text-gray-400 mb-6">
              Something went wrong. The error has been logged.
            </p>
            {this.state.error && (
              <pre className="bg-surface-900 p-4 rounded text-sm text-red-400 overflow-auto mb-6 text-left">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="px-6 py-3 bg-neon-cyan text-surface-900 font-bold rounded hover:bg-opacity-80 transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

