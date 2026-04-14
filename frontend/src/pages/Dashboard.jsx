import React from 'react'

export default function Dashboard({ stats, onNav }) {
  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 }}>
          Job-Candidate Matching Engine
        </h1>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          Hybrid keyword, semantic, and rule-based ranking system.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Jobs loaded',  value: stats?.jobs       ?? '—' },
          { label: 'Candidates',   value: stats?.candidates ?? '—' },
          { label: 'Semantic AI',  value: stats?.embeddings_ready ? 'Active' : 'Offline' },
        ].map(s => (
          <div key={s.label} className="card">
            <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 600, letterSpacing: '-0.02em' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '0.78rem', color: '#999', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>How scoring works</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { title: 'Keyword match',   desc: 'Exact skill overlap. Required skills weighted 2× over preferred skills.' },
            { title: 'Semantic match',  desc: 'Sentence embeddings via FAISS. Captures related skills — Django ≈ Express.js.' },
            { title: 'Rules',           desc: 'Experience window, overqualification check, profile completeness.' },
          ].map(s => (
            <div key={s.title} style={{ borderLeft: '2px solid #e2ddd6', paddingLeft: 12 }}>
              <div style={{ fontWeight: 500, fontSize: '0.88rem', marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: '0.8rem', color: '#666', lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: '0.78rem', color: '#999', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Weight profiles by hiring mode</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2ddd6' }}>
              {['Mode', 'Keyword', 'Semantic', 'Rules'].map(h => (
                <th key={h} style={{ padding: '5px 8px', textAlign: 'left', color: '#999', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['product', '60%', '25%', '15%'],
              ['ai',      '30%', '50%', '20%'],
              ['fresher', '40%', '40%', '20%'],
              ['default', '45%', '35%', '20%'],
            ].map(r => (
              <tr key={r[0]} style={{ borderBottom: '1px solid #f0ede8' }}>
                <td style={{ padding: '7px 8px', fontFamily: 'var(--mono)', fontSize: '0.8rem' }}>{r[0]}</td>
                {r.slice(1).map((v, i) => <td key={i} style={{ padding: '7px 8px', color: '#555' }}>{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}