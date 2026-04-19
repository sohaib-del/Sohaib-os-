import { useState, useEffect } from 'react';
import { format } from 'date-fns';

// Custom checkbox component
const Checkbox = ({ checked, onChange }) => (
  <div
    onClick={onChange}
    style={{
      width: '20px',
      height: '20px',
      minWidth: '20px',
      minHeight: '20px',
      borderRadius: '4px',
      border: checked ? 'none' : '1.5px solid var(--text3)',
      background: checked ? 'var(--green)' : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      flexShrink: 0,
    }}
  >
    {checked && (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )}
  </div>
);

function getTaskDate() {
  return new Date().toLocaleDateString('en-CA');
}

export default function PlannerView() {
  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskNote, setTaskNote] = useState('');

  useEffect(() => {
    const existing = JSON.parse(localStorage.getItem('sohaibos_tasks') || '[]');
    setTasks(existing);
  }, []);

  const handleAddTask = () => {
    if (!taskTitle.trim()) return;
    
    const date = getTaskDate();
    const newTask = {
      id: Date.now().toString(),
      title: taskTitle.trim(),
      note: taskNote.trim(),
      date: date,
      done: false,
      createdAt: new Date().toISOString()
    };
    
    const existing = JSON.parse(localStorage.getItem('sohaibos_tasks') || '[]');
    const updated = [...existing, newTask];
    localStorage.setItem('sohaibos_tasks', JSON.stringify(updated));
    
    setTasks(updated);
    setTaskTitle('');
    setTaskNote('');
  };

  const toggleTask = (id) => {
    const updated = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    localStorage.setItem('sohaibos_tasks', JSON.stringify(updated));
    setTasks(updated);
  };

  const deleteTask = (id) => {
    const updated = tasks.filter(t => t.id !== id);
    localStorage.setItem('sohaibos_tasks', JSON.stringify(updated));
    setTasks(updated);
  };

  const todayStr = getTaskDate();
  const todayTasks = tasks.filter(t => t.date === todayStr);

  const completedCount = todayTasks.filter(t => t.done).length;
  const percent = todayTasks.length > 0 ? Math.round((completedCount / todayTasks.length) * 100) : 0;

  const TaskCard = ({ task }) => (
    <div className="interactive-scale" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 16px',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${task.done ? 'var(--green)' : 'var(--border2)'}`,
      borderRadius: '10px',
      marginBottom: '8px',
      transition: 'all 0.15s ease',
    }}>
      <Checkbox checked={task.done} onChange={() => toggleTask(task.id)} />
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '14px',
          fontWeight: '500',
          color: task.done ? 'var(--text3)' : 'var(--text)',
          textDecoration: task.done ? 'line-through' : 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>{task.title}</p>
        
        {task.note && (
          <p style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>{task.note}</p>
        )}
      </div>
      
      <button onClick={() => deleteTask(task.id)} style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--text3)',
        padding: '4px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.15s ease',
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-300">
      <header style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>Night Planner</h2>
        <p style={{ fontSize: '13px', color: 'var(--text2)' }}>Rule today before it rules you.</p>
      </header>

      {/* TODAY'S EXECUTION */}
      <section style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--text2)', textTransform: 'uppercase', fontWeight: 600 }}>
              TODAY — {format(new Date(), 'MMM dd').toUpperCase()} · {percent}%
            </span>
          </div>
          <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px' }}>
            <div style={{
              height: '100%',
              width: `${percent}%`,
              background: 'var(--green)',
              borderRadius: '2px',
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        <div>
          {todayTasks.length === 0 ? (
            <div className="card-base text-center" style={{ color: 'var(--text2)', padding: '24px' }}>
              No tasks for today.
            </div>
          ) : (
            todayTasks.map(task => <TaskCard key={task.id} task={task} />)
          )}
        </div>
      </section>

      {/* ADD TASK */}
      <section>
        <p style={{
          fontSize: '11px',
          fontWeight: '600',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: 'var(--text2)',
          marginBottom: '12px',
        }}>ADD TASK</p>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
        }}>
          <input
            value={taskTitle}
            onChange={e => setTaskTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
            placeholder="What needs to be done today?"
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--text)',
              fontSize: '15px',
              fontFamily: 'DM Sans, sans-serif',
              paddingBottom: '10px',
              borderBottom: '1px solid var(--border)',
              marginBottom: '10px',
            }}
          />
          <input
            value={taskNote}
            onChange={e => setTaskNote(e.target.value)}
            placeholder="Optional note..."
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--text2)',
              fontSize: '13px',
              fontFamily: 'DM Sans, sans-serif',
              marginBottom: '12px',
            }}
          />
          <button
            onClick={handleAddTask}
            className="interactive-scale"
            style={{
              width: '100%',
              height: '40px',
              background: 'none',
              border: '1px solid var(--green)',
              borderRadius: '8px',
              color: 'var(--green)',
              fontSize: '13px',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: '600',
              cursor: 'pointer',
              letterSpacing: '0.5px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.target.style.background = 'var(--green)'; e.target.style.color = '#000'; }}
            onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = 'var(--green)'; }}
          >
            + ADD TASK
          </button>
        </div>

        {todayTasks.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            {todayTasks.map(task => <TaskCard key={task.id} task={task} />)}
          </div>
        )}
      </section>
    </div>
  );
}
