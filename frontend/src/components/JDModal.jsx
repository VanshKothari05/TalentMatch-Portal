import React from 'react'

export default function JDModal({ job, onClose }) {
  if (!job) return null

  const hasDescription = job.description && job.description.trim().length > 0

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.18)', zIndex: 300 }}
      />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 680, maxHeight: '80vh',
        background: '#fff', border: '1px solid #e2ddd6',
        borderRadius: 8, zIndex: 301,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>

        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #e2ddd6', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 3 }}>{job.title}</div>
              <div style={{ fontSize: '0.78rem', color: '#888' }}>
                {job.company && <span>{job.company} · </span>}
                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem' }}>{job.id}</span>
                <span style={{ marginLeft: 8, padding: '1px 7px', border: '1px solid #e2ddd6', borderRadius: 3, fontSize: '0.72rem', color: '#666' }}>{job.hiring_mode}</span>
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'none', border: '1px solid #e2ddd6', borderRadius: 5,
              padding: '4px 12px', fontSize: '0.8rem', color: '#666', cursor: 'pointer',
            }}>Close</button>
          </div>

          <div style={{ display: 'flex', gap: 24, marginTop: 14, fontSize: '0.78rem' }}>
            <div>
              <span style={{ color: '#999', marginRight: 6 }}>Experience</span>
              <span style={{ color: '#333' }}>{job.min_experience}–{job.max_experience} years</span>
            </div>
            {job.required_skills?.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                <span style={{ color: '#999' }}>Required</span>
                {job.required_skills.map(s => (
                  <span key={s} style={{ padding: '1px 7px', border: '1px solid #a8d5b5', borderRadius: 3, fontSize: '0.72rem', color: '#2d6a3f', background: '#f0f8f2' }}>{s}</span>
                ))}
              </div>
            )}
            {job.preferred_skills?.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                <span style={{ color: '#999' }}>Preferred</span>
                {job.preferred_skills.map(s => (
                  <span key={s} style={{ padding: '1px 7px', border: '1px solid #e2ddd6', borderRadius: 3, fontSize: '0.72rem', color: '#666' }}>{s}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {hasDescription ? (
            <div style={{
              fontSize: '0.83rem', color: '#333', lineHeight: 1.75,
              whiteSpace: 'pre-wrap', fontFamily: 'var(--font)',
            }}>
              {job.description.trim()}
            </div>
          ) : (
            <div style={{ color: '#aaa', fontSize: '0.85rem', textAlign: 'center', padding: '40px 0' }}>
              No description text available for this job.
            </div>
          )}
        </div>
      </div>
    </>
  )
}