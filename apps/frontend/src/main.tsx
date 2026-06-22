import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'

Sentry.init({
  dsn: 'https://a7c6ea28fdad5504cec0e1be41be6a0f@o4511216027828224.ingest.us.sentry.io/4511216029990912',
  environment: import.meta.env.MODE,
  // Solo activo en producción y preview para no contaminar con errores de dev
  enabled: import.meta.env.PROD,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
  sendDefaultPii: false,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
