import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyDevToolsParam } from './lib/devToolsGate'

// ?devtools=1 / ?devtools=0 — unlock or lock the Dev Testing tools for this
// browser, before anything renders (see lib/devToolsGate.ts).
applyDevToolsParam()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
