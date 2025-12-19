import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './auth'
import App from './App'
import './style.css'

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)



