import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { storage } from '../utils/storage';
import { getPushupTarget } from '../utils/pushupMath';

// Custom components
const Checkbox = ({ checked, onChange }) => (
  <div
    onClick={onChange}
    className="interactive-scale"
    style={{
      width: '32px',
      height: '32px',
      minWidth: '32px',
      minHeight: '32px',
      borderRadius: '8px',
      border: checked ? 'none' : '1.5px solid var(--border)',
      background: checked ? 'var(--green)' : 'var(--surface2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      flexShrink: 0,
    }}
  >
    {checked && (
      <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
        <path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )}
  </div>
);

const MissButton = ({ missed, onClick }) => (
  <div
    onClick={onClick}
    className="interactive-scale"
    style={{
      width: '32px',
      height: '32px',
      minWidth: '32px',
      minHeight: '32px',
      borderRadius: '8px',
      border: missed ? 'none' : '1.5px solid var(--border)',
      background: missed ? 'var(--red)' : 'var(--surface2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      flexShrink: 0,
    }}
  >
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 2l10 10M12 2L2 12" stroke={missed ? "white" : "var(--text3)"} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  </div>
);

export default function TodayView({ habits, logHabit, startDate }) {
  const [slipModal, setSlipModal] = useState(null);
  const [slipReason, setSlipReason] = useState('');
  const [selectedTrigger, setSelectedTrigger] = useState('');
  const [timeNow, setTimeNow] = useState(new Date());

  const targetPushups = getPushupTarget(startDate);

  useEffect(() => {
    const timer = setInterval(() => setTimeNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const weekDays = useMemo(() => Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('en-CA');
  }), []);

  const getDayStatus = (habit, dateStr) => {
    const log = habit.logs?.find(l => l.date === dateStr);
    if (!log) return 'none';
    return log.status === 'yes' || log.status === 'completed' ? 'done' : 'missed';
  };

  const todayStr = timeNow.toLocaleDateString('en-CA');
  const pushupHero = habits.find(h => h.id === 'pushups');
  const otherHabits = habits.filter(h => h.id !== 'pushups');

  // Completion stats
  const totalDaily = habits.length;
  const doneToday = habits.filter(h => getDayStatus(h, todayStr) === 'done').length;
  const percent = totalDaily > 0 ? Math.round((doneToday / totalDaily) * 100) : 0;

  const handleLog = (habitId, status) => {
    const habit = habits.find(h => h.id === habitId);
    if (status === 'no' && habit.slipReasonEnabled) {
      setSlipModal(habitId);
      return;
    }
    logHabit(habitId, status);
  };

  const submitSlip = () => {
    const finalReason = selectedTrigger ? `[Trigger: ${selectedTrigger}] ${slipReason}` : slipReason;
    logHabit(slipModal, 'no', finalReason);
    setSlipModal(null);
    setSlipReason('');
    setSelectedTrigger('');
  };

  const TRIGGERS = ["On phone alone", "Bored/idle", "Stressed", "Other"];

  return (
    <div className="animate-in fade-in duration-300">
      {/* Fixed top progress bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'rgba(0,0,0,0.1)',
        zIndex: 200,
      }}>
        <div style={{
          height: '100%',
          width: `${percent}%`,
          background: 'var(--green)',
          transition: 'width 0.4s ease',
        }} />
      </div>

      <header style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
          {format(timeNow, 'EEEE, MMM do')}
        </h2>
        <p className="mono" style={{ fontSize: '13px', color: 'var(--green)' }}>
          Session: ACTIVE
        </p>
      </header>

      {/* Pushup Hero Card */}
      {pushupHero && (() => {
        const status = getDayStatus(pushupHero, todayStr);
        const isCompleted = status === 'done';
        const isMissed = status === 'missed';
        const isLogged = isCompleted || isMissed;

        return (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            marginBottom: '32px',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="mono" style={{ fontSize: '42px', fontWeight: '700', color: 'var(--text)', lineHeight: 1 }}>
                  {pushupHero.streakCount}
                </span>
                <span style={{ fontSize: '20px' }}>🔥</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p className="mono" style={{ fontSize: '22px', fontWeight: '700', color: 'var(--green)', lineHeight: 1 }}>
                  {targetPushups}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>pushups today</p>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {weekDays.slice(-5).map((date, i) => {
                  const s = getDayStatus(pushupHero, date);
                  return (
                    <div key={i} style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: s === 'done' ? 'var(--green)' : s === 'missed' ? 'var(--red)' : 'var(--border)',
                    }} />
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1px', background: 'var(--border)', borderTop: '1px solid var(--border)' }}>
              <button 
                onClick={() => handleLog(pushupHero.id, 'yes')}
                disabled={isLogged}
                style={{
                  flex: 1,
                  height: '48px',
                  background: isCompleted ? 'var(--green-dim)' : 'var(--surface)',
                  color: isCompleted ? 'var(--green)' : 'var(--text)',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  letterSpacing: '1px',
                  cursor: isLogged ? 'default' : 'pointer',
                  opacity: isLogged && !isCompleted ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isCompleted && <span>✓</span>}
                {isCompleted ? 'COMPLETED' : 'COMPLETED'}
              </button>
              <button 
                onClick={() => handleLog(pushupHero.id, 'no')}
                disabled={isLogged}
                style={{
                  flex: 1,
                  height: '48px',
                  background: isMissed ? 'var(--red-dim)' : 'var(--surface)',
                  color: isMissed ? 'var(--red)' : 'var(--text2)',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  letterSpacing: '1px',
                  cursor: isLogged ? 'default' : 'pointer',
                  opacity: isLogged && !isMissed ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isMissed && <span>✕</span>}
                {isMissed ? 'MISSED' : 'MISSED'}
              </button>
            </div>
            
            {isLogged && (
              <div style={{ 
                padding: '8px', 
                textAlign: 'center', 
                fontSize: '10px', 
                color: 'var(--text3)', 
                background: 'var(--surface2)',
                borderTop: '1px solid var(--border)'
              }}>
                LOGGED FOR TODAY
              </div>
            )}
          </div>
        );
      })()}

      {/* Daily Routine */}
      <section>
        <p className="section-label">DAILY ROUTINE</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {otherHabits.map(habit => {
            const status = getDayStatus(habit, todayStr);
            const isCompleted = status === 'done';
            const isMissed = status === 'missed';
            
            return (
              <div key={habit.id} className="interactive-scale" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                background: isCompleted ? 'var(--green-dim)' : isMissed ? 'var(--red-dim)' : 'var(--surface)',
                border: '1px solid var(--border)',
                borderLeft: `3px solid ${isCompleted ? 'var(--green)' : isMissed ? 'var(--red)' : 'var(--border2)'}`,
                borderRadius: '10px',
                transition: 'all 0.15s ease',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text)' }}>{habit.name}</h4>
                    <span style={{ fontSize: '10px', color: 'var(--text2)', fontWeight: '600' }}>{habit.category}</span>
                  </div>
                  <div className="mono" style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>
                    {habit.streakCount} STREAK
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Checkbox 
                    checked={isCompleted} 
                    onChange={() => handleLog(habit.id, 'yes')} 
                  />
                  <MissButton 
                    missed={isMissed} 
                    onClick={() => handleLog(habit.id, 'no')} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Slip Modal */}
      {slipModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200] p-4">
          <div className="card-base w-full max-w-md animate-in slide-in-from-bottom-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="section-label" style={{ color: 'var(--red)' }}>LOG SLIP</p>
            
            {slipModal === 'masturbation_tracker' && (
               <div className="mb-4">
                 <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>What were you doing before?</p>
                 <div className="grid grid-cols-2 gap-2">
                   {TRIGGERS.map(t => (
                     <button 
                       key={t}
                       onClick={() => setSelectedTrigger(t)}
                       style={{ 
                         padding: '10px', 
                         fontSize: '12px', 
                         borderRadius: '8px', 
                         border: '1px solid var(--border)',
                         background: selectedTrigger === t ? 'var(--red-dim)' : 'none',
                         color: selectedTrigger === t ? 'var(--red)' : 'var(--text2)',
                         borderColor: selectedTrigger === t ? 'var(--red)' : 'var(--border)'
                       }}
                     >
                       {t}
                     </button>
                   ))}
                 </div>
               </div>
            )}

            <textarea 
              autoFocus
              className="w-full"
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '12px',
                color: 'var(--text)',
                fontSize: '14px',
                height: '100px',
                resize: 'none',
                outline: 'none',
                marginBottom: '16px',
              }}
              placeholder="Be honest. What happened?"
              value={slipReason}
              onChange={e => setSlipReason(e.target.value)}
            />
            
            <div className="flex gap-3">
              <button 
                onClick={submitSlip}
                className="flex-1"
                style={{ height: '44px', background: 'var(--red)', color: 'white', borderRadius: '8px', fontWeight: '600' }}
              >
                LOG SLIP
              </button>
              <button 
                onClick={() => setSlipModal(null)}
                className="flex-1"
                style={{ height: '44px', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: '8px' }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
