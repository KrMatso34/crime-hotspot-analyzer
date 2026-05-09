import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { registerServiceWorker, requestPermission } from './utils/serviceWorkerRegister.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register Service Worker for PWA functionality
if (import.meta.env.PROD) {
  registerServiceWorker()
  requestPermission()
}

// Run vite server with 'npm run dev'