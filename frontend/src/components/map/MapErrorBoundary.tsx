import React from 'react';
import { MapPin } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class MapErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('Map render error caught by boundary:', error.message);
    // Auto-recover after 500ms by clearing error state
    setTimeout(() => this.setState({ hasError: false }), 500);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full rounded-2xl bg-slate-100 flex flex-col items-center justify-center gap-2 min-h-[240px]">
          <MapPin className="w-6 h-6 text-slate-400 animate-pulse" />
          <p className="text-[10px] text-slate-400 font-medium">Loading map...</p>
        </div>
      );
    }
    return this.props.children;
  }
}
