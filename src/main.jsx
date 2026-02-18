// main.jsx - Application entry point that mounts React app to DOM
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ErrorBoundary } from './components/ui/ErrorBoundary.jsx'

// createRoot enables React 18+ concurrent features (automatic batching, transitions, suspense)
// StrictMode helps detect potential problems by intentionally double-invoking certain functions
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
