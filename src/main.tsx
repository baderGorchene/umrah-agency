import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Ensure the app root URL redirects to the app base so BrowserRouter with a basename matches.
if (typeof window !== 'undefined' && window.location.pathname === '/') {
  // Replace instead of push so not to pollute history stack.
  window.history.replaceState({}, '', '/umrah-agency');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/umrah-agency">
      <App />
    </BrowserRouter>
  </StrictMode>,
);

