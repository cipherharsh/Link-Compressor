/*
 * PURPOSE: React DOM entrypoint mounting the application with StrictMode.
 * INPUTS: DOM element with id 'root'.
 * OUTPUTS: Rendered React component tree in the browser viewport.
 * DEPENDS_ON: React, ReactDOM, App.tsx, tokens.css.
 * WHY_THIS_DESIGN: Clean standard React 18 createRoot bootstrap with StrictMode for reliability.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find root DOM element.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
