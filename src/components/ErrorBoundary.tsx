import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SPADE Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
          <div className="max-w-md text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-red-400 text-2xl font-bold">!</span>
            </div>
            <h1 className="text-xl font-bold text-zinc-100 mb-2">Something went wrong</h1>
            <p className="text-sm text-zinc-500 mb-4">
              SPADE encountered an unexpected error. Try refreshing the page.
            </p>
            {this.state.error && (
              <pre className="text-xs text-zinc-600 bg-zinc-900 border border-zinc-800 rounded-lg p-3 mb-4 text-left overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
