import React from 'react';

interface SceneBoundaryProps {
  /** Called once if the 3D chunk fails to load or the scene throws while rendering. */
  onError: () => void;
  children: React.ReactNode;
}

interface SceneBoundaryState {
  failed: boolean;
}

/** Keeps a 3D failure (offline chunk load, WebGL crash) from taking down the whole page. */
export default class SceneBoundary extends React.Component<SceneBoundaryProps, SceneBoundaryState> {
  state: SceneBoundaryState = { failed: false };

  static getDerivedStateFromError(): SceneBoundaryState {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
