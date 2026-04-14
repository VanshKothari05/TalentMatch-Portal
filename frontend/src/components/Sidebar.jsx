import React from 'react'

const NAV = [
  { id: 'dashboard',  label: 'Dashboard'   },
  { id: 'match',      label: 'Match Jobs'  },
  { id: 'upload',     label: 'Upload Data' },
  { id: 'jobs',       label: 'All Jobs'    },
  { id: 'candidates', label: 'Candidates'  },
]

export default function Sidebar({ active, onNav, stats }) {
  return (
    <aside style={{
      width: 200, minHeight: '100vh',
      background: '#fff',
      borderRight: '1px solid #e2ddd6',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0,
    }}>
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #e2ddd6' }}>
        <div style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '-0.01em', color: '#1a1a1a' }}>
          TalentMatch
        </div>
        <div style={{ fontSize: '0.72rem', color: '#999490', marginTop: 2 }}>
          matching engine
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 10px' }}>
        {NAV.map(item => (
          <button key={item.id} onClick={() => onNav(item.id)} style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '7px 12px', borderRadius: 5, border: 'none', marginBottom: 1,
            background: active === item.id ? '#f7f5f0' : 'transparent',
            color: active === item.id ? '#1a1a1a' : '#666',
            fontSize: '0.88rem',
            fontWeight: active === item.id ? 500 : 400,
            cursor: 'pointer',
          }}>
            {item.label}
          </button>
        ))}
      </nav>

      {stats && (
        <div style={{ padding: '12px 14px', margin: '0 10px 16px', borderRadius: 5, background: '#f7f5f0', border: '1px solid #e2ddd6' }}>
          <div style={{ fontSize: '0.7rem', color: '#999', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>System</div>
          {[
            { label: 'Jobs', value: stats.jobs },
            { label: 'Candidates', value: stats.candidates },
            { label: 'Embeddings', value: stats.embeddings_ready ? 'Ready' : 'Off' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 3 }}>
              <span style={{ color: '#888' }}>{r.label}</span>
              <span style={{ color: '#1a1a1a', fontWeight: 500 }}>{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}