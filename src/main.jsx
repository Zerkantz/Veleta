import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/big-shoulders-display';
import '@fontsource-variable/archivo';
import '@fontsource/yellowtail';
import './styles/global.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
