import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * Catches thrown render failures only — query errors render inline and
 * never reach here.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error.', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card" role="alert">
          <p>Something broke. Reload the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
