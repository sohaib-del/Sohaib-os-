import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { migrateData } from './utils/supabase'
import { setupNotificationEngine } from './utils/notifications'

// Initialize Supabase sync and notification check
migrateData();
setupNotificationEngine();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
