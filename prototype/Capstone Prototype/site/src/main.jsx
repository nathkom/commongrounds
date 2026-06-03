import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { fetchWithCache } from './lib/cache'
import { fetchCatalogEvents } from './lib/events'
import { fetchCatalogSpaces } from './lib/spaces'

// Kick off catalog fetches before React mounts so the data is already in the
// shared cache (or in-flight) by the time Home renders. Errors are ignored
// here — the hooks handle them on mount.
fetchWithCache('events:catalog', fetchCatalogEvents).catch(() => {})
fetchWithCache('spaces:catalog', fetchCatalogSpaces).catch(() => {})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
