import React, { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error in React component tree:", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface p-6 text-on-surface">
          <div className="w-full max-w-lg rounded-3xl border border-outline-variant bg-surface-container-low p-8 text-center shadow-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-700">
              <span className="material-symbols-outlined text-3xl">error</span>
            </div>

            <h2 className="mt-4 text-xl font-bold">Something went wrong</h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              An unexpected render error occurred. Click below to clear stored referral data and refresh.
            </p>

            {this.state.error && (
              <div className="mt-4 rounded-xl bg-surface-container p-3 text-left font-mono text-xs text-red-700 overflow-x-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-sm hover:opacity-90"
              >
                Reset Stored Data & Refresh
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
