import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

const DEFAULT_HABITS = [
  {
    id: 'pushups',
    name: 'Pushups',
    category: 'Physical',
    type: 'Daily',
    targetValue: 15,
    autoIncrement: true,
    slipReasonEnabled: false,
    streakCount: 0,
    logs: []
  },
  {
    id: 'masturbation_tracker',
    name: 'Resist Urges',
    category: 'Energy',
    type: 'Daily',
    targetValue: 'binary',
    slipReasonEnabled: true,
    streakCount: 0,
    logs: []
  },
  {
    id: 'night_planner',
    name: 'Night Planner',
    category: 'Planning',
    type: 'Daily',
    reminderTime: '22:00',
    targetValue: 'binary',
    streakCount: 0,
    logs: []
  },
  {
    id: 'task_completion',
    name: 'Task Completion',
    category: 'Work',
    type: 'Daily',
    targetValue: 'percentage',
    streakCount: 0,
    logs: []
  }
];

function calculateStreak(logs) {
  if (!logs || logs.length === 0) return 0;
  const logsMap = {};
  logs.forEach(l => { logsMap[l.date] = l.status; });

  let streak = 0;
  let datePointer = new Date();
  const todayDate = datePointer.toLocaleDateString('en-CA');
  
  const todayStatus = logsMap[todayDate];
  
  if (todayStatus === 'yes' || todayStatus === 'completed') {
    streak = 1;
  } else if (todayStatus === 'no' || todayStatus === 'missed') {
    streak = 0;
  }
  
  datePointer.setDate(datePointer.getDate() - 1);
  
  while (true) {
    const dateStr = datePointer.toLocaleDateString('en-CA');
    const status = logsMap[dateStr];
    if (status === 'yes' || status === 'completed') {
      streak += 1;
      datePointer.setDate(datePointer.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function useHabits() {
  const [habits, setHabits] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    console.log("fetchData started");
    setLoading(true);

    // Fetch Habits
    try {
      console.log("Fetching habits...");
      const { data: habitsData, error: habitsError } = await supabase.from('habits').select('*');
      if (habitsError) {
        console.warn("Habits fetch error (table may not exist yet):", habitsError.message);
        setHabits(DEFAULT_HABITS);
      } else if (habitsData && habitsData.length > 0) {
        setHabits(habitsData.map(h => ({ ...h, streakCount: calculateStreak(h.logs) })));
      } else {
        setHabits(DEFAULT_HABITS);
      }
    } catch (err) {
      console.warn("Habits fetch crashed, using defaults:", err);
      setHabits(DEFAULT_HABITS);
    }

    // Fetch Slips
    try {
      console.log("Fetching slips...");
      const { data: slipsData, error: slipsError } = await supabase.from('slips').select('*');
      if (slipsError) {
        console.warn("Slips fetch error (table may not exist yet):", slipsError.message);
        setSlips([]);
      } else {
        setSlips(slipsData || []);
      }
    } catch (err) {
      console.warn("Slips fetch crashed, using empty array:", err);
      setSlips([]);
    }

    // Fetch Settings (startDate)
    try {
      console.log("Fetching settings...");
      const { data: settingsData, error: settingsError } = await supabase.from('settings').select('*').eq('key', 'start_date').single();
      if (settingsError && settingsError.code !== 'PGRST116') {
        console.warn("Settings fetch error (table may not exist yet):", settingsError.message);
      }
      if (settingsData) {
        setStartDate(settingsData.value);
      } else {
        const now = new Date().toISOString();
        // Only attempt upsert if settings table might exist
        try {
          await supabase.from('settings').upsert({ key: 'start_date', value: now });
        } catch (upsertErr) {
          console.warn("Settings upsert failed:", upsertErr);
        }
        setStartDate(now);
      }
    } catch (err) {
      console.warn("Settings fetch crashed, using current date:", err);
      setStartDate(new Date().toISOString());
    }

    setLoading(false);
    console.log("fetchData finished");
  };

  useEffect(() => {
    fetchData();

    // Real-time Sync — .on() MUST be called before .subscribe()
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habits' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slips' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => fetchData())
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime: habits/slips/settings channel active');
        }
        if (err) {
          console.warn('Realtime subscription error (non-fatal):', err.message);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addHabit = async (habit) => {
    const newHabit = { ...habit, logs: [], id: Date.now().toString() };
    await supabase.from('habits').insert(newHabit);
  };

  const updateHabit = async (id, updates) => {
    await supabase.from('habits').update(updates).eq('id', id);
  };

  const deleteHabit = async (id) => {
    await supabase.from('habits').delete().eq('id', id);
  };

  const logHabit = async (id, status, reason = '') => {
    const today = new Date().toLocaleDateString('en-CA');
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    if (habit.logs.find(l => l.date === today)) return;

    const newLog = {
      date: today,
      status,
      reason,
      timestamp: new Date().toISOString()
    };

    const updatedLogs = [...habit.logs, newLog];
    await supabase.from('habits').update({ logs: updatedLogs }).eq('id', id);

    if (status === 'no' || status === 'missed') {
      const slipExists = slips.find(slip => slip.date === today && slip.habitName === habit.name);
      if (!slipExists) {
        await supabase.from('slips').insert({
          date: today,
          habitName: habit.name,
          reason,
          timestamp: new Date().toISOString(),
          streakAtBreak: habit.streakCount
        });
      }
    }
  };

  return {
    habits,
    startDate,
    slips,
    addHabit,
    updateHabit,
    deleteHabit,
    logHabit,
    loading
  };
}
