import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/features/database/services/supabase';

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
  const isFetching = useRef(false);

  const fetchData = useCallback(async () => {
    if (isFetching.current) return;
    console.log("fetchData triggered");
    isFetching.current = true;
    
    try {
      // Fetch Habits
      const { data: habitsData, error: habitsError } = await supabase.from('habits').select('*');
      if (!habitsError && habitsData) {
        setHabits(habitsData.length > 0 
          ? habitsData.map(h => ({ ...h, streakCount: calculateStreak(h.logs) }))
          : DEFAULT_HABITS
        );
      } else {
        setHabits(DEFAULT_HABITS);
      }

      // Fetch Slips
      const { data: slipsData, error: slipsError } = await supabase.from('slips').select('*');
      if (!slipsError) setSlips(slipsData || []);

      // Fetch Settings (startDate)
      const { data: settingsData } = await supabase.from('settings').select('*').eq('key', 'start_date').single();
      if (settingsData) {
        setStartDate(settingsData.value);
      } else {
        // We set a local default, but don't upsert here to avoid triggering a loop
        setStartDate(new Date().toISOString());
      }
    } catch (err) {
      console.warn("fetchData error:", err);
    } finally {
      setLoading(false);
      isFetching.current = false;
      console.log("fetchData finished");
    }
  }, []);

  useEffect(() => {
    fetchData();

    const channelName = `habits-sync-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habits' }, () => {
        console.log("Realtime: habits changed");
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slips' }, () => {
        console.log("Realtime: slips changed");
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        console.log("Realtime: settings changed");
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

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
