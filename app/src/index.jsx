import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, DEFAULT_THEME } from '@zendeskgarden/react-theming';
import App from './App';
import './styles/app.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <ThemeProvider theme={DEFAULT_THEME}>
    <App />
  </ThemeProvider>
);
