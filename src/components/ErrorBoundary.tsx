import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

// Wraps page content so a render error anywhere below shows a friendly
// fallback instead of a blank white screen or a raw stack trace. Class
// component because React only supports error boundaries via
// componentDidCatch/getDerivedStateFromError — there's no hook equivalent.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Logged for local debugging only — never shown to the user.
    console.error('Caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6"
          style={{ backgroundColor: '#FBF7F0' }}
        >
          <p
            className="text-2xl"
            style={{ color: '#1F2A24', fontFamily: "'Fraunces', serif", fontWeight: 500 }}
          >
            Something went wrong
          </p>
          <p className="text-sm max-w-sm" style={{ color: '#8A8273', fontFamily: "'Inter', sans-serif" }}>
            This page ran into a problem. Reloading usually fixes it.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-md text-sm"
            style={{ backgroundColor: '#2F6F4F', color: '#FFFFFF', fontFamily: "'Inter', sans-serif", border: 'none', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
