import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import './styles/telegram-theme.css'
import './styles/premium-forms.css'
import './styles/premium-components.css'
import './styles/premium-typography.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
