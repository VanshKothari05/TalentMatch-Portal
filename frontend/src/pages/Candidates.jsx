import React, { useState } from 'react'

export default function Candidates({ candidates, onNav }) {
  const [q, setQ] = useState('')
  const filtered = candidates.filter(c =>
    c.name.toLowerCase().includes(q.toLowerCase()) ||
    (c.skills || []).some(s => s.toLowerCase().includes(q.toLowerCase()))
  )

  if (!candidates.length) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#bbb', fontSize: '0.88rem' }}>
      No candidates loaded. <button className="btn" style={{ marginLeft: 8 }} onClick={() => onNav('upload')}>Upload candidates</button>
    </div>
  )

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 }}>Candidates</h1>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>{candidates.length} candidate{candidates.length !== 1 ? 's' : ''} indexed.</p>
      </div>
      <div style={{ marginBottom: 16 }}>
        <input placeholder="Search by name or skill..." value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div style={{ border: '1px solid #e2ddd6', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2ddd6', background: '#f7f5f0' }}>
              {['Name', 'Role', 'Experience', 'Skills', 'Complete'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.72rem', color: '#888', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f0ede8' : 'none' }}>
                <td style={{ padding: '9px 12px', fontWeight: 500 }}>{c.name}</td>
                <td style={{ padding: '9px 12px', color: '#666' }}>{c.current_role || '—'}</td>
                <td style={{ padding: '9px 12px', color: '#888', fontFamily: 'var(--mono)', fontSize: '0.78rem' }}>{c.years_experience}y</td>
                <td style={{ padding: '9px 12px' }}>
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {(c.skills || []).slice(0, 5).map(s => <span key={s} className="tag">{s}</span>)}
                    {(c.skills || []).length > 5 && <span className="tag">+{c.skills.length - 5}</span>}
                  </div>
                </td>
                <td style={{ padding: '9px 12px', color: '#888', fontFamily: 'var(--mono)', fontSize: '0.78rem' }}>{c.completeness}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}