import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Keep the browser's install prompt so the app can offer "Installer l'app".
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__nelvinInstallPrompt = e;
  window.dispatchEvent(new Event('nelvin:installable'));
});
window.addEventListener('appinstalled', () => {
  window.__nelvinInstallPrompt = null;
  window.dispatchEvent(new Event('nelvin:installable'));
});

// Data saver / slow 2G-3G: switch off decorative animations and parallax.
try {
  const c = navigator.connection;
  if (c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ''))) document.documentElement.classList.add('data-saver');
} catch { /* Network Information API unavailable */ }

// Register the Service Worker for offline-first PWA (QR redemption without network)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}