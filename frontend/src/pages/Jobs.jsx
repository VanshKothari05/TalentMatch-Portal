import React, { useState } from 'react'
import JDModal from '../components/JDModal'

export default function Jobs({ jobs, onNav }) {
  const [viewing, setViewing] = useState(null)

  if (!jobs.length) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#bbb', fontSize: '0.88rem' }}>
      No jobs loaded.{' '}
      <button className="btn" style={{ marginLeft: 8 }} onClick={() => onNav('upload')}>Upload jobs</button>
    </div>
  )

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 }}>All jobs</h1>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          {jobs.length} job description{jobs.length !== 1 ? 's' : ''} in index.
        </p>
      </div>

      <div style={{ border: '1px solid #e2ddd6', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
        {jobs.map((j, i) => (
          <div key={j.id} style={{
            padding: '14px 18px',
            borderBottom: i < jobs.length - 1 ? '1px solid #f0ede8' : 'none',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 500, marginBottom: 2 }}>{j.title}</div>
                <div style={{ fontSize: '0.78rem', color: '#888' }}>
                  {j.company || 'No company'} ·{' '}
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.73rem' }}>{j.id}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', border: '1px solid #e2ddd6', borderRadius: 3, color: '#666', fontFamily: 'var(--mono)' }}>
                  {j.hiring_mode}
                </span>
                <button
                  className="btn"
                  style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                  onClick={() => setViewing(j)}
                >
                  View JD
                </button>
              </div>
            </div>

            {j.required_skills?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {j.required_skills.map(s => (
                  <span key={s} className="tag">{s}</span>
                ))}
              </div>
            )}

            {j.description && (
              <div style={{
                marginTop: 10, fontSize: '0.78rem', color: '#888',
                lineHeight: 1.5, display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {j.description.trim().split('\n').filter(l => l.trim()).slice(0, 2).join(' ')}
              </div>
            )}
          </div>
        ))}
      </div>

      <JDModal job={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}