import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'antd/dist/reset.css';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';

// Подавляем предупреждение о ResizeObserver loop
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0] && args[0].includes && args[0].includes('ResizeObserver loop')) {
    return;
  }
  originalConsoleError(...args);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    // <GlobalErrorBoundary>
        <App />
    // </GlobalErrorBoundary>
);
