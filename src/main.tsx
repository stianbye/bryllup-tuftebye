import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Finner ikke #root-elementet i DOM. Sjekk index.html.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)
