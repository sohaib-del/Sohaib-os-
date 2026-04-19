const PREFIX = 'sohaibos_';

export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = window.localStorage.getItem(PREFIX + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn('Error reading from localStorage', error);
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (error) {
      console.warn('Error writing to localStorage', error);
    }
  },
  remove: (key) => {
    try {
      window.localStorage.removeItem(PREFIX + key);
    } catch (error) {
      console.warn('Error removing from localStorage', error);
    }
  }
};
