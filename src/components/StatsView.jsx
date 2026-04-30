import { useMemo, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { DownloadIcon, AlertTriangle, Brain, Target, Clock, Zap } from 'lucide-react';
import { supabase } from '@/features/database/services/supabase';

const WIN_COLORS = ['#22C55E', '#4ade80', '#10b981', '#059669', '#86efac', '#34d399', '#6ee7b7'];
const LOSS_COLORS = ['#EF4444', '#f87171', '#dc2626', '#b91c1c', '#fca5a5', '#ef4444', '#f87171'];

export default function StatsView({ habits, slips }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const chartData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const dateStr = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
      const point = { name: format(subDays(new Date(), 6 - i), 'EE') };
      
      habits.forEach((h) => {
        const log = h.logs?.find(l => l.date === dateStr);
        if (log && (log.status === 'yes' || log.status === 'completed')) {
          point[h.name] = 1;
        } else if (log && (log.status === 'no' || log.status === 'missed')) {
          point[h.name] = -1;
        } else {
          point[h.name] = 0;
        }
      });
      return point;
    });
  }, [habits]);

  const exportJSON = async () => {
    const { data: journal } = await supabase.from('journal_entries').select('*');
    const { data: planner } = await supabase.from('tasks').select('*');
    
    const data = {
      timestamp: new Date().toISOString(),
      habits, slips,
      journal: journal || [],
      planner: planner || []
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `sohaibos-export-${format(new Date(), 'yyyy-MM-dd')}.json`);
  };

  const exportCSV = () => {
    let csv = 'Date,HabitId,HabitName,Status,Reason,Timestamp\n';
    habits.forEach(h => {
      h.logs?.forEach(l => {
        csv += `"${l.date}","${h.id}","${h.name}","${l.status}","${l.reason?.replace(/"/g, '""') || ''}","${l.timestamp}"\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    downloadBlob(blob, `sohaibos-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const neuroPatterns = useMemo(() => {
    const timeBlocks = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    const triggerCounts = {};
    
    slips.forEach(slip => {
      const d = new Date(slip.timestamp);
      const hour = d.getHours();
      if (hour >= 5 && hour < 12) timeBlocks.morning++;
      else if (hour >= 12 && hour < 17) timeBlocks.afternoon++;
      else if (hour >= 17 && hour < 21) timeBlocks.evening++;
      else timeBlocks.night++;

      const triggerMatch = slip.reason?.match(/\[Trigger: (.*?)\]/);
      if (triggerMatch) {
        const trigger = triggerMatch[1];
        triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
      }
    });

    const mostCommonTime = Object.keys(timeBlocks).reduce((a, b) => timeBlocks[a] > timeBlocks[b] ? a : b);
    const mostCommonTrigger = Object.keys(triggerCounts).length > 0 
      ? Object.keys(triggerCounts).reduce((a, b) => triggerCounts[a] > triggerCounts[b] ? a : b) 
      : 'None';

    let maxHistorical = 0;
    let currentBest = 0;
    
    habits.forEach(h => {
      if (h.streakCount > currentBest) currentBest = h.streakCount;
      let tempStreak = 0;
      let localMax = 0;
      const sortedLogs = [...(h.logs || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
      sortedLogs.forEach(l => {
        if (l.status === 'yes' || l.status === 'completed') {
          tempStreak++;
          if (tempStreak > localMax) localMax = tempStreak;
        } else if (l.status === 'no' || l.status === 'missed') {
          tempStreak = 0;
        }
      });
      if (localMax > maxHistorical) maxHistorical = localMax;
    });

    return {
      mostCommonTime: timeBlocks[mostCommonTime] > 0 ? mostCommonTime : 'N/A',
      mostCommonTrigger,
      record: {
        currentStr: currentBest,
        personalBest: maxHistorical > currentBest ? maxHistorical : currentBest
      }
    };
  }, [slips, habits]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', fontSize: '12px' }}>
          <p className="mono font-bold mb-2" style={{ color: 'var(--text)' }}>{label}</p>
          {payload.map((entry, index) => {
            if (entry.value === 0) return null;
            const isWin = entry.value > 0;
            return (
              <div key={index} className="flex items-center space-x-2 my-1">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
                <span style={{ color: 'var(--text2)' }}>{entry.dataKey}:</span>
                <span className="font-bold" style={{ color: isWin ? 'var(--green)' : 'var(--red)' }}>
                  {isWin ? 'WON' : 'MISSED'}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-in fade-in duration-300">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>Statistics</h2>
          <p style={{ fontSize: '13px', color: 'var(--text2)' }}>Data never lies.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="interactive-scale px-3 h-8 border border-border rounded flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-text2 hover:text-green hover:border-green">
            <DownloadIcon size={12} /> CSV
          </button>
          <button onClick={exportJSON} className="interactive-scale px-3 h-8 border border-border rounded flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-text2 hover:text-green hover:border-green">
            <DownloadIcon size={12} /> JSON
          </button>
        </div>
      </header>

      {/* Activity Diverging Chart */}
      <section style={{ marginBottom: '32px' }}>
        <p className="section-label">ACTIVITY DIVERGING VIEW</p>
        <div className="card-base" style={{ height: '340px', padding: '24px 16px 16px' }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} barCategoryGap="20%">
              <XAxis dataKey="name" stroke="var(--text3)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} content={<CustomTooltip />} isAnimationActive={false} />
              <ReferenceLine y={0} stroke="var(--border)" />
              {habits.map((habit, index) => (
                <Bar key={habit.id} dataKey={habit.name} isAnimationActive={false}>
                  {chartData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry[habit.name] > 0 ? WIN_COLORS[index % WIN_COLORS.length] : LOSS_COLORS[index % LOSS_COLORS.length]} />
                  ))}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Vulnerability Report */}
      <section style={{ marginBottom: '32px' }}>
        <p className="section-label">VULNERABILITY REPORT</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="card-base">
            <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--text2)' }}>
              <Clock size={14} />
              <span style={{ fontSize: '11px', fontWeight: 'bold', uppercase: 'true', tracking: '1px' }}>DANGER TIME</span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600', textTransform: 'capitalize' }}>
              {neuroPatterns.mostCommonTime}
            </div>
          </div>
          <div className="card-base">
            <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--text2)' }}>
              <Zap size={14} />
              <span style={{ fontSize: '11px', fontWeight: 'bold', uppercase: 'true', tracking: '1px' }}>PRIMARY TRIGGER</span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--red)' }}>
              {neuroPatterns.mostCommonTrigger}
            </div>
          </div>
          <div className="card-base">
            <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--text2)' }}>
              <Target size={14} />
              <span style={{ fontSize: '11px', fontWeight: 'bold', uppercase: 'true', tracking: '1px' }}>BEST STREAK</span>
            </div>
            <div className="mono" style={{ fontSize: '18px', fontWeight: '600', color: 'var(--green)' }}>
              {neuroPatterns.record.personalBest} DAYS
            </div>
          </div>
        </div>
      </section>

      {/* Slip Table */}
      <section>
        <p className="section-label">PERMANENT SLIP LOG</p>
        <div style={{ borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--surface)' }}>
          <table className="w-full text-left border-collapse" style={{ fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                <th className="px-4 py-3 font-semibold" style={{ fontSize: '11px', color: 'var(--text3)' }}>DATE</th>
                <th className="px-4 py-3 font-semibold" style={{ fontSize: '11px', color: 'var(--text3)' }}>HABIT</th>
                <th className="px-4 py-3 font-semibold" style={{ fontSize: '11px', color: 'var(--text3)' }}>REASONING</th>
              </tr>
            </thead>
            <tbody>
              {slips.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-4 py-8 text-center" style={{ color: 'var(--text2)' }}>No slips recorded. Stay vigilant.</td>
                </tr>
              ) : (
                slips.slice().reverse().map((slip, i) => {
                  const triggerMatch = slip.reason?.match(/\[Trigger: (.*?)\]/);
                  const reasonClean = slip.reason?.replace(/\[Trigger: .*?\]\s*/, '') || '—';
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-4 py-4 mono" style={{ fontSize: '12px', color: 'var(--text2)' }}>
                        {format(new Date(slip.date), 'MMM dd')}
                      </td>
                      <td className="px-4 py-4 font-medium">{slip.habitName}</td>
                      <td className="px-4 py-4" style={{ fontSize: '13px' }}>
                        {triggerMatch && (
                          <span style={{ display: 'inline-block', background: 'var(--red-dim)', color: 'var(--red)', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold', marginRight: '8px' }}>
                            {triggerMatch[1].toUpperCase()}
                          </span>
                        )}
                        <span style={{ color: 'var(--text2)' }}>{reasonClean}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
