import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AppErrorBoundary from './components/system/AppErrorBoundary';

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);