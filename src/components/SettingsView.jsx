import { useState } from 'react';
import { Moon, Sun, Bell, Trash2, Plus, LogOut } from 'lucide-react';
import { useHabits } from '../hooks/useHabits';

export default function SettingsView({ isDark, setIsDark }) {
  const { habits, addHabit, deleteHabit } = useHabits();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', category: 'Custom', targetValue: '' });

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      alert('Notifications enabled!');
    }
  };

  const handleAddHabit = (e) => {
    e.preventDefault();
    if (!newHabit.name.trim()) return;
    addHabit({
      ...newHabit,
      type: 'Daily',
      streakCount: 0,
      logs: []
    });
    setShowAddModal(false);
    setNewHabit({ name: '', category: 'Custom', targetValue: '' });
  };

  const hardReset = () => {
    if (confirm('This will delete everything permanently. Are you sure?')) {
      const keysToRemove = [
        'sohaibos_habits', 
        'sohaibos_slips', 
        'sohaibos_tasks', 
        'sohaibos_journal_entries', 
        'sohaibos_logs', 
        'sohaibos_theme', 
        'sohaibos_pushup_start',
        'sohaibos_start_date'
      ];
      keysToRemove.forEach(k => localStorage.removeItem(k));
      
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(k => {
        if (k.startsWith('sohaibos_')) {
          localStorage.removeItem(k);
        }
      });
      window.location.reload();
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <header style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>System Settings</h2>
        <p style={{ fontSize: '13px', color: 'var(--text2)' }}>Configure your discipline environment.</p>
      </header>

      {/* Preferences */}
      <section style={{ marginBottom: '32px' }}>
        <p className="section-label">PREFERENCES</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="card-base" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="flex items-center gap-3">
              <div style={{ color: isDark ? 'var(--green)' : 'var(--amber)' }}>
                {isDark ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '500' }}>Theme Mode</p>
                <p style={{ fontSize: '11px', color: 'var(--text2)' }}>Switch between light and dark.</p>
              </div>
            </div>
            <button 
              onClick={() => setIsDark(!isDark)}
              className="interactive-scale"
              style={{
                height: '32px',
                padding: '0 12px',
                borderRadius: '6px',
                background: 'var(--border)',
                color: 'var(--text)',
                fontSize: '11px',
                fontWeight: '700',
                border: 'none',
              }}
            >
              TOGGLE
            </button>
          </div>

          <div className="card-base" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="flex items-center gap-3">
              <div style={{ color: 'var(--green)' }}>
                <Bell size={18} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '500' }}>Push Reminders</p>
                <p style={{ fontSize: '11px', color: 'var(--text2)' }}>Enable browser-based notifications.</p>
              </div>
            </div>
            <button 
              onClick={requestNotifications}
              className="interactive-scale"
              style={{
                height: '32px',
                padding: '0 12px',
                borderRadius: '6px',
                background: 'var(--green)',
                color: '#000',
                fontSize: '11px',
                fontWeight: '700',
                border: 'none',
              }}
            >
              ENABLE
            </button>
          </div>
        </div>
      </section>

      {/* Habit Engine */}
      <section style={{ marginBottom: '32px' }}>
        <div className="flex justify-between items-center mb-3">
          <p className="section-label" style={{ marginBottom: 0 }}>HABIT ENGINE</p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 interactive-scale"
            style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 'bold' }}
          >
            <Plus size={14} /> ADD CUSTOM
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {habits.map(habit => (
            <div key={habit.id} className="card-base" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '500' }}>{habit.name}</p>
                <p style={{ fontSize: '11px', color: 'var(--text2)' }}>{habit.category}</p>
              </div>
              <button 
                onClick={() => confirm('Delete habit? All data lost.') && deleteHabit(habit.id)}
                className="interactive-scale"
                style={{ color: 'var(--text3)', border: 'none', background: 'none' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Factory Reset */}
      <section>
        <p className="section-label" style={{ color: 'var(--red)' }}>DANGER ZONE</p>
        <button 
          onClick={hardReset}
          className="interactive-scale w-full"
          style={{
            height: '44px',
            border: '1px solid var(--red)',
            borderRadius: '10px',
            background: 'none',
            color: 'var(--red)',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <LogOut size={16} /> FACTORY RESET OS
        </button>
      </section>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4">
          <form onSubmit={handleAddHabit} className="card-base w-full max-w-sm animate-in zoom-in-95" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="section-label" style={{ marginBottom: '16px' }}>INSTALL NEW PROTOCOL</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text3)', display: 'block', marginBottom: '4px' }}>HABIT NAME</label>
                <input 
                  autoFocus
                  required
                  style={{ width: '100%', height: '40px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', padding: '0 12px', outline: 'none' }}
                  value={newHabit.name}
                  onChange={e => setNewHabit({ ...newHabit, name: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text3)', display: 'block', marginBottom: '4px' }}>CATEGORY</label>
                <select 
                  style={{ width: '100%', height: '40px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', padding: '0 12px', outline: 'none' }}
                  value={newHabit.category}
                  onChange={e => setNewHabit({ ...newHabit, category: e.target.value })}
                >
                  <option>Physical</option>
                  <option>Work</option>
                  <option>Mind</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 interactive-scale" style={{ height: '40px', background: 'var(--green)', borderRadius: '6px', fontWeight: 'bold', color: '#000' }}>INSTALL</button>
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 interactive-scale" style={{ height: '40px', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text3)' }}>CANCEL</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
