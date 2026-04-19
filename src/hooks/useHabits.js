import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';

const DEFAULT_HABITS = [
  {
    id: 'pushups',
    name: 'Pushups',
    category: 'Physical',
    type: 'Daily',
    targetValue: 15, // Will be overridden by dynamic logic
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
    targetValue: 'percentage', // Specialized rendering
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
  const [habits, setHabits] = useState(() => {
    const loaded = storage.get('habits', DEFAULT_HABITS);
    // Recalculate streaks on load to ensure consistency
    return loaded.map(h => ({ ...h, streakCount: calculateStreak(h.logs) }));
  });
  
  const [startDate, setStartDate] = useState(() => {
    const existing = storage.get('start_date');
    if (existing) return existing;
    const now = new Date().toISOString();
    storage.set('start_date', now);
    return now;
  });

  const [slips, setSlips] = useState(() => {
    return storage.get('slips', []);
  });

  useEffect(() => {
    storage.set('habits', habits);
  }, [habits]);

  useEffect(() => {
    storage.set('slips', slips);
  }, [slips]);

  const addHabit = (habit) => {
    setHabits([...habits, { ...habit, logs: [], streakCount: 0, id: Date.now().toString() }]);
  };

  const updateHabit = (id, updates) => {
    setHabits(habits.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  const deleteHabit = (id) => {
    setHabits(habits.filter(h => h.id !== id));
  };

  const logHabit = (id, status, reason = '') => {
    const today = new Date().toLocaleDateString('en-CA');
    
    setHabits(current => current.map(habit => {
      if (habit.id !== id) return habit;
      
      // BUG 1 FIX: Prevent duplicate logs on same day
      const existingLog = habit.logs.find(l => l.date === today);
      if (existingLog) return habit;
      
      const newLog = {
        date: today,
        status,
        reason,
        timestamp: new Date().toISOString()
      };

      const updatedLogs = [...habit.logs, newLog];
      const newStreak = calculateStreak(updatedLogs);

      if (status === 'no' || status === 'missed') {
        // BUG 3 FIX: Prevent duplicate slips for same habit on same day
        setSlips(s => {
          const slipExists = s.find(slip => slip.date === today && slip.habitName === habit.name);
          if (slipExists) return s;
          return [...s, {
            date: today,
            habitName: habit.name,
            reason,
            timestamp: new Date().toISOString(),
            streakAtBreak: habit.streakCount
          }];
        });
      }

      return {
        ...habit,
        streakCount: newStreak,
        logs: updatedLogs
      };
    }));
  };

  return {
    habits,
    startDate,
    slips,
    addHabit,
    updateHabit,
    deleteHabit,
    logHabit
  };
}
