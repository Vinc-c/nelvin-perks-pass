import React from "react";

/** Catches render errors so a crash never leaves a blank white screen. */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("UI error:", error, info?.componentStack);
  }

  componentDidUpdate(prev) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    const msg = String(this.state.error?.message || this.state.error);
    return (
      <div role="alert" className="mx-auto my-16 max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm">
        <p className="text-lg font-semibold text-slate-900">Something went wrong</p>
        <p className="mt-2 text-sm text-slate-500">This page hit an unexpected error. Your data is safe.</p>
        <p className="mt-3 break-words rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500">{msg.slice(0, 200)}</p>
        <div className="mt-5 flex justify-center gap-2">
          <button type="button" onClick={() => this.setState({ error: null })} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Try again</button>
          <button type="button" onClick={() => window.location.reload()} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Reload</button>
        </div>
      </div>
    );
  }
}
