import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false }; // tracks whether an error has been caught
  }

  // getDerivedStateFromError — called immediately when a child throws.
  // Returns new state to trigger the fallback render.
  // This is a static method (no access to 'this') — it only updates state.
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  // componentDidCatch — called after the error is captured.
  // Used for logging the error details to the console (or an error monitoring service).
  // 'info.componentStack' shows which component in the tree threw the error.
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI — shown instead of the broken component tree
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '40vh', gap: 16, padding: 32
        }}>
          {/* Info icon */}
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
            stroke="var(--text-tertiary)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Something went wrong</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            An unexpected error occurred. Try refreshing the page.
          </p>
          {/* Refresh button: resets the error state and reloads the page */}
          <button className="btn btn-primary btn-small"
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}>
            Refresh Page
          </button>
        </div>
      );
    }

    // Normal case: no error, render children as usual
    return this.props.children;
  }
}

export default ErrorBoundary;
