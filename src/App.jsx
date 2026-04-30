import { useState, useEffect } from 'react';
import { Home, Calendar, BookOpen, BarChart2, Settings } from 'lucide-react';
import { useHabits } from '@/features/habits/hooks/useHabits';
import { supabase } from '@/features/database/services/supabase';
import TodayView from './components/TodayView';
import PlannerView from './components/PlannerView';
import JournalView from './components/JournalView';
import StatsView from './components/StatsView';
import SettingsView from './components/SettingsView';

function App() {
  const [activeTab, setActiveTab] = useState('today');
  const [isDark, setIsDark] = useState(true);

  const isNetworkUpdate = useRef(false);

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const { data, error } = await supabase.from('settings').select('*').eq('key', 'theme').single();
        if (!error && data) {
          isNetworkUpdate.current = true;
          setIsDark(data.value === 'dark');
        }
      } catch (err) {
        console.warn('Theme fetch failed:', err);
      }
    };
    fetchTheme();

    const channel = supabase
      .channel(`theme-sync-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: 'key=eq.theme' }, (payload) => {
        if (payload?.new?.value) {
          isNetworkUpdate.current = true;
          setIsDark(payload.new.value === 'dark');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    
    if (isNetworkUpdate.current) {
      isNetworkUpdate.current = false;
      return;
    }

    supabase.from('settings').upsert({ key: 'theme', value: isDark ? 'dark' : 'light' }, { onConflict: 'key' })
      .catch(err => console.warn('Theme sync failed:', err));
  }, [isDark]);

  const { habits, logHabit, slips } = useHabits();

  const TABS = [
    { id: 'today', icon: Home, label: 'Today' },
    { id: 'planner', icon: Calendar, label: 'Planner' },
    { id: 'journal', icon: BookOpen, label: 'Journal' },
    { id: 'stats', icon: BarChart2, label: 'Stats' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'today': return <TodayView habits={habits} logHabit={logHabit} />;
      case 'planner': return <PlannerView />;
      case 'journal': return <JournalView />;
      case 'stats': return <StatsView habits={habits} slips={slips} />;
      case 'settings': return <SettingsView isDark={isDark} setIsDark={setIsDark} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen pb-[64px] md:pb-0 md:flex overflow-x-hidden">
      {/* Mobile Nav */}
      <nav 
        className="md:hidden w-full fixed bottom-0 left-0 right-0 flex justify-around items-center z-[100]"
        style={{
          height: '64px',
          backgroundColor: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center transition-all duration-150 interactive-scale"
              style={{
                color: isActive ? 'var(--green)' : 'var(--text3)',
                minWidth: '60px',
              }}
            >
              <Icon size={22} />
              <span style={{ fontSize: '10px', marginTop: '4px', fontWeight: isActive ? '600' : '400' }}>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Desktop Sidebar */}
      <aside 
        className="hidden md:flex w-[220px] flex-col h-screen sticky top-0"
        style={{
          backgroundColor: 'var(--surface)',
          borderRight: '1px solid var(--border)',
        }}
      >
        <div className="p-6">
          <h1 className="text-xl mono font-bold tracking-tighter" style={{ color: 'var(--text)' }}>SOHAIB OS</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-150 interactive-scale"
                style={{
                  color: isActive ? 'var(--green)' : 'var(--text2)',
                  borderLeft: isActive ? '3px solid var(--green)' : '3px solid transparent',
                  backgroundColor: isActive ? 'rgba(34, 197, 94, 0.05)' : 'transparent',
                }}
              >
                <Icon size={20} />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main 
        className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8 overflow-x-hidden"
        style={{
          paddingBottom: 'calc(64px + 32px)',
        }}
      >
        <div className="animate-in fade-in duration-150">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
