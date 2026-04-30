import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gchoumruntpeqdpqlncu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjaG91bXJ1bnRwZXFkcHFsbmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDA2NTYsImV4cCI6MjA5MzAxNjY1Nn0.BYePA3hvBzxa79GQ2WakgCLFv7pqoIJJN7F7dC4i-eI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const TABLE_MAPPING = {
  'sohaibos_habits': 'habits',
  'sohaibos_tasks': 'tasks',
  'sohaibos_journal_entries': 'journal_entries',
  'sohaibos_slips': 'slips',
  'sohaibos_logs': 'logs',
  'sohaibos_theme': 'settings',
  'sohaibos_pushup_start': 'settings',
  'sohaibos_start_date': 'settings',
  'sohaibos_planner_tasks': 'planner_tasks'
}

export const migrateData = async () => {
  console.log('Migration started...')
  const allKeys = Object.keys(localStorage)
  const migrationPromises = []

  for (const key of allKeys) {
    if (key.startsWith('sohaibos_')) {
      const data = localStorage.getItem(key)
      if (!data) continue

      const tableName = TABLE_MAPPING[key]
      if (tableName) {
        try {
          const parsedData = JSON.parse(data)
          
          if (tableName === 'settings') {
            migrationPromises.push(
              supabase.from('settings').upsert({ key: key.replace('sohaibos_', ''), value: parsedData })
            )
          } else if (Array.isArray(parsedData)) {
            for (const item of parsedData) {
              migrationPromises.push(
                supabase.from(tableName).upsert({ ...item })
              )
            }
          } else {
            migrationPromises.push(
              supabase.from(tableName).upsert({ id: key, data: parsedData })
            )
          }
        } catch (e) {
          console.error(`Failed to migrate ${key}`, e)
        }
      }
    }
  }

  if (migrationPromises.length > 0) {
    await Promise.all(migrationPromises)
    console.log('Migration complete. Clearing localStorage.')
    allKeys.forEach(k => {
      if (k.startsWith('sohaibos_')) {
        localStorage.removeItem(k)
      }
    })
  }
}
