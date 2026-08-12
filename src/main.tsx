import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import './i18n';

if (typeof window !== 'undefined' && window.location.pathname === '/' && !window.location.hash) {
  window.history.replaceState({}, '', '/umrah-agency/');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);

