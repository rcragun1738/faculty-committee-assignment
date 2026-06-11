/**
 * React Application Entry Point
 *
 * This is where React mounts the application into the DOM.
 * It imports the main App component and renders it into the root div.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tailwind.css';

// Get the root element where React will mount
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found in HTML');
}

// Create React root and render the application
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
