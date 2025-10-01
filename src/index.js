import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Add a shim for Electron's API when running in browser
if (typeof window.electron === 'undefined') {
  console.log('Running in browser mode - providing Electron API shims');
  window.electron = {
    selectFolder: async () => {
      console.log('Folder selection not available in browser');
      return null;
    },
    moveImages: async () => {
      console.log('File operations not available in browser');
      return { success: true, results: [] };
    }
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
