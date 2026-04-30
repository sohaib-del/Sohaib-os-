import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { supabase, migrateData } from '@/features/database/services/supabase'
import { setupNotificationEngine } from './utils/notifications'

const init = async () => {
  console.log("Initializing Sohaib OS...");
  try {
    await migrateData();
    // Test connection
    const { data, error } = await supabase.from('habits').select('*');
    console.log('Supabase habits fetch:', data, error);
    
    setupNotificationEngine();
  } catch (err) {
    console.error("Initialization failed:", err);
  }
};

init();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
