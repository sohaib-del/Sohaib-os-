import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { storage } from '../utils/storage';

export default function JournalView() {
  const [entries, setEntries] = useState(() => storage.get('journal_entries', []));
  const [currentEntry, setCurrentEntry] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    storage.set('journal_entries', entries);
  }, [entries]);

  const saveEntry = () => {
    if (!currentEntry.trim()) return;
    
    const newEntryObj = {
      id: Date.now().toString(),
      text: currentEntry,
      timestamp: new Date().toISOString(),
      date: format(new Date(), 'yyyy-MM-dd')
    };
    
    setEntries(current => [newEntryObj, ...current]);
    setCurrentEntry('');
  };

  const filteredEntries = entries.filter(e => 
    e.date.includes(searchQuery) || e.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-300">
      <header style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>Journal</h2>
        <p style={{ fontSize: '13px', color: 'var(--text2)' }}>Clear your mind. Document the journey.</p>
      </header>

      {/* Editor Section */}
      <section style={{ marginBottom: '32px' }}>
        <div style={{ position: 'relative' }}>
          <textarea
            value={currentEntry}
            onChange={e => setCurrentEntry(e.target.value)}
            placeholder="What's on your mind today?"
            style={{
              width: '100%',
              minHeight: '200px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px',
              color: 'var(--text)',
              fontSize: '15px',
              fontFamily: 'DM Sans, sans-serif',
              lineHeight: '1.6',
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--green)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
          }}>
            <button
               onClick={saveEntry}
               disabled={!currentEntry.trim()}
               className="interactive-scale"
               style={{
                 display: 'flex',
                 alignItems: 'center',
                 gap: '6px',
                 padding: '0 12px',
                 height: '32px',
                 background: 'var(--green)',
                 color: '#000',
                 borderRadius: '6px',
                 fontSize: '12px',
                 fontWeight: '600',
                 opacity: !currentEntry.trim() ? 0.5 : 1,
                 cursor: 'pointer',
                 border: 'none',
               }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              SAVE
            </button>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section>
        <p className="section-label">HISTORY</p>
        
        <div style={{ marginBottom: '16px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search entries..."
            style={{
              width: '100%',
              height: '40px',
              paddingLeft: '36px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              color: 'var(--text)',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredEntries.map(entry => (
            <div key={entry.id} className="card-base" style={{ background: 'var(--surface)', position: 'relative' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div className="mono" style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: '700' }}>
                    {format(new Date(entry.timestamp), 'MMM do, yyyy')}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                    {format(new Date(entry.timestamp), 'h:mm a')}
                  </div>
               </div>
               <p style={{ fontSize: '14px', color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{entry.text}</p>
            </div>
          ))}
          {filteredEntries.length === 0 && (
            <div className="card-base text-center" style={{ color: 'var(--text3)', padding: '32px' }}>
              No entries found.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
