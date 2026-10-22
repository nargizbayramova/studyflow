import React from "react";

interface State {
  hasError: boolean;
}

// Class component: React has no hook equivalent for error boundaries.
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div role="alert" className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-lg font-semibold text-ink-primary">Something went wrong</h1>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium"
        >
          Reload page
        </button>
      </div>
    );
  }
}
