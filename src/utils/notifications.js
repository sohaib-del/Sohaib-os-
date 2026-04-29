import { supabase } from './supabase';

export const setupNotificationEngine = () => {
  // Request permission on start if not already granted
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // Set interval to check every 60 seconds
  setInterval(async () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    console.log(`[Notification Engine] Checking deadlines at ${currentTime}`);

    // Fetch habits with reminders from Supabase
    const { data: habits, error } = await supabase
      .from('habits')
      .select('*')
      .not('reminderTime', 'is', null);

    if (error) {
      console.error('Error fetching habits for notifications:', error);
      return;
    }

    habits.forEach(habit => {
      if (habit.reminderTime === currentTime) {
        triggerNotification(
          'Habit Reminder',
          `Time for your habit: ${habit.name}! Stay disciplined.`
        );
      }
    });

    // Also check for missed habits (simplified logic: if it's 11:59 PM and not done)
    if (currentTime === '23:59') {
       habits.forEach(habit => {
         // Logic to check if habit was logged today would go here
         // This is a placeholder for "missed or about to close" logic
       });
    }

  }, 60000);
};

const triggerNotification = (title, body) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icon-192x192.png' // Adjust if you have a different icon path
    });
  }
};
