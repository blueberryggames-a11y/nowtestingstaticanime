import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="container" style={{ padding: 80 }}>
          <h1>Something went wrong</h1>
          <p className="muted">{String(this.state.error?.message || this.state.error)}</p>
          <button className="btn primary" onClick={() => location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}