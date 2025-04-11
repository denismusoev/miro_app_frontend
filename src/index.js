import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'antd/dist/reset.css';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    // <GlobalErrorBoundary>
        <App />
    // </GlobalErrorBoundary>
);
