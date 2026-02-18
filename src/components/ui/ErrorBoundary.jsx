// ErrorBoundary - Class component that catches and displays React rendering errors
import React from 'react';
import { Button } from './Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // Update state when error occurs - renders error UI
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // Log error details for debugging
  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info);
  }

  // Reset error state to retry rendering children
  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    // Render children normally when no error
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Error UI - centered card with message and retry button
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-lg border border-red-200 bg-red-50 p-6 text-center space-y-3">
          <h2 className="text-lg font-semibold text-red-700">Something went wrong</h2>
          <p className="text-sm text-red-600">
            The page hit an unexpected error. You can retry safely.
          </p>
          <Button onClick={this.handleRetry}>Retry</Button>
        </div>
      </div>
    );
  }
}
