import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

// Service worker: register only in production. CRA's own docs warn against
// registering one in development — the dev server's bundle changes on every
// save, but a cache-first service worker keeps re-serving whatever it cached
// first, so the page ends up running a stale mix of old/new JS until it
// freezes ("works for a few minutes, then the whole site goes blank").
//
// In development we do the opposite: actively unregister any service worker
// already installed from a previous session (e.g. before this fix existed)
// and wipe its caches, so anyone who already hit the freeze gets healed
// automatically on their next load — no DevTools steps required.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    } else {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => reg.unregister());
      });
      if ('caches' in window) {
        caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
      }
    }
  });
}
